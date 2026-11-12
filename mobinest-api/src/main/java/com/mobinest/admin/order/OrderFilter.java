package com.mobinest.admin.order;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.data.jpa.domain.Specification;

import com.mobinest.admin.common.Params;
import com.mobinest.order.domain.CustomerOrder;
import com.mobinest.order.domain.OrderEnums.OrderStatus;
import com.mobinest.order.domain.OrderEnums.PaymentMethod;
import com.mobinest.order.domain.OrderEnums.PaymentStatus;

import jakarta.persistence.criteria.Predicate;

/**
 * Filters shared by the admin order list, the payments list and the payment totals.
 * Dates are IST calendar days ({@code to} is inclusive). {@code q} matches order number, email,
 * phone or customer name.
 */
public record OrderFilter(OrderStatus status, PaymentMethod paymentMethod, PaymentStatus paymentStatus,
        LocalDate from, LocalDate to, String q) {

    public static OrderFilter parse(String status, String paymentMethod, String paymentStatus,
            LocalDate from, LocalDate to, String q) {
        Params.checkRange(from, to);
        return new OrderFilter(
            Params.enumOrNull(OrderStatus.class, status, "status"),
            Params.enumOrNull(PaymentMethod.class, paymentMethod, "paymentMethod"),
            Params.enumOrNull(PaymentStatus.class, paymentStatus, "paymentStatus"),
            from, to, Params.blankToNull(q));
    }

    public Specification<CustomerOrder> toSpecification() {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (status != null) {
                p.add(cb.equal(root.get("status"), status));
            }
            if (paymentMethod != null) {
                p.add(cb.equal(root.get("paymentMethod"), paymentMethod));
            }
            if (paymentStatus != null) {
                p.add(cb.equal(root.get("paymentStatus"), paymentStatus));
            }
            Instant start = Params.startOfDay(from);
            if (start != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("createdAt"), start));
            }
            Instant end = Params.endOfDay(to);
            if (end != null) {
                p.add(cb.lessThan(root.get("createdAt"), end));
            }
            if (q != null) {
                String like = Params.likeContains(q);
                p.add(cb.or(
                    cb.like(cb.lower(root.get("orderNumber")), like, '\\'),
                    cb.like(cb.lower(root.get("email")), like, '\\'),
                    cb.like(root.get("shippingAddress").get("phone"), like, '\\'),
                    cb.like(cb.lower(root.get("shippingAddress").get("fullName")), like, '\\')));
            }
            return cb.and(p.toArray(Predicate[]::new));
        };
    }

    /** Same filter as SQL (for aggregate queries); appends to {@code where} and fills {@code params}. */
    public String toSqlWhere(Map<String, Object> params) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        if (status != null) {
            where.append(" AND o.status = :status");
            params.put("status", status.name());
        }
        if (paymentMethod != null) {
            where.append(" AND o.payment_method = :method");
            params.put("method", paymentMethod.name());
        }
        if (paymentStatus != null) {
            where.append(" AND o.payment_status = :pstatus");
            params.put("pstatus", paymentStatus.name());
        }
        if (from != null) {
            where.append(" AND o.created_at >= :from");
            params.put("from", Params.utc(Params.startOfDay(from)));
        }
        if (to != null) {
            where.append(" AND o.created_at < :to");
            params.put("to", Params.utc(Params.endOfDay(to)));
        }
        if (q != null) {
            where.append(" AND (LOWER(o.order_number) LIKE :q OR LOWER(o.email) LIKE :q"
                + " OR o.ship_phone LIKE :q OR LOWER(o.ship_full_name) LIKE :q)");
            params.put("q", Params.likeContains(q));
        }
        return where.toString();
    }
}
