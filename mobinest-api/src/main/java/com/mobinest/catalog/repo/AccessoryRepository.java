package com.mobinest.catalog.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mobinest.catalog.domain.Accessory;

public interface AccessoryRepository extends JpaRepository<Accessory, Long> {

    @EntityGraph(attributePaths = "category")
    List<Accessory> findAllByActiveTrueOrderByIdAsc();

    @EntityGraph(attributePaths = "category")
    List<Accessory> findAllByActiveTrueAndCategory_CodeOrderByIdAsc(String categoryCode);

    @EntityGraph(attributePaths = "category")
    Optional<Accessory> findBySlugAndActiveTrue(String slug);

    @Modifying(flushAutomatically = true)
    @Query("update Accessory a set a.stock = a.stock - :qty where a.id = :id and a.stock >= :qty")
    int decrementStock(@Param("id") Long id, @Param("qty") int qty);

    /** Gives reserved stock back (an unpaid online order expired). */
    @Modifying(flushAutomatically = true)
    @Query("update Accessory a set a.stock = a.stock + :qty where a.id = :id")
    int incrementStock(@Param("id") Long id, @Param("qty") int qty);
}
