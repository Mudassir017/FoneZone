package com.mobinest.admin.common;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Extra RFC 9457 mappings for the admin API only (runs before the global handler): malformed JSON,
 * wrong parameter types and failed parameter constraints become 400 instead of 500.
 */
@RestControllerAdvice(basePackages = "com.mobinest.admin")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AdminExceptionHandler {

    @ExceptionHandler(FieldValidationException.class)
    ProblemDetail fields(FieldValidationException ex) {
        return validation(ex.getFields());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ProblemDetail unreadable(HttpMessageNotReadableException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
            "The request body is not valid JSON for this endpoint");
        pd.setTitle("MALFORMED_REQUEST");
        return pd;
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ProblemDetail typeMismatch(MethodArgumentTypeMismatchException ex) {
        return validation(Map.of(ex.getName(), "has an invalid value"));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    ProblemDetail missing(MissingServletRequestParameterException ex) {
        return validation(Map.of(ex.getParameterName(), "is required"));
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    ProblemDetail methodValidation(HandlerMethodValidationException ex) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getParameterValidationResults().forEach(r -> r.getResolvableErrors().forEach(err ->
            fields.putIfAbsent(String.valueOf(r.getMethodParameter().getParameterName()), err.getDefaultMessage())));
        return validation(fields);
    }

    private static ProblemDetail validation(Map<String, String> fields) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Some fields are invalid");
        pd.setTitle("VALIDATION_FAILED");
        pd.setProperty("fields", fields);
        return pd;
    }
}
