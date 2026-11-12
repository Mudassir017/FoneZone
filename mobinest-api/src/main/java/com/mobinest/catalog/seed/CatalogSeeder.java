package com.mobinest.catalog.seed;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mobinest.catalog.domain.Accessory;
import com.mobinest.catalog.domain.AccessoryCategory;
import com.mobinest.catalog.domain.Brand;
import com.mobinest.catalog.domain.ConditionGrade;
import com.mobinest.catalog.domain.Phone;
import com.mobinest.catalog.domain.PhoneColor;
import com.mobinest.catalog.domain.PhoneVariant;
import com.mobinest.catalog.domain.Sku;
import com.mobinest.catalog.domain.Swatch;
import com.mobinest.catalog.repo.AccessoryCategoryRepository;
import com.mobinest.catalog.repo.AccessoryRepository;
import com.mobinest.catalog.repo.BrandRepository;
import com.mobinest.catalog.repo.ConditionGradeRepository;
import com.mobinest.catalog.repo.PhoneRepository;
import com.mobinest.catalog.repo.SkuRepository;
import com.mobinest.catalog.service.PricingPolicy;
import com.mobinest.config.AppProperties;

import lombok.RequiredArgsConstructor;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * Loads the sample catalogue (exported from the React draft's src/data/*.js into
 * resources/seed/*.json) into an empty database. Runs once; does nothing if brands exist.
 */
@Component
@RequiredArgsConstructor
public class CatalogSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CatalogSeeder.class);

    /** Demo stock per condition: plenty of new units, few second-hand ones. */
    private static final Map<String, Integer> DEMO_STOCK =
        Map.of("new", 25, "refurbished", 8, "used", 5, "recycled", 4);

    private final AppProperties props;
    private final ObjectMapper json;
    private final PricingPolicy pricing;
    private final BrandRepository brands;
    private final ConditionGradeRepository conditions;
    private final PhoneRepository phones;
    private final SkuRepository skus;
    private final AccessoryCategoryRepository categories;
    private final AccessoryRepository accessories;

    @JsonIgnoreProperties(ignoreUnknown = true)
    record BrandSeed(String id, String name, String tagline, String accent, HeroSeed hero, Boolean active) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record HeroSeed(String phone, String color) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ConditionSeed(String id, String label, @JsonProperty("short") String shortLabel,
            BigDecimal priceFactor, String warranty, String description, String color) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record VariantSeed(int ram, int storage, BigDecimal price) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record PhoneSeed(String id, String brand, String name, Integer year, String camera, List<Swatch> colors,
            List<VariantSeed> variants, List<String> conditions, BigDecimal discount, BigDecimal rating,
            int reviews, @JsonProperty("is5G") boolean is5G, List<String> tags, Map<String, String> specs,
            List<String> highlights) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record CategorySeed(String id, String name, String icon) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record AccessorySeed(String id, String name, String brand, String category, BigDecimal price,
            BigDecimal mrp, BigDecimal rating, int reviews, List<Swatch> colors, List<String> compatibleBrands,
            String description, List<String> features) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        if (!props.seed().enabled() || brands.count() > 0) {
            return;
        }
        log.info("Empty database: loading sample catalogue...");

        Map<String, Brand> brandBySlug = new HashMap<>();
        List<BrandSeed> brandSeeds = read("brands.json", new TypeReference<>() {});
        for (int i = 0; i < brandSeeds.size(); i++) {
            BrandSeed s = brandSeeds.get(i);
            Brand b = new Brand();
            b.setSlug(s.id());
            b.setName(s.name());
            b.setTagline(s.tagline());
            b.setAccentHex(s.accent());
            b.setSortOrder(i);
            b.setActive(s.active() == null || s.active()); // older seed files had no flag = visible
            if (s.hero() != null) {
                b.setHeroPhoneSlug(s.hero().phone());
                b.setHeroColor(s.hero().color());
            }
            brandBySlug.put(s.id(), brands.save(b));
        }

        Map<String, ConditionGrade> conditionByCode = new HashMap<>();
        List<ConditionSeed> conditionSeeds = read("conditions.json", new TypeReference<>() {});
        for (int i = 0; i < conditionSeeds.size(); i++) {
            ConditionSeed s = conditionSeeds.get(i);
            ConditionGrade c = new ConditionGrade();
            c.setCode(s.id());
            c.setLabel(s.label());
            c.setShortLabel(s.shortLabel());
            c.setPriceFactor(s.priceFactor());
            c.setWarranty(s.warranty());
            c.setDescription(s.description());
            c.setColorHex(s.color());
            c.setSortOrder(i);
            conditionByCode.put(s.id(), conditions.save(c));
        }

        List<PhoneSeed> phoneSeeds = read("phones.json", new TypeReference<>() {});
        int skuCount = 0;
        for (PhoneSeed s : phoneSeeds) {
            Phone p = new Phone();
            p.setSlug(s.id());
            p.setBrand(brandBySlug.get(s.brand()));
            p.setName(s.name());
            p.setReleaseYear(s.year());
            p.setCameraStyle(s.camera());
            p.setFiveG(s.is5G());
            p.setDiscount(s.discount() == null ? BigDecimal.ZERO : s.discount());
            p.setRating(s.rating());
            p.setReviewCount(s.reviews());
            p.setSpecs(s.specs());
            p.setHighlights(s.highlights());
            p.setTags(s.tags());
            for (int i = 0; i < s.variants().size(); i++) {
                VariantSeed v = s.variants().get(i);
                p.addVariant(new PhoneVariant(i, v.ram(), v.storage(), v.price()));
            }
            for (int i = 0; i < s.colors().size(); i++) {
                Swatch c = s.colors().get(i);
                p.addColor(new PhoneColor(i, c.name(), c.hex()));
            }
            phones.save(p); // variants and colours get their ids here

            List<Sku> phoneSkus = new ArrayList<>();
            for (PhoneVariant v : p.getVariants()) {
                for (PhoneColor c : p.getColors()) {
                    for (String code : s.conditions()) {
                        ConditionGrade grade = conditionByCode.get(code);
                        Sku sku = new Sku();
                        sku.setPhone(p);
                        sku.setVariant(v);
                        sku.setColor(c);
                        sku.setCondition(grade);
                        sku.setSkuCode(String.join("/", p.getSlug(), v.getRamGb() + "-" + v.getStorageGb(),
                            slugify(c.getName()), code));
                        sku.setMrp(v.getMrp());
                        sku.setPrice(pricing.sellingPrice(v.getMrp(), p.getDiscount(), grade.getPriceFactor()));
                        sku.setStock(DEMO_STOCK.getOrDefault(code, 5));
                        phoneSkus.add(sku);
                    }
                }
            }
            skus.saveAll(phoneSkus);
            p.getSkus().addAll(phoneSkus);
            skuCount += phoneSkus.size();
        }

        Map<String, AccessoryCategory> categoryByCode = new HashMap<>();
        List<CategorySeed> categorySeeds = read("accessory-categories.json", new TypeReference<>() {});
        for (int i = 0; i < categorySeeds.size(); i++) {
            CategorySeed s = categorySeeds.get(i);
            AccessoryCategory c = new AccessoryCategory();
            c.setCode(s.id());
            c.setName(s.name());
            c.setIcon(s.icon());
            c.setSortOrder(i);
            categoryByCode.put(s.id(), categories.save(c));
        }

        List<AccessorySeed> accessorySeeds = read("accessories.json", new TypeReference<>() {});
        for (AccessorySeed s : accessorySeeds) {
            Accessory a = new Accessory();
            a.setSlug(s.id());
            a.setName(s.name());
            a.setBrandLabel(s.brand());
            a.setCategory(categoryByCode.get(s.category()));
            a.setPrice(s.price());
            a.setMrp(s.mrp());
            a.setRating(s.rating());
            a.setReviewCount(s.reviews());
            a.setColors(s.colors());
            a.setCompatibleBrands(s.compatibleBrands());
            a.setDescription(s.description());
            a.setFeatures(s.features());
            a.setStock(50);
            accessories.save(a);
        }

        log.info("Seeded {} brands ({} active), {} conditions, {} phones ({} SKUs), {} accessory categories, {} accessories",
            brandSeeds.size(), brandBySlug.values().stream().filter(Brand::isActive).count(), conditionSeeds.size(),
            phoneSeeds.size(), skuCount, categorySeeds.size(), accessorySeeds.size());
    }

    private <T> T read(String file, TypeReference<T> type) throws IOException {
        try (InputStream in = new ClassPathResource("seed/" + file).getInputStream()) {
            return json.readValue(in, type);
        }
    }

    private static String slugify(String s) {
        return s.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
}
