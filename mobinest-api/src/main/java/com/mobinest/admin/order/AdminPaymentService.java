package com.mobinest.admin.order;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mobinest.admin.common.AdminPaging;
import com.mobinest.admin.order.AdminOrderDtos.Bucket;
import com.mobinest.admin.order.AdminOrderDtos.PaymentRecord;
import com.mobinest.admin.order.AdminOrderDtos.PaymentSummary;
import com.mobinest.common.web.PageResponse;
import com.mobinest.order.domain.OrderEnums.PaymentMethod;

import lombok.RequiredArgsConstructor;

/**
 * Payment records. Today every order carries exactly one payment (method, status, reference,
 * amount = order total), so the records are read from {@code orders}. When Razorpay arrives with
 * its own payment table, only this service needs to change; the API shape can stay.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPaymentService {

    private static final Map<String, String> SORTS = Map.of(
        "createdAt", "createdAt", "updatedAt", "updatedAt", "amount", "total",
        "method", "paymentMethod", "status", "paymentStatus");

    private final AdminOrderRepository orders;
    private final AdminOrderMapper mapper;
    private final NamedParameterJdbcTemplate jdbc;

    public PageResponse<PaymentRecord> search(OrderFilter filter, Integer page, Integer size, String sort) {
        var pageable = AdminPaging.of(page, size, sort, SORTS,
            Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")));
        return PageResponse.of(orders.findAll(filter.toSpecification(), pageable), mapper::toPayment);
    }

    /** Count and amount per payment method and per payment status, for the same filters as the list. */
    public PaymentSummary summary(OrderFilter filter) {
        Map<String, Object> params = new HashMap<>();
        String where = filter.toSqlWhere(params);

        List<Bucket> byMethod = new ArrayList<>();
        jdbc.query("SELECT o.payment_method k, COUNT(*) n, COALESCE(SUM(o.total),0) amt FROM orders o" + where
                + " GROUP BY o.payment_method ORDER BY amt DESC", params,
            rs -> {
                String key = rs.getString("k");
                byMethod.add(new Bucket(key, methodLabel(key), rs.getLong("n"), rs.getBigDecimal("amt")));
            });

        List<Bucket> byStatus = new ArrayList<>();
        jdbc.query("SELECT o.payment_status k, COUNT(*) n, COALESCE(SUM(o.total),0) amt FROM orders o" + where
                + " GROUP BY o.payment_status ORDER BY amt DESC", params,
            rs -> {
                String key = rs.getString("k");
                byStatus.add(new Bucket(key, key.charAt(0) + key.substring(1).toLowerCase(), rs.getLong("n"),
                    rs.getBigDecimal("amt")));
            });

        long count = byStatus.stream().mapToLong(Bucket::count).sum();
        BigDecimal amount = byStatus.stream().map(Bucket::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PaymentSummary(count, amount, byMethod, byStatus);
    }

    private static String methodLabel(String name) {
        try {
            return PaymentMethod.valueOf(name).label();
        } catch (IllegalArgumentException ex) {
            return name;
        }
    }
}
