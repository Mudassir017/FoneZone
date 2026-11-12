package com.mobinest.order.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mobinest.catalog.domain.Accessory;
import com.mobinest.catalog.domain.ConditionGrade;
import com.mobinest.catalog.domain.Phone;
import com.mobinest.catalog.domain.PhoneColor;
import com.mobinest.catalog.domain.PhoneVariant;
import com.mobinest.catalog.domain.Sku;
import com.mobinest.catalog.domain.Swatch;
import com.mobinest.catalog.repo.AccessoryRepository;
import com.mobinest.catalog.repo.PhoneRepository;
import com.mobinest.catalog.repo.SkuRepository;
import com.mobinest.common.error.BusinessRuleException;
import com.mobinest.common.error.NotFoundException;
import com.mobinest.customer.CustomerService;
import com.mobinest.order.coupon.CouponService;
import com.mobinest.order.domain.CustomerOrder;
import com.mobinest.order.domain.OrderEnums.ItemType;
import com.mobinest.order.domain.OrderEnums.OrderStatus;
import com.mobinest.order.domain.OrderEnums.PaymentMethod;
import com.mobinest.order.domain.OrderItem;
import com.mobinest.order.domain.OrderRepository;
import com.mobinest.order.domain.ShippingAddress;
import com.mobinest.order.dto.OrderDtos.AddressRequest;
import com.mobinest.order.dto.OrderDtos.OrderItemRequest;
import com.mobinest.order.dto.OrderDtos.OrderResponse;
import com.mobinest.order.dto.OrderDtos.PlaceOrderRequest;
import com.mobinest.order.event.OrderPlacedEvent;
import com.mobinest.order.payment.PaymentGateway;
import com.mobinest.order.payment.PaymentGateway.PaymentResult;

import lombok.RequiredArgsConstructor;

/**
 * Checkout (facade over catalogue, coupons, stock, payments and customers).
 * <p>
 * The client sends only <i>what</i> it wants to buy. Every price, discount, shipping fee and
 * total is computed here from the database, inside one transaction: if any line is out of
 * stock or a rule fails, nothing is saved and no stock is taken.
 */
@Service
@RequiredArgsConstructor
public class OrderService {

    private static final ZoneId STORE_ZONE = ZoneId.of("Asia/Kolkata");

    private final PhoneRepository phones;
    private final SkuRepository skus;
    private final AccessoryRepository accessories;
    private final OrderRepository orders;
    private final CouponService coupons;
    private final CustomerService customers;
    private final List<PaymentGateway> gateways;
    private final OrderNumberGenerator orderNumbers;
    private final OrderMapper mapper;
    private final ApplicationEventPublisher events;

