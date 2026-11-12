package com.mobinest.admin.order;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import com.mobinest.order.domain.CustomerOrder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One change to an order made in the back office: a status change (CONFIRMED to SHIPPED...) or a
 * payment status change (PENDING to PAID...), with who made it and when. Append-only.
 */
@Entity
@Table(name = "order_status_history")
@Getter
@Setter
@NoArgsConstructor
public class OrderStatusHistory {

    public enum Kind { STATUS, PAYMENT }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id")
    private CustomerOrder order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private Kind kind;

    @Column(name = "from_value", length = 20)
    private String fromValue;

    @Column(name = "to_value", nullable = false, length = 20)
    private String toValue;

    @Column(length = 500)
    private String note;

    /** Clerk user id of the admin who made the change. */
    @Column(name = "changed_by", nullable = false, length = 64)
    private String changedBy;

    /** Email or name of that admin at the time (display only). */
    @Column(name = "changed_by_name", length = 160)
    private String changedByName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
