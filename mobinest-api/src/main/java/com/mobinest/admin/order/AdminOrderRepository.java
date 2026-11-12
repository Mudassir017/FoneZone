package com.mobinest.admin.order;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mobinest.order.domain.CustomerOrder;

import jakarta.persistence.LockModeType;

/** Admin-side queries over orders (filters, paging, row locks for status changes). */
public interface AdminOrderRepository extends JpaRepository<CustomerOrder, Long>, JpaSpecificationExecutor<CustomerOrder> {

    /** SELECT ... FOR UPDATE: two admins changing the same order are serialised (no double restock). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from CustomerOrder o where o.orderNumber = :orderNumber")
    Optional<CustomerOrder> lockByOrderNumber(@Param("orderNumber") String orderNumber);

    @Query("select o from CustomerOrder o left join fetch o.customer where o.orderNumber = :orderNumber")
    Optional<CustomerOrder> findWithCustomer(@Param("orderNumber") String orderNumber);
}
