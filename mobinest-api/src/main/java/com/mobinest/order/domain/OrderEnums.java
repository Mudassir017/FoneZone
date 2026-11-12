package com.mobinest.order.domain;

import java.util.Arrays;

import com.mobinest.common.error.BusinessRuleException;

/** Small enums used by orders, grouped to keep the package tidy. */
public final class OrderEnums {

    private OrderEnums() {}

    public enum OrderStatus {
        CONFIRMED("Confirmed"), SHIPPED("Shipped"), DELIVERED("Delivered"), CANCELLED("Cancelled");

        private final String label;

        OrderStatus(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    public enum PaymentStatus { PENDING, PAID, FAILED, REFUNDED }

    public enum ItemType { PHONE, ACCESSORY }

    /** Codes match the React checkout (upi, card, emi, netbanking, cod). */
    public enum PaymentMethod {
        UPI("upi", "UPI"),
        CARD("card", "Credit / Debit Card"),
        EMI("emi", "EMI"),
        NETBANKING("netbanking", "Net Banking"),
        COD("cod", "Cash on Delivery");

        private final String code;
        private final String label;

        PaymentMethod(String code, String label) {
            this.code = code;
            this.label = label;
        }

        public String code() {
            return code;
        }

        public String label() {
            return label;
        }

        public static PaymentMethod fromCode(String code) {
            return Arrays.stream(values()).filter(m -> m.code.equalsIgnoreCase(code)).findFirst()
                .orElseThrow(() -> new BusinessRuleException("PAYMENT_METHOD_INVALID", "Unknown payment method: " + code));
        }
    }
}
