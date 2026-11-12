package com.mobinest.catalog.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mobinest.catalog.domain.AccessoryCategory;

public interface AccessoryCategoryRepository extends JpaRepository<AccessoryCategory, String> {

    List<AccessoryCategory> findAllByOrderBySortOrderAsc();
}
