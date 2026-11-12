package com.mobinest.catalog.domain;

import java.math.BigDecimal;

import jakarta.persistence.Column;
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

/** RAM/storage configuration with its launch price (MRP). */
@Entity
@Table(name = "phone_variant")
@Getter
@Setter
@NoArgsConstructor
public class PhoneVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "phone_id")
    private Phone phone;

    /** 0-based index; the React app refers to variants by this index. */
    @Column(nullable = false)
    private int position;

    @Column(name = "ram_gb", nullable = false)
    private int ramGb;

    @Column(name = "storage_gb", nullable = false)
    private int storageGb;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal mrp;

    public PhoneVariant(int position, int ramGb, int storageGb, BigDecimal mrp) {
        this.position = position;
        this.ramGb = ramGb;
        this.storageGb = storageGb;
        this.mrp = mrp;
    }

    /** e.g. "12GB RAM · 1TB" */
    public String label() {
        String storage = storageGb >= 1024 ? (storageGb / 1024) + "TB" : storageGb + "GB";
        return ramGb + "GB RAM · " + storage;
    }
}
