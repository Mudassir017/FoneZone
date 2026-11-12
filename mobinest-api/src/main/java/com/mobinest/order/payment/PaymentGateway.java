package com.mobinest.order.payment;

import com.mobinest.order.domain.CustomerOrder;
import com.mobinest.order.domain.OrderEnums.PaymentMethod;
import com.mobinest.order.domain.OrderEnums.PaymentStatus;

/**
 * Strategy + adapter for payment providers. The order service picks the gateway that
 * supports the chosen method, so adding Razorpay later means adding one class
 * (e.g. RazorpayGateway) without touching checkout logic.
 */
public interface PaymentGateway {

    boolean supports(PaymentMethod method);

    PaymentResult initiate(CustomerOrder order);

    record PaymentResult(PaymentStatus status, String reference) {}
}
