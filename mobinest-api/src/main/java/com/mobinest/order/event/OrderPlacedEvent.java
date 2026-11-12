package com.mobinest.order.event;

import java.math.BigDecimal;

/** Published after checkout; listeners send emails, alert low stock, etc. (Observer pattern). */
public record OrderPlacedEvent(String orderNumber, String email, BigDecimal total) {}
