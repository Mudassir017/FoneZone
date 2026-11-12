package com.mobinest.admin.customer;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mobinest.admin.common.CurrentAdmin;
import com.mobinest.admin.customer.AdminCustomerDtos.AdminMe;
import com.mobinest.admin.customer.AdminCustomerDtos.CustomerRow;
import com.mobinest.admin.customer.AdminCustomerDtos.RoleChangeRequest;
import com.mobinest.common.web.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Admin: customers")
@SecurityRequirement(name = "clerk")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminCustomerController {

    private final AdminCustomerService customers;
    private final CurrentAdmin currentAdmin;

    @Operation(summary = "The signed-in admin (200 = you are an admin; 403 = signed in but not an admin)")
    @GetMapping("/me")
    public AdminMe me(@AuthenticationPrincipal Jwt jwt) {
        return customers.me(jwt.getSubject());
    }

    @Operation(summary = "Customers with order count and total spent (sort=createdAt|email|name|role)")
    @GetMapping("/customers")
    public PageResponse<CustomerRow> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        return customers.list(q, role, page, size, sort);
    }

    @Operation(summary = "Promote to ADMIN or demote to CUSTOMER (you can't demote yourself)")
    @PutMapping("/customers/{clerkUserId}/role")
    public CustomerRow changeRole(@PathVariable String clerkUserId, @Valid @RequestBody RoleChangeRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return customers.changeRole(clerkUserId, request.role(), currentAdmin.from(jwt));
    }
}
