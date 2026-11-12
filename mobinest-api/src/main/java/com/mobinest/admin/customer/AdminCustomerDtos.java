package com.mobinest.admin.customer;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class AdminCustomerDtos {

    private AdminCustomerDtos() {}

    /**
     * {@code bootstrapAdmin}: listed in ADMIN_CLERK_USER_IDS (always admin, can't be demoted here).
     * {@code orderCount}/{@code totalSpent} count the customer's signed-in orders, excluding cancelled ones
     * for the amount. Guest orders aren't linked to a customer.
     */
    public record CustomerRow(Long id, String clerkUserId, String email, String name, String role,
            boolean bootstrapAdmin, long orderCount, BigDecimal totalSpent, Instant lastOrderAt, Instant createdAt) {}

    public record RoleChangeRequest(
            @NotBlank @Pattern(regexp = "(?i)ADMIN|CUSTOMER", message = "ADMIN or CUSTOMER") String role) {}

    /** The signed-in admin (GET /api/admin/me). */
    public record AdminMe(String userId, String email, String name, String role, boolean bootstrapAdmin, long adminCount) {}
}
