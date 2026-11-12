package com.mobinest.order.domain;

import java.math.BigDecimal;

import com.mobinest.catalog.domain.Accessory;
import com.mobinest.catalog.domain.Sku;
import com.mobinest.order.domain.OrderEnums.ItemType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

/** One order line with a snapshot of what was bought and the price paid. */
@Entity
@Table(name = "order_item")
@Getter
@Setter
@NoArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id")
    private CustomerOrder order;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 12)
    private ItemType itemType;

    @Column(name = "product_slug", nullable = false, length = 80)
    private String productSlug;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sku_id")
    private Sku sku;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accessory_id")
    private Accessory accessory;

    /** Same key format as the React cart: type|productId|variantIndex|color|condition */
    @Column(name = "line_key", nullable = false, length = 200)
    private String lineKey;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 200)
    private String details;

    @Column(name = "condition_label", length = 60)
    private String conditionLabel;

    @Column(name = "color_name", length = 60)
    private String colorName;

    @Column(name = "color_hex", length = 7)
    private String colorHex;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "unit_mrp", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitMrp;

    @Column(nullable = false)
    private int quantity;

    public BigDecimal lineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public BigDecimal lineMrpTotal() {
        return unitMrp.multiply(BigDecimal.valueOf(quantity));
    }
}
