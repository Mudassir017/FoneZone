package com.mobinest.order.coupon;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.mobinest.order.service.CheckoutRules;

class CouponTest {

    @Test
    void percentCouponIsCappedByMaxDiscount() {
        Coupon welcome = coupon(DiscountType.PERCENT, "10", "2000");
        assertThat(welcome.discountFor(new BigDecimal("15000"))).isEqualByComparingTo("1500");
        assertThat(welcome.discountFor(new BigDecimal("149900"))).isEqualByComparingTo("2000");
    }

    @Test
    void flatCouponNeverExceedsSubtotal() {
        Coupon flat = coupon(DiscountType.FLAT, "1000", null);
        assertThat(flat.discountFor(new BigDecimal("30000"))).isEqualByComparingTo("1000");
        assertThat(flat.discountFor(new BigDecimal("600"))).isEqualByComparingTo("600");
    }

    @Test
    void shippingIsFreeFrom499() {
        assertThat(CheckoutRules.shippingFor(new BigDecimal("498"))).isEqualByComparingTo("49");
        assertThat(CheckoutRules.shippingFor(new BigDecimal("499"))).isEqualByComparingTo("0");
    }

    private static Coupon coupon(DiscountType type, String value, String max) {
        Coupon c = new Coupon();
        c.setCode("TEST");
        c.setDiscountType(type);
        c.setDiscountValue(new BigDecimal(value));
        c.setMaxDiscount(max == null ? null : new BigDecimal(max));
        return c;
    }
}
