package com.mobinest.catalog.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class PricingPolicyTest {

    private final PricingPolicy pricing = new PricingPolicy();

    @Test
    void newPhoneWithoutDiscountSellsAtMrp() {
        assertThat(pricing.sellingPrice(bd("149900"), bd("0"), bd("1"))).isEqualByComparingTo("149900");
    }

    @Test
    void refurbishedPriceIsRoundedToNinetyNine() {
        // 149900 x 0.78 = 116922 -> 116899
        assertThat(pricing.sellingPrice(bd("149900"), bd("0"), bd("0.78"))).isEqualByComparingTo("116899");
    }

    @Test
    void phoneDiscountAndConditionFactorCombine() {
        // 79900 x 0.88 x 0.64 = 44999.68 -> 44999
        assertThat(pricing.sellingPrice(bd("79900"), bd("0.12"), bd("0.64"))).isEqualByComparingTo("44999");
    }

    @Test
    void neverBelowMinimumPrice() {
        assertThat(pricing.sellingPrice(bd("100"), bd("0"), bd("0.5"))).isEqualByComparingTo("99");
    }

    private static BigDecimal bd(String v) {
        return new BigDecimal(v);
    }
}
