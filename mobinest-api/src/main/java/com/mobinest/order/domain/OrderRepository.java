package com.mobinest.order.domain;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {

    @EntityGraph(attributePaths = {"items", "customer"})
    Optional<CustomerOrder> findByOrderNumber(String orderNumber);

    @EntityGraph(attributePaths = {"items", "customer"})
    List<CustomerOrder> findAllByCustomer_ClerkUserIdOrderByCreatedAtDesc(String clerkUserId);
}
