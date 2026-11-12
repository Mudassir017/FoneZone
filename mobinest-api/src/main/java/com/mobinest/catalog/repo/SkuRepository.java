package com.mobinest.catalog.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mobinest.catalog.domain.Sku;

public interface SkuRepository extends JpaRepository<Sku, Long> {

    Optional<Sku> findByVariant_IdAndColor_IdAndCondition_Code(Long variantId, Long colorId, String conditionCode);

    /**
     * Atomically reserves stock. Returns 0 when there is not enough stock, so two customers
     * buying the last unit at the same time can never both succeed (no overselling).
     */
    @Modifying(flushAutomatically = true)
    @Query("update Sku s set s.stock = s.stock - :qty where s.id = :id and s.stock >= :qty")
    int decrementStock(@Param("id") Long id, @Param("qty") int qty);

    /** Gives reserved stock back (an unpaid online order expired). */
    @Modifying(flushAutomatically = true)
    @Query("update Sku s set s.stock = s.stock + :qty where s.id = :id")
    int incrementStock(@Param("id") Long id, @Param("qty") int qty);
}
