package com.mobinest.admin.common;

import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Builds a {@link Pageable} from {@code page}, {@code size} and {@code sort=field,dir} query
 * parameters. Only whitelisted sort fields are accepted (unknown ones would otherwise be a 500).
 */
public final class AdminPaging {

    public static final int MAX_SIZE = 100;

    private AdminPaging() {}

    /**
     * @param allowed  API sort name to entity property path, e.g. {@code "createdAt" -> "createdAt"}
     * @param fallback default sort when {@code sort} is blank
     */
    public static Pageable of(Integer page, Integer size, String sort, Map<String, String> allowed, Sort fallback) {
        int p = page == null ? 0 : page;
        int s = size == null ? 20 : size;
        if (p < 0) {
            throw FieldValidationException.of("page", "must be 0 or more");
        }
        if (s < 1 || s > MAX_SIZE) {
            throw FieldValidationException.of("size", "must be between 1 and " + MAX_SIZE);
        }
        return PageRequest.of(p, s, parseSort(sort, allowed, fallback));
    }

    static Sort parseSort(String sort, Map<String, String> allowed, Sort fallback) {
        if (sort == null || sort.isBlank()) {
            return fallback;
        }
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        String path = allowed.get(field);
        if (path == null) {
            throw FieldValidationException.of("sort", "can be one of " + String.join(", ", allowed.keySet()));
        }
        Sort.Direction dir = Sort.Direction.ASC;
        if (parts.length > 1) {
            dir = Sort.Direction.fromOptionalString(parts[1].trim())
                .orElseThrow(() -> FieldValidationException.of("sort", "direction must be asc or desc"));
        }
        // stable secondary order so paging never repeats or skips rows with equal keys
        return Sort.by(dir, path).and(Sort.by(Sort.Direction.DESC, "id"));
    }
}
