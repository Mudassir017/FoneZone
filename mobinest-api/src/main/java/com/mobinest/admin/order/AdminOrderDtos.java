package com.mobinest.admin.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.mobinest.order.dto.OrderDtos.AddressDto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request/response shapes of the admin order and payment endpoints. */
public final class AdminOrderDtos {

    private AdminOrderDtos() {}

    // ---------- requests ----------

    /** {@code status}: SHIPPED, DELIVERED or CANCELLED (must be allowed from the current status). */
    public record StatusChangeRequest(
            @NotBlank(message = "Choose the new status") String status,
            @Size(max = 500) String note) {}

    /** {@code status}: PAID, FAILED, PENDING or REFUNDED (must be allowed from the current payment status). */
    public record PaymentChangeRequest(
            @NotBlank(message = "Choose the new payment status") String status,
            @Size(max = 80) String reference,
            @Size(max = 500) String note) {}

    // ---------- responses ----------

    public record OrderSummary(
            String orderNumber,
            Instant createdAt,
            String status,
            String statusLabel,
            String paymentMethod,
            String paymentMethodLabel,
            String paymentStatus,
            BigDecimal total,
            int itemCount,
            String customerName,
            String email,
            String phone,
            String city,
            String couponCode,
            boolean guest) {}

    public record OrderDetail(
            String orderNumber,
            Instant createdAt,
            Instant updatedAt,
            LocalDate estimatedDelivery,
            String status,
            String statusLabel,
            List<String> allowedStatuses,
            List<String> allowedPaymentStatuses,
            CustomerRef customer,
            boolean guest,
            String email,
            AddressDto address,
            PaymentInfo payment,
            String couponCode,
            Totals totals,
            List<Item> items,
            List<TimelineEntry> timeline) {}

    public record CustomerRef(Long id, String clerkUserId, String name, String email, String role) {}

    public record PaymentInfo(String method, String methodLabel, String status, String reference, BigDecimal amount) {}

    public record Totals(BigDecimal subtotal, BigDecimal mrpTotal, BigDecimal productSavings, BigDecimal couponDiscount,
            BigDecimal shipping, BigDecimal total, int itemCount) {}

    public record Item(String type, String productId, String name, String details, String condition,
            String colorName, String colorHex, int qty, BigDecimal unitPrice, BigDecimal unitMrp, BigDecimal lineTotal,
            Long skuId, String skuCode, Long accessoryId, Integer currentStock) {}

    /** kind: PLACED, STATUS or PAYMENT. */
    public record TimelineEntry(String kind, String from, String to, String note, String by, String byId, Instant at) {}

    public record PaymentRecord(
            String orderNumber,
            Instant createdAt,
            Instant updatedAt,
            String method,
            String methodLabel,
            String status,
            String reference,
            BigDecimal amount,
            String orderStatus,
            String customerName,
            String email) {}

    public record Bucket(String key, String label, long count, BigDecimal amount) {}

    public record PaymentSummary(long count, BigDecimal amount, List<Bucket> byMethod, List<Bucket> byStatus) {}
}
