package com.mobinest.catalog.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.mobinest.common.json.JsonConverters;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A phone model (aggregate root for its variants, colours and SKUs). */
@Entity
@Table(name = "phone")
@Getter
@Setter
@NoArgsConstructor
public class Phone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @Column(nullable = false)
    private String name;

    @Column(name = "release_year")
    private Integer releaseYear;

    @Column(name = "camera_style", length = 30)
    private String cameraStyle;

    @Column(name = "five_g", nullable = false)
    private boolean fiveG = true;

    @Column(nullable = false, precision = 4, scale = 3)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 2, scale = 1)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "review_count", nullable = false)
    private int reviewCount;

    @Convert(converter = JsonConverters.StringMap.class)
    @Column(columnDefinition = "json")
    private Map<String, String> specs = new LinkedHashMap<>();

    @Convert(converter = JsonConverters.StringList.class)
    @Column(columnDefinition = "json")
    private List<String> highlights = new ArrayList<>();

    @Convert(converter = JsonConverters.StringList.class)
    @Column(columnDefinition = "json")
    private List<String> tags = new ArrayList<>();

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "phone", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<PhoneVariant> variants = new ArrayList<>();

    @OneToMany(mappedBy = "phone", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<PhoneColor> colors = new ArrayList<>();

    @OneToMany(mappedBy = "phone", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Sku> skus = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public void addVariant(PhoneVariant variant) {
        variant.setPhone(this);
        variants.add(variant);
    }

    public void addColor(PhoneColor color) {
        color.setPhone(this);
        colors.add(color);
    }

    public void addSku(Sku sku) {
        sku.setPhone(this);
        skus.add(sku);
    }
}
