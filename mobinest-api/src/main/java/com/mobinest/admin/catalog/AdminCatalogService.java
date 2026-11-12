package com.mobinest.admin.catalog;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
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
import com.mobinest.admin.catalog.AdminCatalogDtos.AccessoryRow;
import com.mobinest.admin.catalog.AdminCatalogDtos.AccessoryUpdate;
import com.mobinest.admin.catalog.AdminCatalogDtos.BrandRow;
import com.mobinest.admin.catalog.AdminCatalogDtos.BrandUpdate;
import com.mobinest.admin.catalog.AdminCatalogDtos.PhoneRow;
import com.mobinest.admin.catalog.AdminCatalogDtos.PhoneUpdate;
import com.mobinest.admin.catalog.AdminCatalogDtos.SkuRow;
import com.mobinest.admin.catalog.AdminCatalogDtos.SkuUpdate;
import com.mobinest.admin.common.AdminActor;
import com.mobinest.admin.common.AdminPaging;
import com.mobinest.admin.common.FieldValidationException;
import com.mobinest.admin.common.Params;
import com.mobinest.catalog.domain.Accessory;
import com.mobinest.catalog.domain.Brand;
import com.mobinest.catalog.domain.Phone;
import com.mobinest.catalog.domain.Sku;
import com.mobinest.catalog.repo.BrandRepository;
import com.mobinest.catalog.repo.PhoneRepository;
import com.mobinest.common.error.BusinessRuleException;
import com.mobinest.common.error.NotFoundException;
import com.mobinest.common.web.PageResponse;

import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;

/**
 * Back-office catalogue: brand/phone visibility, SKU prices and stock, accessories.
 * <p>
 * Visibility rules stay exactly as in the store: a phone is shown only when it AND its brand are
 * active (see {@code PhoneRepository.findVisible*}). Admin lists include hidden rows and say why.
 * Changes are visible to the store immediately (the storefront reloads the catalogue on page load).
 */
@Service
@RequiredArgsConstructor
public class AdminCatalogService {

    /** Default "low stock" level: a SKU or accessory with this many units or fewer. */
    public static final int LOW_STOCK = 5;

    private final BrandRepository brands;
    private final PhoneRepository phones;
    private final AdminSkuRepository skus;
    private final AdminAccessoryRepository accessories;
    private final NamedParameterJdbcTemplate jdbc;
    private final AuditService audit;

    // ------------------------------------------------------------------ brands

    @Transactional(readOnly = true)
    public List<BrandRow> listBrands() {
        Map<Long, long[]> stats = new HashMap<>();
        jdbc.query("""
            SELECT p.brand_id b, COUNT(DISTINCT p.id) phones,
                   COUNT(DISTINCT CASE WHEN p.active THEN p.id END) active_phones,
                   COUNT(s.id) skus, COALESCE(SUM(s.stock), 0) units,
                   COALESCE(SUM(CASE WHEN s.stock <= :t THEN 1 ELSE 0 END), 0) low
              FROM phone p LEFT JOIN sku s ON s.phone_id = p.id
             GROUP BY p.brand_id""", Map.of("t", LOW_STOCK),
            rs -> {
                stats.put(rs.getLong("b"), new long[] {rs.getLong("phones"), rs.getLong("active_phones"),
                    rs.getLong("skus"), rs.getLong("units"), rs.getLong("low")});
            });
        return brands.findAll(Sort.by("sortOrder", "id")).stream().map(b -> toRow(b, stats)).toList();
    }

    @Transactional
    public BrandRow updateBrand(String slug, BrandUpdate req, AdminActor actor) {
        Brand b = brands.findBySlug(slug).orElseThrow(() -> new NotFoundException("Brand", slug));
        List<String> changes = new ArrayList<>();
        if (req.active() != null && req.active() != b.isActive()) {
            changes.add("active " + b.isActive() + " -> " + req.active());
            b.setActive(req.active());
        }
        if (req.tagline() != null) {
            String tagline = req.tagline().isBlank() ? null : req.tagline().trim();
            if (!Objects.equals(tagline, b.getTagline())) {
                changes.add("tagline '" + b.getTagline() + "' -> '" + tagline + "'");
                b.setTagline(tagline);
            }
        }
        if (!changes.isEmpty()) {
            audit.record(actor, "BRAND_UPDATE", "BRAND", slug, String.join("; ", changes));
        }
        brands.flush();
        return listBrands().stream().filter(r -> r.id().equals(slug)).findFirst().orElseThrow();
    }

