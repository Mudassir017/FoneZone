package com.mobinest.customer;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/** Just-in-time provisioning: a Clerk user gets a local profile the first time they call the API. */
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customers;

    @Transactional
    public Customer resolve(String clerkUserId, String email, String fullName) {
        Customer c = customers.findByClerkUserId(clerkUserId).orElseGet(() -> {
            Customer created = new Customer();
            created.setClerkUserId(clerkUserId);
            return created;
        });
        if (email != null && !email.isBlank()) {
            c.setEmail(email.trim().toLowerCase());
        }
        if (fullName != null && !fullName.isBlank()) {
            c.setFullName(fullName.trim());
        }
        return customers.save(c);
    }
}
