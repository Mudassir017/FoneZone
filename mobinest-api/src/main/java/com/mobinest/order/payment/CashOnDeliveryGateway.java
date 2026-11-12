package com.mobinest.order.payment;

import org.springframework.stereotype.Component;

import com.mobinest.order.domain.CustomerOrder;
import com.mobinest.order.domain.OrderEnums.PaymentMethod;
import com.mobinest.order.domain.OrderEnums.PaymentStatus;

/** Cash on delivery: nothing to charge now; the courier collects payment. */
@Component
public class CashOnDeliveryGateway implements PaymentGateway {

    @Override
    public boolean supports(PaymentMethod method) {
        return method == PaymentMethod.COD;
    }

    @Override
    public PaymentResult initiate(CustomerOrder order) {
        return new PaymentResult(PaymentStatus.PENDING, "COD");
    }
}
