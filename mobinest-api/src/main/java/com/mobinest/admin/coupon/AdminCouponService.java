package com.mobinest.admin.coupon;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mobinest.admin.audit.AuditService;
import com.mobinest.admin.common.AdminActor;
import com.mobinest.admin.common.AdminPaging;
import com.mobinest.admin.common.FieldValidationException;
import com.mobinest.admin.common.Params;
import com.mobinest.admin.coupon.AdminCouponDtos.CouponRequest;
import com.mobinest.admin.coupon.AdminCouponDtos.CouponRow;
import com.mobinest.common.error.BusinessRuleException;
import com.mobinest.common.error.NotFoundException;
import com.mobinest.common.web.PageResponse;
import com.mobinest.order.coupon.Coupon;
import com.mobinest.order.coupon.DiscountType;

import lombok.RequiredArgsConstructor;

/**
 * Coupon management. Coupons are never deleted (orders reference their codes); "delete" deactivates.
 * Checkout keeps using {@code CouponService}, so changes apply to the next validation/checkout.
 */
@Service
@RequiredArgsConstructor
public class AdminCouponService {

    private static final Map<String, String> SORTS = Map.of(
        "code", "code", "validUntil", "validUntil", "discountValue", "discountValue", "active", "active");

    private final AdminCouponRepository coupons;
    private final NamedParameterJdbcTemplate jdbc;
    private final AuditService audit;

