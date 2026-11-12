package com.mobinest.order.payment;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A verified Razorpay webhook, stored once per x-razorpay-event-id (duplicates are skipped). */
@Entity
@Table(name = "payment_webhook_event")
@Getter
@Setter
@NoArgsConstructor
public class WebhookEvent {

    @Id
    @Column(name = "event_id", length = 64)
    private String eventId;

    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;

    @Column(name = "provider_order_id", length = 40)
    private String providerOrderId;

    @Column(name = "provider_payment_id", length = 40)
    private String providerPaymentId;

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String payload;

    @CreationTimestamp
    @Column(name = "received_at", nullable = false, updatable = false)
    private Instant receivedAt;
}
