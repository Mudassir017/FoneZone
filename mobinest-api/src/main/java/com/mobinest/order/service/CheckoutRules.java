package com.mobinest.order.service;

import java.math.BigDecimal;

/** Store-wide checkout rules (kept in one place; move to config or DB when they need to change at runtime). */
public final class CheckoutRules {

    private CheckoutRules() {}

    public static final BigDecimal FREE_SHIPPING_THRESHOLD = BigDecimal.valueOf(499);
    public static final BigDecimal SHIPPING_FEE = BigDecimal.valueOf(49);
    public static final BigDecimal COD_LIMIT = BigDecimal.valueOf(50_000);
    public static final int DELIVERY_DAYS = 4;

    public static BigDecimal shippingFor(BigDecimal subtotal) {
        return subtotal.signum() == 0 || subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0 ? BigDecimal.ZERO : SHIPPING_FEE;
    }
}
