package com.mobinest.common.json;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.mobinest.catalog.domain.Swatch;

import jakarta.persistence.Converter;
import tools.jackson.core.type.TypeReference;

/** Concrete JSON column converters. */
public final class JsonConverters {

    private JsonConverters() {}

    @Converter
    public static class StringList extends JsonAttributeConverter<List<String>> {
        public StringList() {
            super(new TypeReference<>() {});
        }

        @Override
        protected List<String> empty() {
            return new ArrayList<>();
        }
    }

    @Converter
    public static class StringMap extends JsonAttributeConverter<Map<String, String>> {
        public StringMap() {
            super(new TypeReference<>() {});
        }

        @Override
        protected Map<String, String> empty() {
            return new LinkedHashMap<>();
        }
    }

    @Converter
    public static class SwatchList extends JsonAttributeConverter<List<Swatch>> {
        public SwatchList() {
            super(new TypeReference<>() {});
        }

        @Override
        protected List<Swatch> empty() {
            return new ArrayList<>();
        }
    }
}
