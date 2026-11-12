package com.mobinest.admin.order;

import java.util.List;

import com.mobinest.order.domain.OrderEnums.OrderStatus;
import com.mobinest.order.domain.OrderEnums.PaymentStatus;

/**
 * Allowed back-office transitions (state machine).
 * <pre>
 * Order:   CONFIRMED -> SHIPPED -> DELIVERED          Payment: PENDING -> PAID | FAILED
 *              |            |                                  FAILED  -> PAID | PENDING
 *              +------------+--> CANCELLED (restocks)          PAID    -> REFUNDED
 * </pre>
 * DELIVERED and CANCELLED are final; REFUNDED is final.
 */
public final class OrderWorkflow {

    private OrderWorkflow() {}

    public static List<OrderStatus> nextStatuses(OrderStatus from) {
        return switch (from) {
            case CONFIRMED -> List.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED);
            case SHIPPED -> List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED);
            default -> List.of();
        };
    }

    public static boolean canMove(OrderStatus from, OrderStatus to) {
        return nextStatuses(from).contains(to);
    }

    public static List<PaymentStatus> nextPaymentStatuses(PaymentStatus from) {
        return switch (from) {
            case PENDING -> List.of(PaymentStatus.PAID, PaymentStatus.FAILED);
            case FAILED -> List.of(PaymentStatus.PAID, PaymentStatus.PENDING);
            case PAID -> List.of(PaymentStatus.REFUNDED);
            default -> List.of();
        };
    }

    public static boolean canMovePayment(PaymentStatus from, PaymentStatus to) {
        return nextPaymentStatuses(from).contains(to);
    }
}
