package com.mobinest.catalog.domain;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Buying condition: new, refurbished, used (pre-owned) or recycled. */
@Entity
@Table(name = "condition_grade")
@Getter
@Setter
@NoArgsConstructor
public class ConditionGrade {

    public static final String NEW = "new";

    @Id
    @Column(length = 20)
    private String code;

    @Column(nullable = false)
    private String label;

    @Column(name = "short_label", nullable = false)
    private String shortLabel;

    /** Selling price = launch price x (1 - phone discount) x priceFactor. */
    @Column(name = "price_factor", nullable = false, precision = 4, scale = 3)
    private BigDecimal priceFactor;

    @Column(nullable = false)
    private String warranty;

    private String description;

    @Column(name = "color_hex", length = 7)
    private String colorHex;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
