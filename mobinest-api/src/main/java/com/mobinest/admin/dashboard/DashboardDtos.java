package com.mobinest.admin.dashboard;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.mobinest.admin.order.AdminOrderDtos.OrderSummary;

public final class DashboardDtos {

    private DashboardDtos() {}

    public record Dashboard(
            Instant generatedAt,
            String timeZone,
            Revenue revenue,
            Map<String, Long> ordersByStatus,
            OrderCounts orders,
            List<DayPoint> daily,
            List<TopProduct> topPhones,
            LowStock lowStock,
            List<OrderSummary> recentOrders,
            CatalogCounts catalog) {}

    /**
     * Revenue = orders that are not cancelled and are either PAID or Cash-on-Delivery still to be
     * collected. {@code orders} is the number of such orders; {@code averageOrderValue} = total / orders.
     */
    public record Revenue(BigDecimal total, BigDecimal paid, BigDecimal codPending, BigDecimal refunded,
            long orders, BigDecimal averageOrderValue) {}

    /** Counted by IST calendar day: today, the last 7 and 30 days including today, and all time. */
    public record OrderCounts(long today, long last7Days, long last30Days, long total) {}

    public record DayPoint(LocalDate date, long orders, BigDecimal revenue) {}

    public record TopProduct(String productId, String name, long units, BigDecimal revenue) {}

    public record LowStockItem(String type, String id, String skuCode, String name, String details, int stock) {}

    /** Store-visible SKUs and active accessories with {@code stock <= threshold}. */
    public record LowStock(int threshold, long skuCount, long accessoryCount, List<LowStockItem> items) {}

    public record CatalogCounts(long activeBrands, long brands, long visiblePhones, long phones, long visibleSkus,
            long unitsInStock, long customers, long admins, long activeCoupons) {}
}