    @Transactional(readOnly = true)
    public PageResponse<CouponRow> list(Boolean active, String q, Integer page, Integer size, String sort) {
        Specification<Coupon> spec = (root, query, cb) -> cb.conjunction();
        if (active != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("active"), active));
        }
        String text = Params.blankToNull(q);
        if (text != null) {
            String like = Params.likeContains(text);
            spec = spec.and((root, query, cb) -> cb.or(cb.like(cb.lower(root.get("code")), like, '\\'),
                cb.like(cb.lower(root.get("description")), like, '\\')));
        }
        // Sort.by("code") only: Coupon's id IS the code, AdminPaging adds "id" which doesn't exist here
        var pageable = AdminPaging.of(page, size, null, SORTS, Sort.by("code"));
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String path = SORTS.get(parts[0].trim());
            if (path == null) {
                throw FieldValidationException.of("sort", "can be one of " + String.join(", ", SORTS.keySet()));
            }
            Sort.Direction dir = parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim()) ? Sort.Direction.DESC : Sort.Direction.ASC;
            pageable = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(dir, path).and(Sort.by("code")));
        }
        Page<Coupon> result = coupons.findAll(spec, pageable);
        Map<String, Object[]> usage = usage(result.getContent().stream().map(Coupon::getCode).toList());
        return PageResponse.of(result, c -> toRow(c, usage.get(c.getCode())));
    }

    @Transactional(readOnly = true)
    public CouponRow get(String code) {
        Coupon c = find(code);
        return toRow(c, usage(List.of(c.getCode())).get(c.getCode()));
    }

    @Transactional
    public CouponRow create(CouponRequest req, AdminActor actor) {
        if (req.code() == null || req.code().isBlank()) {
            throw FieldValidationException.of("code", "Enter a code");
        }
        String code = req.code().trim().toUpperCase(Locale.ROOT);
        if (coupons.existsById(code)) {
            throw new BusinessRuleException(HttpStatus.CONFLICT, "COUPON_EXISTS", "Coupon " + code + " already exists");
        }
        Coupon c = new Coupon();
        c.setCode(code);
        apply(c, req, true);
        coupons.save(c);
        audit.record(actor, "COUPON_CREATE", "COUPON", code, describe(c));
        return toRow(c, null);
    }

    @Transactional
    public CouponRow update(String code, CouponRequest req, AdminActor actor) {
        Coupon c = find(code);
        if (req.code() != null && !req.code().isBlank() && !req.code().trim().equalsIgnoreCase(c.getCode())) {
            throw FieldValidationException.of("code", "The code can't be changed; create a new coupon instead");
        }
        String before = describe(c);
        apply(c, req, false);
        String after = describe(c);
        if (!before.equals(after)) {
            audit.record(actor, "COUPON_UPDATE", "COUPON", c.getCode(), "before: " + before + " | after: " + after);
        }
        coupons.flush();
        return get(c.getCode());
    }

    /** Soft delete: the coupon stops working at checkout but stays for order history. */
    @Transactional
    public CouponRow deactivate(String code, AdminActor actor) {
        Coupon c = find(code);
        if (c.isActive()) {
            c.setActive(false);
            audit.record(actor, "COUPON_DEACTIVATE", "COUPON", c.getCode(), "active true -> false");
            coupons.flush();
        }
        return get(c.getCode());
    }

    private Coupon find(String code) {
        String key = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        return coupons.findById(key).orElseThrow(() -> new NotFoundException("Coupon", key));
    }

    private static void apply(Coupon c, CouponRequest req, boolean creating) {
        DiscountType type = DiscountType.valueOf(req.discountType().trim().toUpperCase(Locale.ROOT));
        BigDecimal min = req.minSubtotal() == null ? BigDecimal.ZERO : req.minSubtotal();
        Map<String, String> errors = new LinkedHashMap<>();
        if (type == DiscountType.PERCENT && req.discountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            errors.put("discountValue", "A percentage can't be more than 100");
        }
        if (type == DiscountType.FLAT && req.maxDiscount() != null) {
            errors.put("maxDiscount", "Only percentage coupons have a maximum discount");
        }
        if (req.maxSubtotal() != null && req.maxSubtotal().compareTo(min) < 0) {
            errors.put("maxSubtotal", "must be more than the minimum order value");
        }
        boolean validUntilChanged = !Objects.equals(req.validUntil(), c.getValidUntil());
        if (req.validUntil() != null && (creating || validUntilChanged) && req.validUntil().isBefore(Instant.now())) {
            errors.put("validUntil", "must be in the future");
        }
        if (!errors.isEmpty()) {
            throw new FieldValidationException(errors);
        }
        c.setDescription(req.description().trim());
        c.setDiscountType(type);
        c.setDiscountValue(req.discountValue());
        c.setMaxDiscount(req.maxDiscount());
        c.setMinSubtotal(min);
        c.setMaxSubtotal(req.maxSubtotal());
        c.setValidUntil(req.validUntil());
        c.setActive(req.active() == null || req.active());
    }

    private Map<String, Object[]> usage(List<String> codes) {
        Map<String, Object[]> usage = new HashMap<>();
        if (codes.isEmpty()) {
            return usage;
        }
        jdbc.query("SELECT coupon_code c, COUNT(*) n, COALESCE(SUM(coupon_discount), 0) d FROM orders"
                + " WHERE coupon_code IN (:codes) AND status <> 'CANCELLED' GROUP BY coupon_code",
            Map.of("codes", codes),
            rs -> {
                usage.put(rs.getString("c"), new Object[] {rs.getLong("n"), rs.getBigDecimal("d")});
            });
        return usage;
    }

    private static CouponRow toRow(Coupon c, Object[] usage) {
        boolean expired = c.getValidUntil() != null && !c.getValidUntil().isAfter(Instant.now());
        return new CouponRow(c.getCode(), c.getDescription(), c.getDiscountType().name(), c.getDiscountValue(),
            c.getMaxDiscount(), c.getMinSubtotal(), c.getMaxSubtotal(), c.isActive(), c.getValidUntil(), expired,
            c.isActive() && !expired, usage == null ? 0 : (Long) usage[0],
            usage == null ? BigDecimal.ZERO : (BigDecimal) usage[1]);
    }

    private static String describe(Coupon c) {
        List<String> parts = new ArrayList<>();
        parts.add(c.getDiscountType() + " " + plain(c.getDiscountValue()));
        if (c.getMaxDiscount() != null) {
            parts.add("max " + plain(c.getMaxDiscount()));
        }
        parts.add("min " + plain(c.getMinSubtotal()));
        if (c.getMaxSubtotal() != null) {
            parts.add("upTo " + plain(c.getMaxSubtotal()));
        }
        parts.add("validUntil " + c.getValidUntil());
        parts.add("active " + c.isActive());
        parts.add("'" + c.getDescription() + "'");
        return String.join(", ", parts);
    }

    private static String plain(BigDecimal v) {
        return v == null ? "-" : v.stripTrailingZeros().toPlainString();
    }
}
