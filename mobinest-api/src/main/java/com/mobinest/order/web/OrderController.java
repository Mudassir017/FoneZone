package com.mobinest.order.web;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mobinest.order.dto.OrderDtos.OrderResponse;
import com.mobinest.order.dto.OrderDtos.PlaceOrderRequest;
import com.mobinest.order.service.OrderService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Orders")
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orders;

    @Operation(summary = "Place an order (guest, or signed-in with a Clerk token)")
    @PostMapping
    public ResponseEntity<OrderResponse> place(@Valid @RequestBody PlaceOrderRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        OrderResponse order = orders.placeOrder(request, jwt);
        return ResponseEntity.created(URI.create("/api/orders/" + order.id())).body(order);
    }

    @Operation(summary = "My order history")
    @SecurityRequirement(name = "clerk")
    @GetMapping("/me")
    public List<OrderResponse> mine(@AuthenticationPrincipal Jwt jwt) {
        return orders.myOrders(jwt.getSubject());
    }

    @Operation(summary = "One of my orders")
    @SecurityRequirement(name = "clerk")
    @GetMapping("/{orderNumber}")
    public OrderResponse one(@AuthenticationPrincipal Jwt jwt, @PathVariable String orderNumber) {
        return orders.myOrder(jwt.getSubject(), orderNumber);
    }
}
