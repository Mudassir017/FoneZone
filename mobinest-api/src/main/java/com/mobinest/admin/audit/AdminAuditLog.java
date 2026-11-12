package com.mobinest.admin.audit;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Append-only record of every change made through the admin API (who, what, when). */
@Entity
@Table(name = "admin_audit_log")
@Getter
@Setter
@NoArgsConstructor
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_clerk_user_id", nullable = false, length = 64)
    private String actorClerkUserId;

    @Column(name = "actor_name", length = 160)
    private String actorName;

    /** e.g. ORDER_STATUS, PAYMENT_STATUS, SKU_UPDATE, BRAND_UPDATE, COUPON_CREATE, ROLE_CHANGE */
    @Column(nullable = false, length = 40)
    private String action;

    /** ORDER, BRAND, PHONE, SKU, ACCESSORY, COUPON, CUSTOMER */
    @Column(name = "entity_type", nullable = false, length = 30)
    private String entityType;

    @Column(name = "entity_id", nullable = false, length = 160)
    private String entityId;

    @Column(length = 1000)
    private String details;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
