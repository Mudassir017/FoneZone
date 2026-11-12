package com.mobinest.admin.order;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mobinest.admin.order.AdminOrderDtos.CustomerRef;
import com.mobinest.admin.order.AdminOrderDtos.Item;
import com.mobinest.admin.order.AdminOrderDtos.OrderDetail;
import com.mobinest.admin.order.AdminOrderDtos.OrderSummary;
import com.mobinest.admin.order.AdminOrderDtos.PaymentInfo;
import com.mobinest.admin.order.AdminOrderDtos.PaymentRecord;
import com.mobinest.admin.order.AdminOrderDtos.TimelineEntry;
import com.mobinest.admin.order.AdminOrderDtos.Totals;
import com.mobinest.customer.Customer;
import com.mobinest.order.domain.CustomerOrder;
import com.mobinest.order.domain.OrderEnums.OrderStatus;
import com.mobinest.order.domain.OrderItem;
import com.mobinest.order.domain.ShippingAddress;
import com.mobinest.order.dto.OrderDtos.AddressDto;

@Component
public class AdminOrderMapper {

    public OrderSummary toSummary(CustomerOrder o) {
        ShippingAddress a = o.getShippingAddress();
        return new OrderSummary(o.getOrderNumber(), o.getCreatedAt(), o.getStatus().name(), o.getStatus().label(),
            o.getPaymentMethod().name(), o.getPaymentMethod().label(), o.getPaymentStatus().name(), o.getTotal(),
            o.getItemCount(), a.getFullName(), o.getEmail(), a.getPhone(), a.getCity(), o.getCouponCode(),
            o.getCustomer() == null);
    }

    public PaymentRecord toPayment(CustomerOrder o) {
        return new PaymentRecord(o.getOrderNumber(), o.getCreatedAt(), o.getUpdatedAt(), o.getPaymentMethod().name(),
            o.getPaymentMethod().label(), o.getPaymentStatus().name(), o.getPaymentReference(), o.getTotal(),
            o.getStatus().name(), o.getShippingAddress().getFullName(), o.getEmail());
    }

    public OrderDetail toDetail(CustomerOrder o, List<OrderStatusHistory> history) {
        ShippingAddress a = o.getShippingAddress();
        Customer c = o.getCustomer();
        CustomerRef customer = c == null ? null
            : new CustomerRef(c.getId(), c.getClerkUserId(), c.getFullName(), c.getEmail(), c.getRole().name());

        List<TimelineEntry> timeline = new ArrayList<>();
        timeline.add(new TimelineEntry("PLACED", null, OrderStatus.CONFIRMED.name(),
            "Order placed · " + o.getPaymentMethod().label(),
            c == null ? o.getEmail() + " (guest)" : o.getEmail(), c == null ? null : c.getClerkUserId(), o.getCreatedAt()));
        history.forEach(h -> timeline.add(new TimelineEntry(h.getKind().name(), h.getFromValue(), h.getToValue(),
            h.getNote(), h.getChangedByName(), h.getChangedBy(), h.getCreatedAt())));

        return new OrderDetail(
            o.getOrderNumber(), o.getCreatedAt(), o.getUpdatedAt(), o.getEstimatedDelivery(),
            o.getStatus().name(), o.getStatus().label(),
            OrderWorkflow.nextStatuses(o.getStatus()).stream().map(Enum::name).toList(),
            OrderWorkflow.nextPaymentStatuses(o.getPaymentStatus()).stream().map(Enum::name).toList(),
            customer, c == null, o.getEmail(),
            new AddressDto(a.getFullName(), a.getPhone(), a.getEmail(), a.getAddress(), a.getLandmark(),
                a.getCity(), a.getState(), a.getPincode()),
            new PaymentInfo(o.getPaymentMethod().name(), o.getPaymentMethod().label(), o.getPaymentStatus().name(),
                o.getPaymentReference(), o.getTotal()),
            o.getCouponCode(),
            new Totals(o.getSubtotal(), o.getMrpTotal(), o.getMrpTotal().subtract(o.getSubtotal()),
                o.getCouponDiscount(), o.getShippingFee(), o.getTotal(), o.getItemCount()),
            o.getItems().stream().map(AdminOrderMapper::toItem).toList(),
            timeline);
    }

    private static Item toItem(OrderItem i) {
        var sku = i.getSku();
        var acc = i.getAccessory();
        Integer stock = sku != null ? Integer.valueOf(sku.getStock()) : acc != null ? Integer.valueOf(acc.getStock()) : null;
        return new Item(i.getItemType().name().toLowerCase(), i.getProductSlug(), i.getName(), i.getDetails(),
            i.getConditionLabel(), i.getColorName(), i.getColorHex(), i.getQuantity(), i.getUnitPrice(),
            i.getUnitMrp(), i.lineTotal(), sku == null ? null : sku.getId(), sku == null ? null : sku.getSkuCode(),
            acc == null ? null : acc.getId(), stock);
    }
}
