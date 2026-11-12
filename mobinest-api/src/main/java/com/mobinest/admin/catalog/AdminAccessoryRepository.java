package com.mobinest.admin.catalog;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mobinest.catalog.domain.Accessory;

import jakarta.persistence.LockModeType;

/** Admin-side accessory queries (includes inactive accessories). */
public interface AdminAccessoryRepository extends JpaRepository<Accessory, Long>, JpaSpecificationExecutor<Accessory> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Accessory a where a.slug = :slug")
    Optional<Accessory> lockBySlug(@Param("slug") String slug);

    @Modifying(flushAutomatically = true)
    @Query("update Accessory a set a.stock = a.stock + :qty where a.id = :id")
    int incrementStock(@Param("id") Long id, @Param("qty") int qty);
}
