package com.mobinest.common.json;

import jakarta.persistence.AttributeConverter;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * Stores a Java value in a MySQL JSON column (used for specs, highlights, tags, colours...).
 * Subclasses only supply the target type.
 */
public abstract class JsonAttributeConverter<T> implements AttributeConverter<T, String> {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final TypeReference<T> type;

    protected JsonAttributeConverter(TypeReference<T> type) {
        this.type = type;
    }

    protected abstract T empty();

    @Override
    public String convertToDatabaseColumn(T value) {
        return value == null ? null : JSON.writeValueAsString(value);
    }

    @Override
    public T convertToEntityAttribute(String json) {
        return json == null || json.isBlank() ? empty() : JSON.readValue(json, type);
    }
}
