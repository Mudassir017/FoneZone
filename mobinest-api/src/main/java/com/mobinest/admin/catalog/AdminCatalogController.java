package com.mobinest.admin.catalog;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mobinest.admin.catalog.AdminCatalogDtos.AccessoryRow;
import com.mobinest.admin.catalog.AdminCatalogDtos.AccessoryUpdate;
import com.mobinest.admin.catalog.AdminCatalogDtos.BrandRow;
import com.mobinest.admin.catalog.AdminCatalogDtos.BrandUpdate;
import com.mobinest.admin.catalog.AdminCatalogDtos.PhoneRow;
import com.mobinest.admin.catalog.AdminCatalogDtos.PhoneUpdate;
import com.mobinest.admin.catalog.AdminCatalogDtos.SkuRow;
import com.mobinest.admin.catalog.AdminCatalogDtos.SkuUpdate;
import com.mobinest.admin.common.CurrentAdmin;
import com.mobinest.common.web.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Admin: catalogue")
@SecurityRequirement(name = "clerk")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminCatalogController {

    private final AdminCatalogService catalog;
    private final CurrentAdmin currentAdmin;

    @Operation(summary = "All brands (active and hidden) with phone/SKU/stock counts")
    @GetMapping("/brands")
    public List<BrandRow> brands() {
        return catalog.listBrands();
    }

    @Operation(summary = "Show/hide a brand in the store, or edit its tagline")
    @PatchMapping("/brands/{slug}")
    public BrandRow updateBrand(@PathVariable String slug, @Valid @RequestBody BrandUpdate request,
            @AuthenticationPrincipal Jwt jwt) {
        return catalog.updateBrand(slug, request, currentAdmin.from(jwt));
    }

    @Operation(summary = "All phones incl. inactive (sort=name|year|updatedAt|createdAt|brand)")
    @GetMapping("/phones")
    public PageResponse<PhoneRow> phones(
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Boolean visible,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        return catalog.listPhones(brand, active, visible, q, page, size, sort);
    }

    @Operation(summary = "Activate/deactivate a phone")
    @PatchMapping("/phones/{slug}")
    public PhoneRow updatePhone(@PathVariable String slug, @Valid @RequestBody PhoneUpdate request,
            @AuthenticationPrincipal Jwt jwt) {
        return catalog.updatePhone(slug, request, currentAdmin.from(jwt));
    }

    @Operation(summary = "SKUs with price and stock (sort=stock|price|mrp|skuCode|phone)")
    @GetMapping("/skus")
    public PageResponse<SkuRow> skus(
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) Boolean lowStock,
            @RequestParam(required = false) Integer threshold,
            @RequestParam(required = false) Boolean visible,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        return catalog.listSkus(phone, brand, condition, lowStock, threshold, visible, q, page, size, sort);
    }

    @Operation(summary = "Edit a SKU's price, MRP and/or stock")
    @PatchMapping("/skus/{id}")
    public SkuRow updateSku(@PathVariable Long id, @Valid @RequestBody SkuUpdate request,
            @AuthenticationPrincipal Jwt jwt) {
        return catalog.updateSku(id, request, currentAdmin.from(jwt));
    }

    @Operation(summary = "All accessories incl. inactive (sort=name|price|stock|updatedAt|category)")
    @GetMapping("/accessories")
    public PageResponse<AccessoryRow> accessories(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Boolean lowStock,
            @RequestParam(required = false) Integer threshold,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {
        return catalog.listAccessories(category, active, lowStock, threshold, q, page, size, sort);
    }

    @Operation(summary = "Edit an accessory's price, MRP, stock and/or active flag")
    @PatchMapping("/accessories/{slug}")
    public AccessoryRow updateAccessory(@PathVariable String slug, @Valid @RequestBody AccessoryUpdate request,
            @AuthenticationPrincipal Jwt jwt) {
        return catalog.updateAccessory(slug, request, currentAdmin.from(jwt));
    }
}
