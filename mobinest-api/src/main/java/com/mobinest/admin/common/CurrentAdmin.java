package com.mobinest.admin.common;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.mobinest.customer.Customer;
import com.mobinest.customer.CustomerRepository;

import lombok.RequiredArgsConstructor;

/** Resolves the signed-in admin (from the verified Clerk JWT) into an {@link AdminActor}. */
@Component
@RequiredArgsConstructor
public class CurrentAdmin {

    private final CustomerRepository customers;

    @Transactional(readOnly = true)
    public AdminActor from(Jwt jwt) {
        String id = jwt.getSubject();
        String name = customers.findByClerkUserId(id).map(CurrentAdmin::label).orElse(null);
        if (name == null || name.isBlank()) {
            name = jwt.getClaimAsString("email");
        }
        return new AdminActor(id, name == null || name.isBlank() ? id : name);
    }

    private static String label(Customer c) {
        if (c.getEmail() != null && !c.getEmail().isBlank()) {
            return c.getEmail();
        }
        return c.getFullName();
    }
}
