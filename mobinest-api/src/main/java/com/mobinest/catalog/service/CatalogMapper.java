package com.mobinest.catalog.service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.mobinest.catalog.domain.Accessory;
import com.mobinest.catalog.domain.AccessoryCategory;
import com.mobinest.catalog.domain.Brand;
import com.mobinest.catalog.domain.ConditionGrade;
import com.mobinest.catalog.domain.Phone;
import com.mobinest.catalog.domain.Sku;
import com.mobinest.catalog.domain.Swatch;
import com.mobinest.catalog.dto.CatalogDtos.AccessoryCategoryDto;
import com.mobinest.catalog.dto.CatalogDtos.AccessoryDto;
import com.mobinest.catalog.dto.CatalogDtos.BrandDto;
import com.mobinest.catalog.dto.CatalogDtos.ConditionDto;
import com.mobinest.catalog.dto.CatalogDtos.HeroDto;
import com.mobinest.catalog.dto.CatalogDtos.PhoneDto;
import com.mobinest.catalog.dto.CatalogDtos.PriceDto;
import com.mobinest.catalog.dto.CatalogDtos.VariantDto;

/** Entity to DTO mapping (entities never leave the service layer). */
@Component
public class CatalogMapper {

    public BrandDto toDto(Brand b) {
        HeroDto hero = b.getHeroPhoneSlug() == null ? null : new HeroDto(b.getHeroPhoneSlug(), b.getHeroColor());
        return new BrandDto(b.getSlug(), b.getName(), b.getTagline(), b.getAccentHex(), hero, b.isActive());
    }

    public ConditionDto toDto(ConditionGrade c) {
        return new ConditionDto(c.getCode(), c.getLabel(), c.getShortLabel(), c.getPriceFactor(),
            c.getWarranty(), c.getDescription(), c.getColorHex());
    }

    public AccessoryCategoryDto toDto(AccessoryCategory c) {
        return new AccessoryCategoryDto(c.getCode(), c.getName(), c.getIcon());
    }

    public PhoneDto toDto(Phone p) {
        List<Sku> skus = p.getSkus();

        List<String> conditions = skus.stream()
            .map(Sku::getCondition)
            .distinct()
            .sorted(Comparator.comparingInt(ConditionGrade::getSortOrder))
            .map(ConditionGrade::getCode)
            .toList();

        Map<String, PriceDto> prices = skus.stream()
            .sorted(Comparator.comparingInt((Sku s) -> s.getVariant().getPosition())
                .thenComparingInt(s -> s.getCondition().getSortOrder()))
            .collect(Collectors.groupingBy(
                s -> s.getVariant().getPosition() + ":" + s.getCondition().getCode(),
                LinkedHashMap::new,
                Collectors.collectingAndThen(Collectors.toList(), CatalogMapper::summarise)));

        return new PhoneDto(
            p.getSlug(),
            p.getBrand().getSlug(),
            p.getName(),
            p.getReleaseYear(),
            p.getCameraStyle(),
            p.getColors().stream().map(c -> new Swatch(c.getName(), c.getHex())).toList(),
            p.getVariants().stream().map(v -> new VariantDto(v.getRamGb(), v.getStorageGb(), v.getMrp())).toList(),
            conditions,
            p.getDiscount(),
            p.getRating(),
            p.getReviewCount(),
            p.isFiveG(),
            p.getTags(),
            p.getSpecs(),
            p.getHighlights(),
            prices);
    }

    public AccessoryDto toDto(Accessory a) {
        return new AccessoryDto(a.getSlug(), a.getName(), a.getBrandLabel(), a.getCategory().getCode(),
            a.getPrice(), a.getMrp(), a.getRating(), a.getReviewCount(), a.getColors(), a.getCompatibleBrands(),
            a.getDescription(), a.getFeatures(), a.getStock());
    }

    private static PriceDto summarise(List<Sku> skus) {
        BigDecimal price = skus.stream().map(Sku::getPrice).min(Comparator.naturalOrder()).orElseThrow();
        BigDecimal mrp = skus.getFirst().getMrp();
        int stock = skus.stream().mapToInt(Sku::getStock).sum();
        return new PriceDto(price, mrp, stock);
    }
}
