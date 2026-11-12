package com.mobinest.catalog.service;

import org.springframework.data.jpa.domain.Specification;

import com.mobinest.catalog.domain.Phone;

/** Composable filters for the phone search endpoint (Specification pattern). */
public final class PhoneSpecifications {

    private PhoneSpecifications() {}

    /** Phone is active and its brand is active (shown in the store). */
    public static Specification<Phone> visible() {
        return (root, query, cb) -> cb.and(
            cb.isTrue(root.get("active")),
            cb.isTrue(root.get("brand").get("active")));
    }

    public static Specification<Phone> brand(String brandSlug) {
        return (root, query, cb) -> brandSlug == null || brandSlug.isBlank()
            ? cb.conjunction()
            : cb.equal(root.join("brand").get("slug"), brandSlug);
    }

    public static Specification<Phone> nameContains(String q) {
        return (root, query, cb) -> q == null || q.isBlank()
            ? cb.conjunction()
            : cb.like(cb.lower(root.get("name")), "%" + q.trim().toLowerCase() + "%");
    }

    public static Specification<Phone> fiveG(Boolean fiveG) {
        return (root, query, cb) -> fiveG == null ? cb.conjunction() : cb.equal(root.get("fiveG"), fiveG);
    }
}
