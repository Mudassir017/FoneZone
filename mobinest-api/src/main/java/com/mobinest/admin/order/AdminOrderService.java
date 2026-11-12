package com.mobinest.admin.order;

import java.util.Map;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mobinest.admin.audit.AuditService;
import com.mobinest.admin.catalog.AdminAccessoryRepository;
import com.mobinest.admin.catalog.AdminSkuRepository;
import com.mobinest.admin.common.AdminActor;
import com.mobinest.admin.common.AdminPaging;
import com.mobinest.admin.common.FieldValidationException;
import com.mobinest.admin.common.Params;
import com.mobinest.admin.order.AdminOrderDtos.OrderDetail;
import com.mobinest.admin.order.AdminOrderDtos.OrderSummary;
import com.mobinest.admin.order.AdminOrderDtos.PaymentChangeRequest;
import com.mobinest.admin.order.AdminOrderDtos.StatusChangeRequest;
import com.mobinest.common.error.BusinessRuleException;
import com.mobinest.common.error.NotFoundException;
import com.mobinest.common.web.PageResponse;
import com.mobinest.order.domain.CustomerOrder;
import com.mobinest.order.domain.OrderEnums.OrderStatus;
import com.mobinest.order.domain.OrderEnums.PaymentMethod;
import com.mobinest.order.domain.OrderEnums.PaymentStatus;
import com.mobinest.order.domain.OrderItem;

import lombok.RequiredArgsConstructor;

/**
 * Back-office order management: search, detail with timeline, and status / payment changes.
 * Every change locks the order row, is recorded in {@code order_status_history} and in the
 * admin audit log, all in one transaction.
 */
@Service
@RequiredArgsConstructor
public class AdminOrderService {

    static final Map<String, String> SORTS = Map.of(
        "createdAt", "createdAt", "updatedAt", "updatedAt", "total", "total",
        "orderNumber", "orderNumber", "status", "status", "itemCount", "itemCount");

    private final AdminOrderRepository orders;
    private final OrderStatusHistoryRepository history;
    private final AdminSkuRepository skus;
    private final AdminAccessoryRepository accessories;
    private final AuditService audit;
    private final AdminOrderMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<OrderSummary> search(OrderFilter filter, Integer page, Integer size, String sort) {
        var pageable = AdminPaging.of(page, size, sort, SORTS,
            Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")));
        return PageResponse.of(orders.findAll(filter.toSpecification(), pageable), mapper::toSummary);
    }

    @Transactional(readOnly = true)
    public OrderDetail detail(String orderNumber) {
        CustomerOrder o = orders.findWithCustomer(orderNumber)
            .orElseThrow(() -> new NotFoundException("Order", orderNumber));
        return mapper.toDetail(o, history.findAllByOrder_IdOrderByCreatedAtAscIdAsc(o.getId()));
    }

    @Transactional
    public OrderDetail changeStatus(String orderNumber, StatusChangeRequest req, AdminActor actor) {
        OrderStatus to = Params.enumOrNull(OrderStatus.class, req.status(), "status");
        CustomerOrder o = orders.lockByOrderNumber(orderNumber)
            .orElseThrow(() -> new NotFoundException("Order", orderNumber));
        OrderStatus from = o.getStatus();
        if (!OrderWorkflow.canMove(from, to)) {
            throw new BusinessRuleException(HttpStatus.CONFLICT, "INVALID_TRANSITION",
                "A " + from.label().toLowerCase() + " order can't be marked " + to.label().toLowerCase()
                    + allowedHint(from));
        }
        String note = Params.blankToNull(req.note());
        o.setStatus(to);
        addHistory(o, OrderStatusHistory.Kind.STATUS, from.name(), to.name(), note, actor);

        StringBuilder details = new StringBuilder(from.name()).append(" -> ").append(to.name());
        if (to == OrderStatus.CANCELLED) {
            int units = restock(o);
            details.append("; restocked ").append(units).append(units == 1 ? " unit" : " units");
        }
        // Cash on Delivery: the courier collects the money on delivery.
        if (to == OrderStatus.DELIVERED && o.getPaymentMethod() == PaymentMethod.COD
                && o.getPaymentStatus() == PaymentStatus.PENDING) {
            o.setPaymentStatus(PaymentStatus.PAID);
            addHistory(o, OrderStatusHistory.Kind.PAYMENT, PaymentStatus.PENDING.name(), PaymentStatus.PAID.name(),
                "Cash collected on delivery", actor);
            details.append("; COD payment PENDING -> PAID");
        }
        if (note != null) {
            details.append("; note: ").append(note);
        }
        audit.record(actor, "ORDER_STATUS", "ORDER", orderNumber, details.toString());
        orders.flush();
        return mapper.toDetail(o, history.findAllByOrder_IdOrderByCreatedAtAscIdAsc(o.getId()));
    }

    @Transactional
    public OrderDetail changePayment(String orderNumber, PaymentChangeRequest req, AdminActor actor) {
        PaymentStatus to = Params.enumOrNull(PaymentStatus.class, req.status(), "status");
        CustomerOrder o = orders.lockByOrderNumber(orderNumber)
            .orElseThrow(() -> new NotFoundException("Order", orderNumber));
        PaymentStatus from = o.getPaymentStatus();
        if (!OrderWorkflow.canMovePayment(from, to)) {
            throw new BusinessRuleException(HttpStatus.CONFLICT, "INVALID_TRANSITION",
                "Payment status can't change from " + from.name() + " to " + to.name());
        }
        String reference = Params.blankToNull(req.reference());
        if (reference != null && !reference.matches("[A-Za-z0-9._:/-]{1,80}")) {
            throw FieldValidationException.of("reference", "use letters, digits and . _ : / - only");
        }
        String note = Params.blankToNull(req.note());
        o.setPaymentStatus(to);
        if (reference != null) {
            o.setPaymentReference(reference);
        }
        addHistory(o, OrderStatusHistory.Kind.PAYMENT, from.name(), to.name(),
            note == null && reference != null ? "Reference " + reference : note, actor);
        audit.record(actor, "PAYMENT_STATUS", "ORDER", orderNumber, from.name() + " -> " + to.name()
            + (reference == null ? "" : "; reference " + reference) + (note == null ? "" : "; note: " + note));
        orders.flush();
        return mapper.toDetail(o, history.findAllByOrder_IdOrderByCreatedAtAscIdAsc(o.getId()));
    }

    /** Puts the reserved units back on the shelf. Returns the number of units restored. */
    private int restock(CustomerOrder o) {
        int units = 0;
        for (OrderItem item : o.getItems()) {
            if (item.getSku() != null) {
                skus.incrementStock(item.getSku().getId(), item.getQuantity());
                units += item.getQuantity();
            } else if (item.getAccessory() != null) {
                accessories.incrementStock(item.getAccessory().getId(), item.getQuantity());
                units += item.getQuantity();
            }
        }
        return units;
    }

    private void addHistory(CustomerOrder o, OrderStatusHistory.Kind kind, String from, String to, String note,
            AdminActor actor) {
        OrderStatusHistory h = new OrderStatusHistory();
        h.setOrder(o);
        h.setKind(kind);
        h.setFromValue(from);
        h.setToValue(to);
        h.setNote(note);
        h.setChangedBy(actor.clerkUserId());
        h.setChangedByName(actor.displayName());
        history.save(h);
    }

    private static String allowedHint(OrderStatus from) {
        var next = OrderWorkflow.nextStatuses(from);
        return next.isEmpty() ? " (it is final)"
            : " (allowed: " + String.join(", ", next.stream().map(OrderStatus::name).toList()) + ")";
    }
}
