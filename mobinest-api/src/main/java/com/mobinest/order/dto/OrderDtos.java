package com.mobinest.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request/response shapes for checkout. Names match the React checkout and order pages. */
public final class OrderDtos {

    private OrderDtos() {}

    // ---------- request ----------

    public record PlaceOrderRequest(
            @NotNull @Valid AddressRequest address,
            @NotBlank @Pattern(regexp = "upi|card|emi|netbanking|cod", message = "Choose a payment method")
            String paymentMethod,
            @Size(max = 30) String couponCode,
            @NotEmpty @Size(max = 20) List<@Valid @NotNull OrderItemRequest> items) {}

    public record AddressRequest(
            @NotBlank @Size(min = 3, max = 120, message = "Enter your full name") String fullName,
            @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit mobile number") String phone,
            @NotBlank @Email(message = "Enter a valid email") @Size(max = 160) String email,
            @NotBlank @Size(min = 8, max = 255, message = "Enter your complete address") String address,
            @Size(max = 120) String landmark,
            @NotBlank @Size(min = 2, max = 80, message = "Enter your city") String city,
            @NotBlank @Size(max = 60, message = "Select your state") String state,
            @NotBlank @Pattern(regexp = "^[1-9]\\d{5}$", message = "Enter a valid 6-digit pincode") String pincode) {}

    /** Same selection the React cart stores: no prices, the server looks them up. */
    public record OrderItemRequest(
            @NotBlank @Pattern(regexp = "phone|accessory") String type,
            @NotBlank @Size(max = 80) String productId,
            @Min(0) @Max(20) Integer variantIndex,
            @Size(max = 60) String color,
            @Size(max = 20) String condition,
            @Min(1) @Max(5) int qty) {}

    // ---------- response ----------

    public record OrderResponse(
            String id,
            Instant createdAt,
            LocalDate eta,
            String status,
            String paymentStatus,
            String userId,
            String email,
            AddressDto address,
            String payment,
            String paymentMethod,
            String coupon,
            TotalsDto totals,
            List<OrderItemDto> items) {}

    public record AddressDto(String fullName, String phone, String email, String address, String landmark,
            String city, String state, String pincode) {}

    public record TotalsDto(BigDecimal subtotal, BigDecimal mrpTotal, BigDecimal productSavings,
            BigDecimal couponDiscount, boolean couponValid, BigDecimal shipping, BigDecimal total, int itemCount) {}

    public record OrderItemDto(String key, String type, String productId, String name, String details,
            String condition, String colorHex, String colorName, int qty, BigDecimal unitPrice, BigDecimal unitMrp) {}
}
