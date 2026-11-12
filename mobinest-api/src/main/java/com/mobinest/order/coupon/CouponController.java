package com.mobinest.order.coupon;

import java.math.BigDecimal;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mobinest.order.coupon.CouponService.CouponResult;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@Tag(name = "Coupons")
@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService coupons;

    public record ValidateCouponRequest(@NotBlank @Size(max = 30) String code,
            @NotNull @DecimalMin("0") BigDecimal subtotal) {}

    @PostMapping("/validate")
    public CouponResult validate(@Valid @RequestBody ValidateCouponRequest req) {
        return coupons.evaluate(req.code(), req.subtotal());
    }
}
