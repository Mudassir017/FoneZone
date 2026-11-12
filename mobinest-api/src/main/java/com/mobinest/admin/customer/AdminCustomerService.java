package com.mobinest.admin.customer;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mobinest.admin.audit.AuditService;
import com.mobinest.admin.common.AdminActor;
import com.mobinest.admin.common.AdminPaging;
import com.mobinest.admin.common.Params;
import com.mobinest.admin.customer.AdminCustomerDtos.AdminMe;
import com.mobinest.admin.customer.AdminCustomerDtos.CustomerRow;
import com.mobinest.common.error.BusinessRuleException;
import com.mobinest.common.error.NotFoundException;
import com.mobinest.common.web.PageResponse;
import com.mobinest.customer.Customer;
import com.mobinest.customer.Customer.Role;
import com.mobinest.customer.CustomerRepository;
import com.mobinest.customer.CustomerRoleService;

import lombok.RequiredArgsConstructor;

/** Customer list with order stats, and admin role management. */
@Service
@RequiredArgsConstructor
public class AdminCustomerService {

    /** Clerk user ids look like user_2abcDEF...; used to pre-provision an admin who hasn't signed in yet. */
    private static final String CLERK_ID = "^user_[A-Za-z0-9]{8,60}$";

    private static final Map<String, String> SORTS = Map.of(
        "createdAt", "createdAt", "email", "email", "name", "fullName", "role", "role");

    private final AdminCustomerRepository customers;
    private final CustomerRepository customerLookup;
    private final CustomerRoleService roles;
    private final NamedParameterJdbcTemplate jdbc;
    private final AuditService audit;

    @Transactional(readOnly = true)
    public PageResponse<CustomerRow> list(String q, String role, Integer page, Integer size, String sort) {
        Specification<Customer> spec = (root, query, cb) -> cb.conjunction();
        Role r = Params.enumOrNull(Role.class, role, "role");
        if (r != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("role"), r));
        }
        String text = Params.blankToNull(q);
        if (text != null) {
            String like = Params.likeContains(text);
            spec = spec.and((root, query, cb) -> cb.or(cb.like(cb.lower(root.get("email")), like, '\\'),
                cb.like(cb.lower(root.get("fullName")), like, '\\'),
                cb.like(cb.lower(root.get("clerkUserId")), like, '\\')));
        }
        var pageable = AdminPaging.of(page, size, sort, SORTS,
            Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id")));
        Page<Customer> result = customers.findAll(spec, pageable);
        Map<Long, Object[]> stats = stats(result.getContent().stream().map(Customer::getId).toList());
        return PageResponse.of(result, c -> toRow(c, stats.get(c.getId())));
    }

    @Transactional
    public CustomerRow changeRole(String clerkUserId, String newRole, AdminActor actor) {
        Role to = Role.valueOf(newRole.trim().toUpperCase(Locale.ROOT));
        Customer c = customerLookup.findByClerkUserId(clerkUserId).orElse(null);
        if (c == null) {
            // Allow promoting someone who hasn't used the shop yet, by their Clerk user id.
            if (to != Role.ADMIN || !clerkUserId.matches(CLERK_ID)) {
                throw new NotFoundException("Customer", clerkUserId);
            }
            c = new Customer();
            c.setClerkUserId(clerkUserId);
        }
        Role from = c.getId() == null ? null : c.getRole();
        if (from == to) {
            return toRow(c, stats(List.of(c.getId())).get(c.getId()));
        }
        if (to == Role.CUSTOMER) {
            if (clerkUserId.equals(actor.clerkUserId())) {
                throw new BusinessRuleException("CANNOT_DEMOTE_SELF",
                    "You can't remove your own admin access. Ask another admin to do it.");
            }
            if (roles.isBootstrapAdmin(clerkUserId)) {
                throw new BusinessRuleException("BOOTSTRAP_ADMIN",
                    "This user is listed in ADMIN_CLERK_USER_IDS on the server. Remove them there first.");
            }
            if (customers.countByRole(Role.ADMIN) <= 1) {
                throw new BusinessRuleException("LAST_ADMIN", "The shop must keep at least one admin.");
            }
        }
        c.setRole(to);
        c = customers.saveAndFlush(c);
        roles.invalidate(clerkUserId);
        audit.record(actor, "ROLE_CHANGE", "CUSTOMER", clerkUserId,
            (from == null ? "new profile" : from.name()) + " -> " + to.name()
                + (c.getEmail() == null ? "" : " (" + c.getEmail() + ")"));
        return toRow(c, stats(List.of(c.getId())).get(c.getId()));
    }

    @Transactional(readOnly = true)
    public AdminMe me(String clerkUserId) {
        Customer c = customerLookup.findByClerkUserId(clerkUserId).orElse(null);
        return new AdminMe(clerkUserId, c == null ? null : c.getEmail(), c == null ? null : c.getFullName(),
            Role.ADMIN.name(), roles.isBootstrapAdmin(clerkUserId), customers.countByRole(Role.ADMIN));
    }

    private Map<Long, Object[]> stats(List<Long> allIds) {
        Map<Long, Object[]> stats = new HashMap<>();
        List<Long> ids = allIds.stream().filter(java.util.Objects::nonNull).toList();
        if (ids.isEmpty()) {
            return stats;
        }
        jdbc.query("""
            SELECT customer_id id, COUNT(*) n,
                   COALESCE(SUM(CASE WHEN status <> 'CANCELLED' THEN total ELSE 0 END), 0) spent,
                   MAX(created_at) last_at
              FROM orders WHERE customer_id IN (:ids) GROUP BY customer_id""", Map.of("ids", ids),
            rs -> {
                stats.put(rs.getLong("id"), new Object[] {rs.getLong("n"), rs.getBigDecimal("spent"),
                    Params.fromUtc(rs.getObject("last_at", java.time.LocalDateTime.class))});
            });
        return stats;
    }

    private CustomerRow toRow(Customer c, Object[] s) {
        return new CustomerRow(c.getId(), c.getClerkUserId(), c.getEmail(), c.getFullName(), c.getRole().name(),
            roles.isBootstrapAdmin(c.getClerkUserId()), s == null ? 0 : (Long) s[0],
            s == null ? BigDecimal.ZERO : (BigDecimal) s[1], s == null ? null : (java.time.Instant) s[2], c.getCreatedAt());
    }
}
