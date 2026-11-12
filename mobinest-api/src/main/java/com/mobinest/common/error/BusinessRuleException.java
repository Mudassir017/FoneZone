package com.mobinest.common.error;

import org.springframework.http.HttpStatus;

/** A valid request that breaks a business rule (bad coupon, COD limit, out of stock...). */
public class BusinessRuleException extends ApiException {

    public BusinessRuleException(String code, String message) {
        super(HttpStatus.UNPROCESSABLE_CONTENT, code, message);
    }

    public BusinessRuleException(HttpStatus status, String code, String message) {
        super(status, code, message);
    }
}
