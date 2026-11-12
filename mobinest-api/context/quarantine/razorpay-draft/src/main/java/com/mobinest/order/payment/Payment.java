package com.mobinest.order.payment;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.mobinest.order.domain.CustomerOrder;
import com.mobinest.order.domain.OrderEnums.PaymentStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * The online payment for one order: the Razorpay order we created and the payment that settled it.
 * Amounts are in paise, exactly as Razorpay reports them.
 */
@Entity
@Table(name = "payment")
@Getter
@Setter
@NoArgsConstructor
public class Payment {

    public static final String RAZORPAY = "RAZORPAY";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private CustomerOrder order;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_order_id", nullable = false, unique = true, length = 40)
    private String providerOrderId;

    @Column(name = "provider_payment_id", unique = true, length = 40)
    private String providerPaymentId;

    @Column(length = 128)
    private String signature;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status;

    @Column(name = "amount_paise", nullable = false)
    private long amountPaise;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(length = 20)
    private String method;

    @Column(name = "error_code", length = 60)
    private String errorCode;

    @Column(name = "error_description")
    private String errorDescription;

    @Column(name = "refunded_paise", nullable = false)
    private long refundedPaise;

    @Column(name = "last_refund_id", length = 40)
    private String lastRefundId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Payment razorpay(CustomerOrder order, String razorpayOrderId, long amountPaise) {
        Payment p = new Payment();
        p.setOrder(order);
        p.setProvider(RAZORPAY);
        p.setProviderOrderId(razorpayOrderId);
        p.setAmountPaise(amountPaise);
        p.setStatus(PaymentStatus.PENDING);
        return p;
    }
}
