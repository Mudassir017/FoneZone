package com.mobinest.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "brand")
@Getter
@Setter
@NoArgsConstructor
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String slug;

    @Column(nullable = false, length = 80)
    private String name;

    private String tagline;

    @Column(name = "accent_hex", length = 7)
    private String accentHex;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /** Only active brands (and their phones) are shown and sold. Inactive brands keep their data. */
    @Column(nullable = false)
    private boolean active = true;

    /** Phone + colour featured on the brand tile (optional). */
    @Column(name = "hero_phone_slug", length = 80)
    private String heroPhoneSlug;

    @Column(name = "hero_color", length = 60)
    private String heroColor;
}