    private static BrandRow toRow(Brand b, Map<Long, long[]> stats) {
        long[] s = stats.getOrDefault(b.getId(), new long[5]);
        return new BrandRow(b.getSlug(), b.getName(), b.getTagline(), b.getAccentHex(), b.isActive(), b.getSortOrder(),
            b.getHeroPhoneSlug(), b.getHeroColor(), s[0], s[1], s[2], s[3], s[4]);
    }

    // ------------------------------------------------------------------ phones

    private static final Map<String, String> PHONE_SORTS = Map.of(
        "name", "name", "year", "releaseYear", "updatedAt", "updatedAt", "createdAt", "createdAt", "brand", "brand.name");

    @Transactional(readOnly = true)
    public PageResponse<PhoneRow> listPhones(String brand, Boolean active, Boolean visible, String q,
            Integer page, Integer size, String sort) {
        Specification<Phone> spec = (root, query, cb) -> cb.conjunction();
        String brandSlug = Params.blankToNull(brand);
        if (brandSlug != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("brand").get("slug"), brandSlug));
        }
        if (active != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("active"), active));
        }
        if (visible != null) {
            spec = spec.and((root, query, cb) -> {
                var both = cb.and(cb.isTrue(root.get("active")), cb.isTrue(root.get("brand").get("active")));
                return visible ? both : cb.not(both);
            });
        }
        String text = Params.blankToNull(q);
        if (text != null) {
            String like = Params.likeContains(text);
            spec = spec.and((root, query, cb) -> cb.or(cb.like(cb.lower(root.get("name")), like, '\\'),
                cb.like(cb.lower(root.get("slug")), like, '\\')));
        }
        var pageable = AdminPaging.of(page, size, sort, PHONE_SORTS, Sort.by("brand.sortOrder", "name", "id"));
        Page<Phone> result = phones.findAll(spec, pageable);
        Map<Long, Object[]> stats = phoneStats(result.getContent().stream().map(Phone::getId).toList());
        return PageResponse.of(result, p -> toRow(p, stats.get(p.getId())));
    }

    @Transactional
    public PhoneRow updatePhone(String slug, PhoneUpdate req, AdminActor actor) {
        Phone p = phones.findOne((root, query, cb) -> cb.equal(root.get("slug"), slug))
            .orElseThrow(() -> new NotFoundException("Phone", slug));
        if (req.active() != p.isActive()) {
            audit.record(actor, "PHONE_UPDATE", "PHONE", slug, "active " + p.isActive() + " -> " + req.active());
            p.setActive(req.active());
            phones.flush();
        }
        return toRow(p, phoneStats(List.of(p.getId())).get(p.getId()));
    }

    private Map<Long, Object[]> phoneStats(List<Long> ids) {
        Map<Long, Object[]> stats = new HashMap<>();
        if (ids.isEmpty()) {
            return stats;
        }
        jdbc.query("""
            SELECT s.phone_id id, COUNT(*) skus, COALESCE(SUM(s.stock), 0) units, MIN(s.price) min_price,
                   MAX(s.price) max_price, COALESCE(SUM(CASE WHEN s.stock <= :t THEN 1 ELSE 0 END), 0) low
              FROM sku s WHERE s.phone_id IN (:ids) GROUP BY s.phone_id""", Map.of("ids", ids, "t", LOW_STOCK),
            rs -> {
                stats.put(rs.getLong("id"), new Object[] {rs.getLong("skus"), rs.getLong("units"),
                    rs.getBigDecimal("min_price"), rs.getBigDecimal("max_price"), rs.getLong("low")});
            });
        return stats;
    }

    private static PhoneRow toRow(Phone p, Object[] s) {
        Object[] st = s == null ? new Object[] {0L, 0L, null, null, 0L} : s;
        Brand b = p.getBrand();
        return new PhoneRow(p.getSlug(), p.getName(), b.getSlug(), b.getName(), b.isActive(), p.isActive(),
            p.isActive() && b.isActive(), p.getReleaseYear(), p.isFiveG(), (Long) st[0], (Long) st[1],
            (BigDecimal) st[2], (BigDecimal) st[3], (Long) st[4], p.getUpdatedAt());
    }

    // ------------------------------------------------------------------ SKUs

    private static final Map<String, String> SKU_SORTS = Map.of(
        "stock", "stock", "price", "price", "mrp", "mrp", "skuCode", "skuCode", "phone", "phone.name");

    @Transactional(readOnly = true)
    public PageResponse<SkuRow> listSkus(String phone, String brand, String condition, Boolean lowStock,
            Integer threshold, Boolean visible, String q, Integer page, Integer size, String sort) {
        int limit = threshold == null ? LOW_STOCK : threshold;
        if (limit < 0 || limit > 1000) {
            throw FieldValidationException.of("threshold", "must be between 0 and 1000");
        }
        Specification<Sku> spec = (root, query, cb) -> cb.conjunction();
        String phoneSlug = Params.blankToNull(phone);
        if (phoneSlug != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("phone").get("slug"), phoneSlug));
        }
        String brandSlug = Params.blankToNull(brand);
        if (brandSlug != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("phone").get("brand").get("slug"), brandSlug));
        }
        String cond = Params.blankToNull(condition);
        if (cond != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("condition").get("code"), cond.toLowerCase(Locale.ROOT)));
        }
        if (Boolean.TRUE.equals(lowStock)) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("stock"), limit));
        }
        if (visible != null) {
            spec = spec.and((root, query, cb) -> {
                var phoneJoin = root.join("phone", JoinType.INNER);
                var both = cb.and(cb.isTrue(phoneJoin.get("active")), cb.isTrue(phoneJoin.get("brand").get("active")));
                return visible ? both : cb.not(both);
            });
        }
        String text = Params.blankToNull(q);
        if (text != null) {
            String like = Params.likeContains(text);
            spec = spec.and((root, query, cb) -> cb.or(cb.like(cb.lower(root.get("skuCode")), like, '\\'),
                cb.like(cb.lower(root.get("phone").get("name")), like, '\\')));
        }
        var pageable = AdminPaging.of(page, size, sort, SKU_SORTS, Sort.by("skuCode", "id"));
        return PageResponse.of(skus.findAll(spec, pageable), AdminCatalogService::toRow);
    }

    @Transactional
    public SkuRow updateSku(Long id, SkuUpdate req, AdminActor actor) {
        Sku s = skus.lockById(id).orElseThrow(() -> new NotFoundException("SKU", id));
        checkExpectedStock(req.expectedStock(), s.getStock());
        List<String> changes = applyPriceAndStock(req.price(), req.mrp(), req.stock(), s.getPrice(), s.getMrp(),
            s.getStock(), s::setPrice, s::setMrp, s::setStock);
        if (!changes.isEmpty()) {
            audit.record(actor, "SKU_UPDATE", "SKU", s.getSkuCode(), String.join("; ", changes));
        }
        skus.flush();
        return toRow(s);
    }

    private static SkuRow toRow(Sku s) {
        Phone p = s.getPhone();
        var v = s.getVariant();
        return new SkuRow(s.getId(), s.getSkuCode(), p.getSlug(), p.getName(), p.getBrand().getSlug(), v.label(),
            v.getRamGb(), v.getStorageGb(), s.getColor().getName(), s.getColor().getHex(), s.getCondition().getCode(),
            s.getCondition().getShortLabel(), s.getPrice(), s.getMrp(), s.getStock(),
            p.isActive() && p.getBrand().isActive());
    }

    // ------------------------------------------------------------------ accessories

    private static final Map<String, String> ACCESSORY_SORTS = Map.of(
        "name", "name", "price", "price", "stock", "stock", "updatedAt", "updatedAt", "category", "category.sortOrder");

    @Transactional(readOnly = true)
    public PageResponse<AccessoryRow> listAccessories(String category, Boolean active, Boolean lowStock,
            Integer threshold, String q, Integer page, Integer size, String sort) {
        int limit = threshold == null ? LOW_STOCK : threshold;
        if (limit < 0 || limit > 1000) {
            throw FieldValidationException.of("threshold", "must be between 0 and 1000");
        }
        Specification<Accessory> spec = (root, query, cb) -> cb.conjunction();
        String cat = Params.blankToNull(category);
        if (cat != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category").get("code"), cat));
        }
        if (active != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("active"), active));
        }
        if (Boolean.TRUE.equals(lowStock)) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("stock"), limit));
        }
        String text = Params.blankToNull(q);
        if (text != null) {
            String like = Params.likeContains(text);
            spec = spec.and((root, query, cb) -> cb.or(cb.like(cb.lower(root.get("name")), like, '\\'),
                cb.like(cb.lower(root.get("slug")), like, '\\'), cb.like(cb.lower(root.get("brandLabel")), like, '\\')));
        }
        var pageable = AdminPaging.of(page, size, sort, ACCESSORY_SORTS, Sort.by("id"));
        return PageResponse.of(accessories.findAll(spec, pageable), AdminCatalogService::toRow);
    }

    @Transactional
    public AccessoryRow updateAccessory(String slug, AccessoryUpdate req, AdminActor actor) {
        Accessory a = accessories.lockBySlug(slug).orElseThrow(() -> new NotFoundException("Accessory", slug));
        checkExpectedStock(req.expectedStock(), a.getStock());
        List<String> changes = applyPriceAndStock(req.price(), req.mrp(), req.stock(), a.getPrice(), a.getMrp(),
            a.getStock(), a::setPrice, a::setMrp, a::setStock);
        if (req.active() != null && req.active() != a.isActive()) {
            changes.add("active " + a.isActive() + " -> " + req.active());
            a.setActive(req.active());
        }
        if (!changes.isEmpty()) {
            audit.record(actor, "ACCESSORY_UPDATE", "ACCESSORY", slug, String.join("; ", changes));
        }
        accessories.flush();
        return toRow(a);
    }

    private static AccessoryRow toRow(Accessory a) {
        return new AccessoryRow(a.getSlug(), a.getName(), a.getBrandLabel(), a.getCategory().getCode(),
            a.getCategory().getName(), a.getPrice(), a.getMrp(), a.getStock(), a.isActive(), a.getUpdatedAt());
    }

    // ------------------------------------------------------------------ shared rules

    private static void checkExpectedStock(Integer expected, int actual) {
        if (expected != null && expected != actual) {
            throw new BusinessRuleException(HttpStatus.CONFLICT, "STOCK_CHANGED",
                "Stock changed to " + actual + " since you loaded it (orders may have come in). Refresh and try again.");
        }
    }

    /** Validates price <= MRP on the resulting values, applies the changes and describes them for the audit log. */
    static List<String> applyPriceAndStock(BigDecimal price, BigDecimal mrp, Integer stock,
            BigDecimal oldPrice, BigDecimal oldMrp, int oldStock,
            java.util.function.Consumer<BigDecimal> setPrice, java.util.function.Consumer<BigDecimal> setMrp,
            java.util.function.IntConsumer setStock) {
        BigDecimal newPrice = price == null ? oldPrice : price;
        BigDecimal newMrp = mrp == null ? oldMrp : mrp;
        if (newPrice.compareTo(newMrp) > 0) {
            throw FieldValidationException.of(price != null ? "price" : "mrp",
                "Price (₹" + newPrice.toPlainString() + ") can't be more than MRP (₹" + newMrp.toPlainString() + ")");
        }
        List<String> changes = new ArrayList<>();
        if (price != null && price.compareTo(oldPrice) != 0) {
            changes.add("price " + oldPrice.toPlainString() + " -> " + price.toPlainString());
            setPrice.accept(price);
        }
        if (mrp != null && mrp.compareTo(oldMrp) != 0) {
            changes.add("mrp " + oldMrp.toPlainString() + " -> " + mrp.toPlainString());
            setMrp.accept(mrp);
        }
        if (stock != null && stock != oldStock) {
            changes.add("stock " + oldStock + " -> " + stock);
            setStock.accept(stock);
        }
        return changes;
    }
}
