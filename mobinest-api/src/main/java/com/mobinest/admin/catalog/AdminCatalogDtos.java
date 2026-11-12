package com.mobinest.admin.catalog;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Shapes of the admin catalogue endpoints. Public ids are slugs (brands, phones, accessories); SKUs use their numeric id. */
public final class AdminCatalogDtos {

    private AdminCatalogDtos() {}

    // ---------- brands ----------

    public record BrandRow(String id, String name, String tagline, String accent, boolean active, int sortOrder,
            String heroPhone, String heroColor, long phones, long activePhones, long skus, long units, long lowStockSkus) {}

    /** Any field left null is unchanged. {@code active} controls store visibility of the brand and its phones. */
    public record BrandUpdate(Boolean active, @Size(max = 255) String tagline) {}

    // ---------- phones ----------

    public record PhoneRow(String id, String name, String brand, String brandName, boolean brandActive, boolean active,
            boolean visible, Integer year, boolean fiveG, long skus, long units, BigDecimal minPrice, BigDecimal maxPrice,
            long lowStockSkus, Instant updatedAt) {}

    public record PhoneUpdate(@NotNull(message = "active is required") Boolean active) {}

    // ---------- SKUs ----------

    public record SkuRow(Long id, String skuCode, String phoneId, String phoneName, String brand, String variant,
            int ramGb, int storageGb, String color, String colorHex, String condition, String conditionLabel,
            BigDecimal price, BigDecimal mrp, int stock, boolean visible) {}

    /**
     * Any field left null is unchanged. {@code expectedStock} (optional) is the stock the admin saw;
     * if it changed meanwhile (e.g. a customer just bought one) the update is rejected with 409.
     */
    public record SkuUpdate(
            @DecimalMin(value = "1", message = "must be at least ₹1") @DecimalMax(value = "10000000", message = "is too high")
            @Digits(integer = 10, fraction = 2) BigDecimal price,
            @DecimalMin(value = "1", message = "must be at least ₹1") @DecimalMax(value = "10000000", message = "is too high")
            @Digits(integer = 10, fraction = 2) BigDecimal mrp,
            @Min(value = 0, message = "can't be negative") @Max(value = 100000, message = "is too high") Integer stock,
            @Min(0) Integer expectedStock) {}

    // ---------- accessories ----------

    public record AccessoryRow(String id, String name, String brandLabel, String category, String categoryName,
            BigDecimal price, BigDecimal mrp, int stock, boolean active, Instant updatedAt) {}

    public record AccessoryUpdate(
            @DecimalMin(value = "1", message = "must be at least ₹1") @DecimalMax(value = "10000000", message = "is too high")
            @Digits(integer = 10, fraction = 2) BigDecimal price,
            @DecimalMin(value = "1", message = "must be at least ₹1") @DecimalMax(value = "10000000", message = "is too high")
            @Digits(integer = 10, fraction = 2) BigDecimal mrp,
            @Min(value = 0, message = "can't be negative") @Max(value = 100000, message = "is too high") Integer stock,
            @Min(0) Integer expectedStock,
            Boolean active) {}
}
