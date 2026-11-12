package com.mobinest.admin.order;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mobinest.admin.order.AdminOrderDtos.PaymentRecord;
import com.mobinest.admin.order.AdminOrderDtos.PaymentSummary;
import com.mobinest.common.web.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Admin: payments")
@SecurityRequirement(name = "clerk")
@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final AdminPaymentService payments;

    @Operation(summary = "Payment records of all orders (sort=createdAt|updatedAt|amount|method|status,asc|desc)")
    @GetMapping
    public PageResponse<PaymentRecord> list(
            @RequestParam(required = false) String method,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String orderStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        return payments.search(OrderFilter.parse(orderStatus, method, status, from, to, q), page, size, sort);
    }

    @Operation(summary = "Totals per payment method and per payment status (same filters as the list)")
    @GetMapping("/summary")
    public PaymentSummary summary(
            @RequestParam(required = false) String method,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String orderStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q) {
        return payments.summary(OrderFilter.parse(orderStatus, method, status, from, to, q));
    }
}
