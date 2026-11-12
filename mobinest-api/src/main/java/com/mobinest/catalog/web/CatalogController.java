package com.mobinest.catalog.web;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mobinest.catalog.dto.CatalogDtos.AccessoryDto;
import com.mobinest.catalog.dto.CatalogDtos.BrandDto;
import com.mobinest.catalog.dto.CatalogDtos.CatalogResponse;
import com.mobinest.catalog.dto.CatalogDtos.ConditionDto;
import com.mobinest.catalog.dto.CatalogDtos.PhoneDto;
import com.mobinest.catalog.service.CatalogService;
import com.mobinest.common.web.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Catalogue", description = "Public product data")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalog;

    @Operation(summary = "Whole storefront catalogue in one call (brands, conditions, phones, accessories)")
    @GetMapping("/catalog")
    public CatalogResponse catalog() {
        return catalog.getCatalog();
    }

    @GetMapping("/brands")
    public List<BrandDto> brands() {
        return catalog.listBrands();
    }

    @GetMapping("/conditions")
    public List<ConditionDto> conditions() {
        return catalog.listConditions();
    }

    @Operation(summary = "Search phones (paged)")
    @GetMapping("/phones")
    public PageResponse<PhoneDto> phones(
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean fiveG,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100), Sort.by("id"));
        return catalog.searchPhones(brand, q, fiveG, pageable);
    }

    @GetMapping("/phones/{slug}")
    public PhoneDto phone(@PathVariable String slug) {
        return catalog.getPhone(slug);
    }

    @GetMapping("/accessories")
    public List<AccessoryDto> accessories(@RequestParam(required = false) String category) {
        return catalog.listAccessories(category);
    }

    @GetMapping("/accessories/{slug}")
    public AccessoryDto accessory(@PathVariable String slug) {
        return catalog.getAccessory(slug);
    }
}
