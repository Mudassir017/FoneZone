package com.mobinest.order.service;

import org.springframework.stereotype.Component;

import com.mobinest.order.domain.CustomerOrder;
import com.mobinest.order.domain.OrderItem;
import com.mobinest.order.domain.ShippingAddress;
import com.mobinest.order.dto.OrderDtos.AddressDto;
import com.mobinest.order.dto.OrderDtos.OrderItemDto;
import com.mobinest.order.dto.OrderDtos.OrderResponse;
import com.mobinest.order.dto.OrderDtos.TotalsDto;

@Component
public class OrderMapper {

    public OrderResponse toResponse(CustomerOrder o) {
        ShippingAddress a = o.getShippingAddress();
        return new OrderResponse(
            o.getOrderNumber(),
            o.getCreatedAt(),
            o.getEstimatedDelivery(),
            o.getStatus().label(),
            o.getPaymentStatus().name(),
            o.getCustomer() == null ? null : o.getCustomer().getClerkUserId(),
            o.getEmail(),
            new AddressDto(a.getFullName(), a.getPhone(), a.getEmail(), a.getAddress(), a.getLandmark(),
                a.getCity(), a.getState(), a.getPincode()),
            o.getPaymentMethod().label(),
            o.getPaymentMethod().code(),
            o.getCouponCode() == null ? "" : o.getCouponCode(),
            new TotalsDto(o.getSubtotal(), o.getMrpTotal(), o.getMrpTotal().subtract(o.getSubtotal()),
                o.getCouponDiscount(), o.getCouponCode() != null, o.getShippingFee(), o.getTotal(), o.getItemCount()),
            o.getItems().stream().map(this::toDto).toList());
    }

    private OrderItemDto toDto(OrderItem i) {
        return new OrderItemDto(i.getLineKey(), i.getItemType().name().toLowerCase(), i.getProductSlug(), i.getName(),
            i.getDetails(), i.getConditionLabel() == null ? "" : i.getConditionLabel(), i.getColorHex(),
            i.getColorName(), i.getQuantity(), i.getUnitPrice(), i.getUnitMrp());
    }
}
