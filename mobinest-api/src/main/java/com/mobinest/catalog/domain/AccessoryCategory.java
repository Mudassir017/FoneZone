package com.mobinest.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "accessory_category")
@Getter
@Setter
@NoArgsConstructor
public class AccessoryCategory {

    @Id
    @Column(length = 30)
    private String code;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 30)
    private String icon;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
