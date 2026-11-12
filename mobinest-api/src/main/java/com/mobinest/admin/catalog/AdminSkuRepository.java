package com.mobinest.admin.catalog;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mobinest.catalog.domain.Sku;

import jakarta.persistence.LockModeType;

/** Admin-side SKU queries: filtered listing, row lock for edits, stock restore on cancellation. */
public interface AdminSkuRepository extends JpaRepository<Sku, Long>, JpaSpecificationExecutor<Sku> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Sku s where s.id = :id")
    Optional<Sku> lockById(@Param("id") Long id);

    @Modifying(flushAutomatically = true)
    @Query("update Sku s set s.stock = s.stock + :qty where s.id = :id")
    int incrementStock(@Param("id") Long id, @Param("qty") int qty);
}
