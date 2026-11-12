package com.mobinest.order.domain;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mobinest.order.domain.OrderEnums.OrderStatus;

public interface OrderRepository extends JpaRepository<CustomerOrder, Long> {

    @EntityGraph(attributePaths = {"items", "customer"})
    Optional<CustomerOrder> findByOrderNumber(String orderNumber);

    @EntityGraph(attributePaths = {"items", "customer"})
    List<CustomerOrder> findAllByCustomer_ClerkUserIdOrderByCreatedAtDesc(String clerkUserId);

    /** Ids of orders in {@code status} whose payment window ended before {@code now} (oldest first). */
    @Query("select o.id from CustomerOrder o where o.status = :status and o.paymentDueAt < :now order by o.paymentDueAt")
    List<Long> findIdsDueBefore(@Param("status") OrderStatus status, @Param("now") Instant now, Pageable page);
}
