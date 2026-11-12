package com.mobinest.admin.common;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Locale;
import java.util.stream.Collectors;

/** Parsing helpers for admin query parameters (enums are case-insensitive; dates are IST days). */
public final class Params {

    /** Business days and "today" are counted in Indian Standard Time; the database stores UTC. */
    public static final ZoneId STORE_ZONE = ZoneId.of("Asia/Kolkata");

    private Params() {}

    public static <E extends Enum<E>> E enumOrNull(Class<E> type, String value, String field) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Enum.valueOf(type, value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            String allowed = Arrays.stream(type.getEnumConstants()).map(Enum::name).collect(Collectors.joining(", "));
            throw FieldValidationException.of(field, "must be one of " + allowed);
        }
    }

    /** Start of the given IST day as an instant (inclusive lower bound). */
    public static Instant startOfDay(LocalDate day) {
        return day == null ? null : day.atStartOfDay(STORE_ZONE).toInstant();
    }

    /** Start of the day AFTER the given IST day (exclusive upper bound, so "to" includes that whole day). */
    public static Instant endOfDay(LocalDate day) {
        return day == null ? null : day.plusDays(1).atStartOfDay(STORE_ZONE).toInstant();
    }

    /**
     * Instant as a UTC LocalDateTime for plain-JDBC parameters: DATETIME columns hold UTC, and a
     * LocalDateTime is sent as-is (no driver time-zone conversion).
     */
    public static java.time.LocalDateTime utc(Instant instant) {
        return java.time.LocalDateTime.ofInstant(instant, java.time.ZoneOffset.UTC);
    }

    /** Reverse of {@link #utc(Instant)} for values read with plain JDBC. */
    public static Instant fromUtc(java.time.LocalDateTime value) {
        return value == null ? null : value.toInstant(java.time.ZoneOffset.UTC);
    }

    public static void checkRange(LocalDate from, LocalDate to) {
        if (from != null && to != null && to.isBefore(from)) {
            throw FieldValidationException.of("to", "must be on or after 'from'");
        }
    }

    public static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    /** Lower-case SQL LIKE pattern for a contains-search (escapes the wildcards). */
    public static String likeContains(String q) {
        String escaped = q.trim().toLowerCase(Locale.ROOT)
            .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
