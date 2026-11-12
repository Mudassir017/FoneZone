package com.mobinest.admin.common;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;

import com.mobinest.common.error.ApiException;

/** 400 VALIDATION_FAILED with a {@code fields} map, for checks that bean validation can't express. */
public class FieldValidationException extends ApiException {

    private final Map<String, String> fields;

    public FieldValidationException(Map<String, String> fields) {
        super(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Some fields are invalid");
        this.fields = new LinkedHashMap<>(fields);
    }

    public static FieldValidationException of(String field, String message) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put(field, message);
        return new FieldValidationException(m);
    }

    public Map<String, String> getFields() {
        return fields;
    }
}
