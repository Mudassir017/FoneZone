package com.mobinest.admin.coupon;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mobinest.admin.common.CurrentAdmin;
import com.mobinest.admin.coupon.AdminCouponDtos.CouponRequest;
import com.mobinest.admin.coupon.AdminCouponDtos.CouponRow;
import com.mobinest.common.web.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Admin: coupons")
@SecurityRequirement(name = "clerk")
@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {

    private final AdminCouponService coupons;
    private final CurrentAdmin currentAdmin;

    @Operation(summary = "Coupons with usage (sort=code|validUntil|discountValue|active)")
    @GetMapping
    public PageResponse<CouponRow> list(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        return coupons.list(active, q, page, size, sort);
    }

    @GetMapping("/{code}")
    public CouponRow get(@PathVariable String code) {
        return coupons.get(code);
    }

    @Operation(summary = "Create a coupon (409 COUPON_EXISTS if the code is taken)")
    @PostMapping
    public ResponseEntity<CouponRow> create(@Valid @RequestBody CouponRequest request, @AuthenticationPrincipal Jwt jwt) {
        CouponRow created = coupons.create(request, currentAdmin.from(jwt));
        return ResponseEntity.created(URI.create("/api/admin/coupons/" + created.code())).body(created);
    }

    @Operation(summary = "Update a coupon (all fields; the code can't change)")
    @PutMapping("/{code}")
    public CouponRow update(@PathVariable String code, @Valid @RequestBody CouponRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return coupons.update(code, request, currentAdmin.from(jwt));
    }

    @Operation(summary = "Deactivate a coupon (soft delete; it stays for order history)")
    @DeleteMapping("/{code}")
    public CouponRow deactivate(@PathVariable String code, @AuthenticationPrincipal Jwt jwt) {
        return coupons.deactivate(code, currentAdmin.from(jwt));
    }
}
