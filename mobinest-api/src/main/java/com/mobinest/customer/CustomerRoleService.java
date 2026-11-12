package com.mobinest.customer;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.mobinest.customer.Customer.Role;

/**
 * Decides the role of a signed-in Clerk user from OUR database ({@code customer.role}), never from
 * a claim the client could influence. Results are cached briefly so the lookup does not hit MySQL
 * on every request; role changes made through the admin API invalidate the cache immediately.
 * <p>
 * Users listed in {@code mobinest.admin.clerk-user-ids} (env {@code ADMIN_CLERK_USER_IDS}) are
 * bootstrap admins: their profile is created/promoted to ADMIN on their first API call.
 */
@Service
public class CustomerRoleService {

    private static final Logger log = LoggerFactory.getLogger(CustomerRoleService.class);
    private static final int MAX_ENTRIES = 10_000;

    private final CustomerRepository customers;
    private final AdminProperties props;
    private final Set<String> bootstrapIds;
    private final Clock clock;
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    private record Cached(Role role, Instant expiresAt) {}

    @Autowired
    public CustomerRoleService(CustomerRepository customers, AdminProperties props) {
        this(customers, props, Clock.systemUTC());
    }

    CustomerRoleService(CustomerRepository customers, AdminProperties props, Clock clock) {
        this.customers = customers;
        this.props = props;
        this.bootstrapIds = props.bootstrapIds();
        this.clock = clock;
    }

    /** Role of this Clerk user; CUSTOMER when unknown or when the database can't be reached (fail closed). */
    public Role roleOf(String clerkUserId) {
        if (clerkUserId == null || clerkUserId.isBlank()) {
            return Role.CUSTOMER;
        }
        Instant now = clock.instant();
        Cached hit = cache.get(clerkUserId);
        if (hit != null && hit.expiresAt().isAfter(now)) {
            return hit.role();
        }
        try {
            Role role = isBootstrapAdmin(clerkUserId) ? ensureBootstrapAdmin(clerkUserId) : lookup(clerkUserId);
            if (cache.size() >= MAX_ENTRIES) {
                cache.clear();
            }
            cache.put(clerkUserId, new Cached(role, now.plus(props.roleCacheTtl())));
            return role;
        } catch (DataAccessException ex) {
            log.warn("Role lookup failed for {}; treating as CUSTOMER", clerkUserId, ex);
            return Role.CUSTOMER;
        }
    }

    public boolean isBootstrapAdmin(String clerkUserId) {
        return bootstrapIds.contains(clerkUserId);
    }

    /** Forget a cached role (call after changing {@code customer.role}). */
    public void invalidate(String clerkUserId) {
        cache.remove(clerkUserId);
    }

    private Role lookup(String clerkUserId) {
        return customers.findByClerkUserId(clerkUserId).map(Customer::getRole).orElse(Role.CUSTOMER);
    }

    private Role ensureBootstrapAdmin(String clerkUserId) {
        Customer c = customers.findByClerkUserId(clerkUserId).orElseGet(() -> {
            Customer created = new Customer();
            created.setClerkUserId(clerkUserId);
            return created;
        });
        if (c.getRole() != Role.ADMIN) {
            c.setRole(Role.ADMIN);
            try {
                customers.save(c);
                log.info("Promoted {} to ADMIN (listed in mobinest.admin.clerk-user-ids)", clerkUserId);
            } catch (DataIntegrityViolationException race) {
                // a parallel request created the profile first: promote that one
                customers.findByClerkUserId(clerkUserId).ifPresent(existing -> {
                    existing.setRole(Role.ADMIN);
                    customers.save(existing);
                });
            }
        }
        return Role.ADMIN;
    }
}
