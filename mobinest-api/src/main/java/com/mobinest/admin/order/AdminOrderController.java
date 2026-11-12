package com.mobinest.admin.order;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mobinest.admin.common.CurrentAdmin;
import com.mobinest.admin.order.AdminOrderDtos.OrderDetail;
import com.mobinest.admin.order.AdminOrderDtos.OrderSummary;
import com.mobinest.admin.order.AdminOrderDtos.PaymentChangeRequest;
import com.mobinest.admin.order.AdminOrderDtos.StatusChangeRequest;
import com.mobinest.common.web.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Admin: orders")
@SecurityRequirement(name = "clerk")
@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final AdminOrderService orders;
    private final CurrentAdmin currentAdmin;

    @Operation(summary = "Search orders (filters, paging, sort=createdAt|updatedAt|total|orderNumber|status|itemCount,asc|desc)")
    @GetMapping
    public PageResponse<OrderSummary> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        return orders.search(OrderFilter.parse(status, paymentMethod, paymentStatus, from, to, q), page, size, sort);
    }

    @Operation(summary = "Order detail with items, address, payment and timeline")
    @GetMapping("/{orderNumber}")
    public OrderDetail detail(@PathVariable String orderNumber) {
        return orders.detail(orderNumber);
    }

    @Operation(summary = "Change the order status (CONFIRMED -> SHIPPED -> DELIVERED, or CANCELLED; cancelling restocks)")
    @PostMapping("/{orderNumber}/status")
    public OrderDetail changeStatus(@PathVariable String orderNumber, @Valid @RequestBody StatusChangeRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return orders.changeStatus(orderNumber, request, currentAdmin.from(jwt));
    }

    @Operation(summary = "Change the payment status (e.g. mark COD paid, record a refund)")
    @PostMapping("/{orderNumber}/payment")
    public OrderDetail changePayment(@PathVariable String orderNumber, @Valid @RequestBody PaymentChangeRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return orders.changePayment(orderNumber, request, currentAdmin.from(jwt));
    }
}
