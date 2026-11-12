package com.mobinest.catalog.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mobinest.catalog.domain.Swatch;

/**
 * Catalogue API response shapes. Field names deliberately match the React app's data model
 * (src/data/*.js) so the frontend can switch from sample data to the API with minimal changes.
 */
public final class CatalogDtos {

    private CatalogDtos() {}

    /** {@code hero} is the phone + colour featured on the brand tile (may be null). */
    public record BrandDto(String id, String name, String tagline, String accent, HeroDto hero, boolean active) {}

    public record HeroDto(String phone, String color) {}

    public record ConditionDto(String id, String label, @JsonProperty("short") String shortLabel,
            BigDecimal priceFactor, String warranty, String description, String color) {}

    public record VariantDto(int ram, int storage, BigDecimal price) {}

    /** Price for one variant + condition (lowest across colours) and total stock. */
    public record PriceDto(BigDecimal price, BigDecimal mrp, int stock) {}

    /** {@code prices} key = "variantIndex:conditionId", e.g. "0:refurbished". */
    public record PhoneDto(
            String id,
            String brand,
            String name,
            Integer year,
            String camera,
            List<Swatch> colors,
            List<VariantDto> variants,
            List<String> conditions,
            BigDecimal discount,
            BigDecimal rating,
            int reviews,
            @JsonProperty("is5G") boolean is5G,
            List<String> tags,
            Map<String, String> specs,
            List<String> highlights,
            Map<String, PriceDto> prices) {}

    public record AccessoryCategoryDto(String id, String name, String icon) {}

    public record AccessoryDto(
            String id,
            String name,
            String brand,
            String category,
            BigDecimal price,
            BigDecimal mrp,
            BigDecimal rating,
            int reviews,
            List<Swatch> colors,
            List<String> compatibleBrands,
            String description,
            List<String> features,
            int stock) {}

    /** Everything the storefront needs on first load (small catalogue, cache-friendly). */
    public record CatalogResponse(
            List<BrandDto> brands,
            List<ConditionDto> conditions,
            List<PhoneDto> phones,
            List<AccessoryCategoryDto> accessoryCategories,
            List<AccessoryDto> accessories) {}
}
