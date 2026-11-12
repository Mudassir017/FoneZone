package com.mobinest.catalog.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mobinest.catalog.domain.Brand;

public interface BrandRepository extends JpaRepository<Brand, Long> {

    /** Brands shown in the store. */
    List<Brand> findAllByActiveTrueOrderBySortOrderAsc();

    Optional<Brand> findBySlug(String slug);
}