    @Transactional
    public OrderResponse placeOrder(PlaceOrderRequest req, Jwt jwt) {
        PaymentMethod method = PaymentMethod.fromCode(req.paymentMethod());
        CustomerOrder order = new CustomerOrder();

        for (OrderItemRequest line : req.items()) {
            order.addItem("phone".equals(line.type()) ? phoneLine(line) : accessoryLine(line));
        }

        BigDecimal subtotal = order.getItems().stream().map(OrderItem::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal mrpTotal = order.getItems().stream().map(OrderItem::lineMrpTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal couponDiscount = coupons.discountForCheckout(req.couponCode(), subtotal);
        BigDecimal shipping = CheckoutRules.shippingFor(subtotal);
        BigDecimal total = subtotal.subtract(couponDiscount).add(shipping);

        if (method == PaymentMethod.COD && total.compareTo(CheckoutRules.COD_LIMIT) > 0) {
            throw new BusinessRuleException("COD_LIMIT", "Cash on Delivery is available only up to ₹50,000");
        }

        AddressRequest a = req.address();
        String email = a.email().trim().toLowerCase(Locale.ROOT);
        if (jwt != null) {
            order.setCustomer(customers.resolve(jwt.getSubject(), email, a.fullName()));
        }
        order.setOrderNumber(orderNumbers.next());
        order.setEmail(email);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaymentMethod(method);
        order.setCouponCode(couponDiscount.signum() > 0 ? req.couponCode().trim().toUpperCase(Locale.ROOT) : null);
        order.setSubtotal(subtotal);
        order.setMrpTotal(mrpTotal);
        order.setCouponDiscount(couponDiscount);
        order.setShippingFee(shipping);
        order.setTotal(total);
        order.setItemCount(order.getItems().stream().mapToInt(OrderItem::getQuantity).sum());
        order.setShippingAddress(new ShippingAddress(a.fullName().trim(), a.phone(), email, a.address().trim(),
            blankToNull(a.landmark()), a.city().trim(), a.state(), a.pincode()));
        order.setEstimatedDelivery(LocalDate.now(STORE_ZONE).plusDays(CheckoutRules.DELIVERY_DAYS));

        PaymentResult payment = gatewayFor(method).initiate(order);
        order.setPaymentStatus(payment.status());
        order.setPaymentReference(payment.reference());

        orders.save(order);
        events.publishEvent(new OrderPlacedEvent(order.getOrderNumber(), order.getEmail(), order.getTotal()));
        return mapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> myOrders(String clerkUserId) {
        return orders.findAllByCustomer_ClerkUserIdOrderByCreatedAtDesc(clerkUserId).stream()
            .map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse myOrder(String clerkUserId, String orderNumber) {
        return orders.findByOrderNumber(orderNumber)
            .filter(o -> o.getCustomer() != null && o.getCustomer().getClerkUserId().equals(clerkUserId))
            .map(mapper::toResponse)
            .orElseThrow(() -> new NotFoundException("Order", orderNumber)); // 404, not 403: don't reveal it exists
    }

    // ---------------------------------------------------------------------------------------

    private OrderItem phoneLine(OrderItemRequest line) {
        Phone phone = phones.findVisibleBySlug(line.productId()) // hidden brands can't be ordered
            .orElseThrow(() -> new NotFoundException("Phone", line.productId()));
        int variantIndex = line.variantIndex() == null ? 0 : line.variantIndex();
        PhoneVariant variant = phone.getVariants().stream().filter(v -> v.getPosition() == variantIndex).findFirst()
            .orElseThrow(() -> new BusinessRuleException("VARIANT_INVALID", "Unknown variant for " + phone.getName()));
        PhoneColor color = phone.getColors().stream()
            .filter(c -> line.color() == null || line.color().isBlank() || c.getName().equals(line.color()))
            .findFirst()
            .orElseThrow(() -> new BusinessRuleException("COLOR_INVALID", "Unknown colour for " + phone.getName()));
        String conditionCode = line.condition() == null || line.condition().isBlank() ? ConditionGrade.NEW : line.condition();
        Sku sku = skus.findByVariant_IdAndColor_IdAndCondition_Code(variant.getId(), color.getId(), conditionCode)
            .orElseThrow(() -> new BusinessRuleException("CONDITION_UNAVAILABLE",
                phone.getName() + " is not sold in this condition"));

        reserve(skus.decrementStock(sku.getId(), line.qty()), phone.getName(), sku.getStock());

        OrderItem item = new OrderItem();
        item.setItemType(ItemType.PHONE);
        item.setProductSlug(phone.getSlug());
        item.setSku(sku);
        item.setLineKey(String.join("|", "phone", phone.getSlug(), String.valueOf(variantIndex), color.getName(), conditionCode));
        item.setName(phone.getName());
        item.setDetails(variant.label() + " · " + color.getName());
        item.setConditionLabel(sku.getCondition().getLabel());
        item.setColorName(color.getName());
        item.setColorHex(color.getHex());
        item.setUnitPrice(sku.getPrice());
        item.setUnitMrp(sku.getMrp());
        item.setQuantity(line.qty());
        return item;
    }

    private OrderItem accessoryLine(OrderItemRequest line) {
        Accessory acc = accessories.findBySlugAndActiveTrue(line.productId())
            .orElseThrow(() -> new NotFoundException("Accessory", line.productId()));
        Swatch color = acc.getColors().stream()
            .filter(c -> line.color() == null || line.color().isBlank() || c.name().equals(line.color()))
            .findFirst().orElse(null);

        reserve(accessories.decrementStock(acc.getId(), line.qty()), acc.getName(), acc.getStock());

        OrderItem item = new OrderItem();
        item.setItemType(ItemType.ACCESSORY);
        item.setProductSlug(acc.getSlug());
        item.setAccessory(acc);
        item.setLineKey(String.join("|", "accessory", acc.getSlug(), "0", color == null ? "" : color.name(), ""));
        item.setName(acc.getName());
        item.setDetails(color == null ? acc.getBrandLabel() : acc.getBrandLabel() + " · " + color.name());
        item.setColorName(color == null ? null : color.name());
        item.setColorHex(color == null ? null : color.hex());
        item.setUnitPrice(acc.getPrice());
        item.setUnitMrp(acc.getMrp());
        item.setQuantity(line.qty());
        return item;
    }

    private static void reserve(int updatedRows, String name, int stockSeen) {
        if (updatedRows == 0) {
            String left = stockSeen > 0 ? " (only " + stockSeen + " left)" : "";
            throw new BusinessRuleException(HttpStatus.CONFLICT, "OUT_OF_STOCK", name + " is out of stock" + left);
        }
    }

    private PaymentGateway gatewayFor(PaymentMethod method) {
        return gateways.stream().filter(g -> g.supports(method)).findFirst()
            .orElseThrow(() -> new IllegalStateException("No payment gateway for " + method));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
