package com.mobinest.admin.dashboard;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mobinest.admin.catalog.AdminCatalogService;
import com.mobinest.admin.common.FieldValidationException;
import com.mobinest.admin.common.Params;
import com.mobinest.admin.dashboard.DashboardDtos.CatalogCounts;
import com.mobinest.admin.dashboard.DashboardDtos.Dashboard;
import com.mobinest.admin.dashboard.DashboardDtos.DayPoint;
import com.mobinest.admin.dashboard.DashboardDtos.LowStock;
import com.mobinest.admin.dashboard.DashboardDtos.LowStockItem;
import com.mobinest.admin.dashboard.DashboardDtos.OrderCounts;
import com.mobinest.admin.dashboard.DashboardDtos.Revenue;
import com.mobinest.admin.dashboard.DashboardDtos.TopProduct;
import com.mobinest.admin.order.AdminOrderMapper;
import com.mobinest.admin.order.AdminOrderRepository;
import com.mobinest.order.domain.OrderEnums.OrderStatus;

import lombok.RequiredArgsConstructor;

/** Read-only KPIs for the admin dashboard, computed with a handful of aggregate SQL queries. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    /** SQL condition for an order that counts as revenue (see {@link Revenue}). */
    private static final String REVENUE_ORDER = "o.status <> 'CANCELLED' AND (o.payment_status = 'PAID'"
        + " OR (o.payment_status = 'PENDING' AND o.payment_method = 'COD'))";

    private final NamedParameterJdbcTemplate jdbc;
    private final AdminOrderRepository orders;
    private final AdminOrderMapper mapper;

    public Dashboard build(Integer days, Integer threshold) {
        int span = days == null ? 30 : days;
        if (span < 7 || span > 90) {
            throw FieldValidationException.of("days", "must be between 7 and 90");
        }
        int low = threshold == null ? AdminCatalogService.LOW_STOCK : threshold;
        if (low < 0 || low > 1000) {
            throw FieldValidationException.of("threshold", "must be between 0 and 1000");
        }
        LocalDate today = LocalDate.now(Params.STORE_ZONE);
        return new Dashboard(Instant.now(), Params.STORE_ZONE.getId(), revenue(), ordersByStatus(),
            orderCounts(today), daily(today, span), topPhones(), lowStock(low),
            orders.findAll(PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "createdAt", "id")))
                .map(mapper::toSummary).getContent(),
            catalogCounts());
    }

    private Revenue revenue() {
        return jdbc.queryForObject("""
            SELECT COALESCE(SUM(CASE WHEN o.status <> 'CANCELLED' AND o.payment_status = 'PAID' THEN o.total END), 0) paid,
                   COALESCE(SUM(CASE WHEN o.status <> 'CANCELLED' AND o.payment_status = 'PENDING'
                                     AND o.payment_method = 'COD' THEN o.total END), 0) cod,
                   COALESCE(SUM(CASE WHEN o.payment_status = 'REFUNDED' THEN o.total END), 0) refunded,
                   COALESCE(SUM(CASE WHEN %s THEN 1 ELSE 0 END), 0) n
              FROM orders o""".formatted(REVENUE_ORDER), Map.of(),
            (rs, i) -> {
                BigDecimal paid = rs.getBigDecimal("paid");
                BigDecimal cod = rs.getBigDecimal("cod");
                BigDecimal total = paid.add(cod);
                long n = rs.getLong("n");
                BigDecimal aov = n == 0 ? BigDecimal.ZERO : total.divide(BigDecimal.valueOf(n), 0, RoundingMode.HALF_UP);
                return new Revenue(total, paid, cod, rs.getBigDecimal("refunded"), n, aov);
            });
    }

    private Map<String, Long> ordersByStatus() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (OrderStatus s : OrderStatus.values()) {
            counts.put(s.name(), 0L);
        }
        jdbc.query("SELECT status s, COUNT(*) n FROM orders GROUP BY status", Map.of(),
            rs -> {
                counts.put(rs.getString("s"), rs.getLong("n"));
            });
        return counts;
    }

    private OrderCounts orderCounts(LocalDate today) {
        Map<String, Object> p = Map.of(
            "d1", Params.utc(Params.startOfDay(today)),
            "d7", Params.utc(Params.startOfDay(today.minusDays(6))),
            "d30", Params.utc(Params.startOfDay(today.minusDays(29))));
        return jdbc.queryForObject("""
            SELECT COALESCE(SUM(CASE WHEN created_at >= :d1 THEN 1 ELSE 0 END), 0) today,
                   COALESCE(SUM(CASE WHEN created_at >= :d7 THEN 1 ELSE 0 END), 0) d7,
                   COALESCE(SUM(CASE WHEN created_at >= :d30 THEN 1 ELSE 0 END), 0) d30,
                   COUNT(*) total
              FROM orders""", p,
            (rs, i) -> new OrderCounts(rs.getLong("today"), rs.getLong("d7"), rs.getLong("d30"), rs.getLong("total")));
    }

    /** One point per IST day (oldest first), zero-filled. Numeric offsets need no MySQL time-zone tables. */
    private List<DayPoint> daily(LocalDate today, int span) {
        LocalDate first = today.minusDays(span - 1L);
        Map<LocalDate, DayPoint> byDay = new HashMap<>();
        jdbc.query("""
            SELECT DATE(CONVERT_TZ(o.created_at, '+00:00', '+05:30')) d, COUNT(*) n,
                   COALESCE(SUM(CASE WHEN %s THEN o.total END), 0) rev
              FROM orders o WHERE o.created_at >= :start
             GROUP BY DATE(CONVERT_TZ(o.created_at, '+00:00', '+05:30'))""".formatted(REVENUE_ORDER),
            Map.of("start", Params.utc(Params.startOfDay(first))),
            rs -> {
                LocalDate d = rs.getObject("d", LocalDate.class);
                byDay.put(d, new DayPoint(d, rs.getLong("n"), rs.getBigDecimal("rev")));
            });
        List<DayPoint> points = new ArrayList<>();
        for (LocalDate d = first; !d.isAfter(today); d = d.plusDays(1)) {
            points.add(byDay.getOrDefault(d, new DayPoint(d, 0, BigDecimal.ZERO)));
        }
        return points;
    }

    private List<TopProduct> topPhones() {
        return jdbc.query("""
            SELECT i.product_slug id, MAX(i.name) name, SUM(i.quantity) units, SUM(i.unit_price * i.quantity) rev
              FROM order_item i JOIN orders o ON o.id = i.order_id
             WHERE o.status <> 'CANCELLED' AND i.item_type = 'PHONE'
             GROUP BY i.product_slug ORDER BY units DESC, rev DESC LIMIT 5""", Map.of(),
            (rs, i) -> new TopProduct(rs.getString("id"), rs.getString("name"), rs.getLong("units"), rs.getBigDecimal("rev")));
    }

    private LowStock lowStock(int threshold) {
        Map<String, Object> p = Map.of("t", threshold);
        long skuCount = jdbc.queryForObject("""
            SELECT COUNT(*) FROM sku s JOIN phone p ON p.id = s.phone_id JOIN brand b ON b.id = p.brand_id
             WHERE s.stock <= :t AND p.active AND b.active""", p, Long.class);
        long accCount = jdbc.queryForObject("SELECT COUNT(*) FROM accessory WHERE stock <= :t AND active", p, Long.class);
        List<LowStockItem> items = new ArrayList<>(jdbc.query("""
            SELECT s.id, s.sku_code, p.name, CONCAT(v.ram_gb, 'GB · ', IF(v.storage_gb >= 1024, CONCAT(v.storage_gb DIV 1024, 'TB'),
                   CONCAT(v.storage_gb, 'GB')), ' · ', c.name, ' · ', g.short_label) details, s.stock
              FROM sku s JOIN phone p ON p.id = s.phone_id JOIN brand b ON b.id = p.brand_id
              JOIN phone_variant v ON v.id = s.variant_id JOIN phone_color c ON c.id = s.color_id
              JOIN condition_grade g ON g.code = s.condition_code
             WHERE s.stock <= :t AND p.active AND b.active
             ORDER BY s.stock ASC, s.sku_code ASC LIMIT 10""", p,
            (rs, i) -> new LowStockItem("sku", String.valueOf(rs.getLong("id")), rs.getString("sku_code"),
                rs.getString("name"), rs.getString("details"), rs.getInt("stock"))));
        items.addAll(jdbc.query("""
            SELECT slug, name, brand_label, stock FROM accessory WHERE stock <= :t AND active
             ORDER BY stock ASC, slug ASC LIMIT 5""", p,
            (rs, i) -> new LowStockItem("accessory", rs.getString("slug"), null, rs.getString("name"),
                rs.getString("brand_label"), rs.getInt("stock"))));
        return new LowStock(threshold, skuCount, accCount, items);
    }

    private CatalogCounts catalogCounts() {
        return jdbc.queryForObject("""
            SELECT (SELECT COUNT(*) FROM brand WHERE active) active_brands,
                   (SELECT COUNT(*) FROM brand) brands,
                   (SELECT COUNT(*) FROM phone p JOIN brand b ON b.id = p.brand_id WHERE p.active AND b.active) visible_phones,
                   (SELECT COUNT(*) FROM phone) phones,
                   (SELECT COUNT(*) FROM sku s JOIN phone p ON p.id = s.phone_id JOIN brand b ON b.id = p.brand_id
                     WHERE p.active AND b.active) visible_skus,
                   (SELECT COALESCE(SUM(s.stock), 0) FROM sku s JOIN phone p ON p.id = s.phone_id
                      JOIN brand b ON b.id = p.brand_id WHERE p.active AND b.active) units,
                   (SELECT COUNT(*) FROM customer) customers,
                   (SELECT COUNT(*) FROM customer WHERE role = 'ADMIN') admins,
                   (SELECT COUNT(*) FROM coupon WHERE active AND (valid_until IS NULL OR valid_until > UTC_TIMESTAMP(6))) coupons
            """, Map.of(),
            (rs, i) -> new CatalogCounts(rs.getLong("active_brands"), rs.getLong("brands"), rs.getLong("visible_phones"),
                rs.getLong("phones"), rs.getLong("visible_skus"), rs.getLong("units"), rs.getLong("customers"),
                rs.getLong("admins"), rs.getLong("coupons")));
    }
}
