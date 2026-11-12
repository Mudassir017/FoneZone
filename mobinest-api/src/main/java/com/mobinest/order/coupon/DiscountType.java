package com.mobinest.order.coupon;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Strategy pattern: each discount type knows how to compute its raw discount.
 * Adding a new kind (e.g. BUY_X_GET_Y) means adding a constant, not editing if/else chains.
 */
public enum DiscountType {

    PERCENT {
        @Override
        BigDecimal rawDiscount(BigDecimal subtotal, BigDecimal value) {
            return subtotal.multiply(value).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        }
    },

    FLAT {
        @Override
        BigDecimal rawDiscount(BigDecimal subtotal, BigDecimal value) {
            return value;
        }
    };

    abstract BigDecimal rawDiscount(BigDecimal subtotal, BigDecimal value);
}
