package com.mobinest.admin.coupon;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AdminCouponDtos {

    private AdminCouponDtos() {}

    /**
     * Create (POST, {@code code} required) or full update (PUT, code comes from the path and can't change).
     * PERCENT: {@code discountValue} 1-100 (% off), optionally capped by {@code maxDiscount}.
     * FLAT: {@code discountValue} rupees off. {@code minSubtotal}/{@code maxSubtotal} limit the cart value.
     */
    public record CouponRequest(
            @Pattern(regexp = "^[A-Za-z0-9_-]{3,30}$", message = "3-30 letters, digits, - or _") String code,
            @NotBlank(message = "Enter a description") @Size(max = 200) String description,
            @NotBlank @Pattern(regexp = "(?i)PERCENT|FLAT", message = "PERCENT or FLAT") String discountType,
            @NotNull(message = "Enter the discount") @DecimalMin(value = "1", message = "must be at least 1")
            @DecimalMax(value = "100000", message = "is too high") @Digits(integer = 10, fraction = 2) BigDecimal discountValue,
            @DecimalMin(value = "1", message = "must be at least ₹1") @Digits(integer = 10, fraction = 2) BigDecimal maxDiscount,
            @DecimalMin(value = "0", message = "can't be negative") @Digits(integer = 10, fraction = 2) BigDecimal minSubtotal,
            @DecimalMin(value = "1", message = "must be at least ₹1") @Digits(integer = 10, fraction = 2) BigDecimal maxSubtotal,
            Instant validUntil,
            Boolean active) {}

    /** {@code usable}: active and not expired. Usage counts exclude cancelled orders. */
    public record CouponRow(String code, String description, String discountType, BigDecimal discountValue,
            BigDecimal maxDiscount, BigDecimal minSubtotal, BigDecimal maxSubtotal, boolean active, Instant validUntil,
            boolean expired, boolean usable, long timesUsed, BigDecimal discountGiven) {}
}
