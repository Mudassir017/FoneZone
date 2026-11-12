package com.mobinest.order.payment;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.mobinest.order.domain.CustomerOrder;
import com.mobinest.order.domain.OrderEnums.PaymentMethod;
import com.mobinest.order.domain.OrderEnums.PaymentStatus;

/**
 * DEMO ONLY: marks online payments (UPI/card/EMI/net banking) as paid immediately.
 * Replace with a RazorpayGateway that creates a Razorpay order and verifies the signature.
 */
@Component
public class DemoOnlineGateway implements PaymentGateway {

    @Override
    public boolean supports(PaymentMethod method) {
        return method != PaymentMethod.COD;
    }

    @Override
    public PaymentResult initiate(CustomerOrder order) {
        return new PaymentResult(PaymentStatus.PAID, "DEMO-" + UUID.randomUUID().toString().substring(0, 8));
    }
}
