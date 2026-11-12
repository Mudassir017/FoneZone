package com.mobinest.order.coupon;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "coupon")
@Getter
@Setter
@NoArgsConstructor
public class Coupon {

    @Id
    @Column(length = 30)
    private String code;

    @Column(nullable = false, length = 200)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 10)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "max_discount", precision = 12, scale = 2)
    private BigDecimal maxDiscount;

    @Column(name = "min_subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal minSubtotal = BigDecimal.ZERO;

    @Column(name = "max_subtotal", precision = 12, scale = 2)
    private BigDecimal maxSubtotal;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "valid_until")
    private Instant validUntil;

    /** Discount for this subtotal, capped by maxDiscount and never more than the subtotal. */
    public BigDecimal discountFor(BigDecimal subtotal) {
        BigDecimal discount = discountType.rawDiscount(subtotal, discountValue);
        if (maxDiscount != null) {
            discount = discount.min(maxDiscount);
        }
        return discount.min(subtotal).max(BigDecimal.ZERO);
    }
}
