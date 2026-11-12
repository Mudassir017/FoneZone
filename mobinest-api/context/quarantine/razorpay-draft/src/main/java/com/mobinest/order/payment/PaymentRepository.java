package com.mobinest.order.payment;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

/**
 * The lock* methods take a row lock (SELECT ... FOR UPDATE) so the browser's verify call, the
 * webhook and the expiry job can never update the same payment at the same time.
 */
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p join fetch p.order o where o.orderNumber = :orderNumber")
    Optional<Payment> lockByOrderNumber(@Param("orderNumber") String orderNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p join fetch p.order o where o.id = :orderId")
    Optional<Payment> lockByOrderId(@Param("orderId") Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p join fetch p.order o where p.providerOrderId = :providerOrderId")
    Optional<Payment> lockByProviderOrderId(@Param("providerOrderId") String providerOrderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p join fetch p.order o where p.providerPaymentId = :providerPaymentId")
    Optional<Payment> lockByProviderPaymentId(@Param("providerPaymentId") String providerPaymentId);
}
