package com.mobinest.catalog.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.mobinest.catalog.domain.Phone;

/**
 * "Visible" = the phone is active AND its brand is active. Hidden phones can't be
 * viewed or ordered, but their data stays in the database.
 */
public interface PhoneRepository extends JpaRepository<Phone, Long>, JpaSpecificationExecutor<Phone> {

    @EntityGraph(attributePaths = "brand")
    List<Phone> findAllByActiveTrueAndBrand_ActiveTrueOrderByIdAsc();

    @EntityGraph(attributePaths = "brand")
    Optional<Phone> findBySlugAndActiveTrueAndBrand_ActiveTrue(String slug);

    default List<Phone> findAllVisible() {
        return findAllByActiveTrueAndBrand_ActiveTrueOrderByIdAsc();
    }

    default Optional<Phone> findVisibleBySlug(String slug) {
        return findBySlugAndActiveTrueAndBrand_ActiveTrue(slug);
    }
}
