package com.mobinest.catalog.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.mobinest.common.json.JsonConverters;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "accessory")
@Getter
@Setter
@NoArgsConstructor
public class Accessory {

    public static final String ALL_BRANDS = "all";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(name = "brand_label", nullable = false, length = 80)
    private String brandLabel;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_code")
    private AccessoryCategory category;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal mrp;

    @Column(nullable = false, precision = 2, scale = 1)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "review_count", nullable = false)
    private int reviewCount;

    @Column(length = 600)
    private String description;

    @Convert(converter = JsonConverters.StringList.class)
    @Column(columnDefinition = "json")
    private List<String> features = new ArrayList<>();

    @Convert(converter = JsonConverters.SwatchList.class)
    @Column(columnDefinition = "json")
    private List<Swatch> colors = new ArrayList<>();

    @Convert(converter = JsonConverters.StringList.class)
    @Column(name = "compatible_brands", columnDefinition = "json")
    private List<String> compatibleBrands = new ArrayList<>();

    @Column(nullable = false)
    private int stock;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
