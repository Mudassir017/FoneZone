package com.mobinest.catalog.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mobinest.catalog.domain.Phone;
import com.mobinest.catalog.dto.CatalogDtos.AccessoryDto;
import com.mobinest.catalog.dto.CatalogDtos.BrandDto;
import com.mobinest.catalog.dto.CatalogDtos.CatalogResponse;
import com.mobinest.catalog.dto.CatalogDtos.ConditionDto;
import com.mobinest.catalog.dto.CatalogDtos.PhoneDto;
import com.mobinest.catalog.repo.AccessoryCategoryRepository;
import com.mobinest.catalog.repo.AccessoryRepository;
import com.mobinest.catalog.repo.BrandRepository;
import com.mobinest.catalog.repo.ConditionGradeRepository;
import com.mobinest.catalog.repo.PhoneRepository;
import com.mobinest.common.error.NotFoundException;
import com.mobinest.common.web.PageResponse;

import lombok.RequiredArgsConstructor;

/** Read side of the catalogue. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogService {

    private final BrandRepository brands;
    private final ConditionGradeRepository conditions;
    private final PhoneRepository phones;
    private final AccessoryCategoryRepository accessoryCategories;
    private final AccessoryRepository accessories;
    private final CatalogMapper mapper;

    public CatalogResponse getCatalog() {
        return new CatalogResponse(
            listBrands(),
            listConditions(),
            phones.findAllVisible().stream().map(mapper::toDto).toList(),
            accessoryCategories.findAllByOrderBySortOrderAsc().stream().map(mapper::toDto).toList(),
            listAccessories(null));
    }

    public List<BrandDto> listBrands() {
        return brands.findAllByActiveTrueOrderBySortOrderAsc().stream().map(mapper::toDto).toList();
    }

    public List<ConditionDto> listConditions() {
        return conditions.findAllByOrderBySortOrderAsc().stream().map(mapper::toDto).toList();
    }

    public PageResponse<PhoneDto> searchPhones(String brand, String q, Boolean fiveG, Pageable pageable) {
        Page<Phone> page = phones.findAll(
            PhoneSpecifications.visible()
                .and(PhoneSpecifications.brand(brand))
                .and(PhoneSpecifications.nameContains(q))
                .and(PhoneSpecifications.fiveG(fiveG)),
            pageable);
        return PageResponse.of(page, mapper::toDto);
    }

    public PhoneDto getPhone(String slug) {
        return phones.findVisibleBySlug(slug).map(mapper::toDto)
            .orElseThrow(() -> new NotFoundException("Phone", slug));
    }

    public List<AccessoryDto> listAccessories(String category) {
        var list = category == null || category.isBlank()
            ? accessories.findAllByActiveTrueOrderByIdAsc()
            : accessories.findAllByActiveTrueAndCategory_CodeOrderByIdAsc(category);
        return list.stream().map(mapper::toDto).toList();
    }

    public AccessoryDto getAccessory(String slug) {
        return accessories.findBySlugAndActiveTrue(slug).map(mapper::toDto)
            .orElseThrow(() -> new NotFoundException("Accessory", slug));
    }
}
