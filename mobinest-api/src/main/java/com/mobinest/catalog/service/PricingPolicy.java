package com.mobinest.catalog.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

/**
 * How a phone's selling price is derived from its launch price (MRP):
 * <pre>price = MRP x (1 - phone discount) x condition price factor, rounded to the nearest Rs. ..99</pre>
 * Used when SKUs are created; after that each SKU's stored price is the source of truth
 * (an admin can override a single SKU without touching this rule).
 */
@Component
public class PricingPolicy {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal MIN_PRICE = BigDecimal.valueOf(99);

    public BigDecimal sellingPrice(BigDecimal mrp, BigDecimal discount, BigDecimal priceFactor) {
        BigDecimal raw = mrp.multiply(BigDecimal.ONE.subtract(discount)).multiply(priceFactor);
        if (raw.compareTo(mrp) == 0) {
            return mrp.setScale(2, RoundingMode.UNNECESSARY);
        }
        // Retail rounding: 23456 -> 23499
        BigDecimal rounded = raw.divide(HUNDRED, 0, RoundingMode.HALF_UP).multiply(HUNDRED).subtract(BigDecimal.ONE);
        return rounded.max(MIN_PRICE).setScale(2, RoundingMode.UNNECESSARY);
    }
}
