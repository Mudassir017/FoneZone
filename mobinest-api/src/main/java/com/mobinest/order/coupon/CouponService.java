package com.mobinest.order.coupon;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mobinest.common.error.BusinessRuleException;

import lombok.RequiredArgsConstructor;

/** Coupon rules are enforced here; the React app's copy is only for instant feedback. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CouponService {

    private final CouponRepository coupons;

    public record CouponResult(String code, boolean valid, String message, String description, BigDecimal discount) {}

    public CouponResult evaluate(String rawCode, BigDecimal subtotal) {
        String code = rawCode == null ? "" : rawCode.trim().toUpperCase(Locale.ROOT);
        Coupon c = coupons.findById(code)
            .filter(Coupon::isActive)
            .filter(x -> x.getValidUntil() == null || x.getValidUntil().isAfter(Instant.now()))
            .orElse(null);
        if (c == null) {
            return invalid(code, "Invalid coupon code");
        }
        if (subtotal.compareTo(c.getMinSubtotal()) < 0) {
            return invalid(code, "Add items worth ₹" + inr(c.getMinSubtotal().subtract(subtotal)) + " more to use this code");
        }
        if (c.getMaxSubtotal() != null && subtotal.compareTo(c.getMaxSubtotal()) > 0) {
            return invalid(code, "Valid only on orders up to ₹" + inr(c.getMaxSubtotal()));
        }
        return new CouponResult(code, true, "Coupon applied", c.getDescription(), c.discountFor(subtotal));
    }

    /** Discount to apply at checkout; zero when no code is given, an error when the code is not valid. */
    public BigDecimal discountForCheckout(String code, BigDecimal subtotal) {
        if (code == null || code.isBlank()) {
            return BigDecimal.ZERO;
        }
        CouponResult result = evaluate(code, subtotal);
        if (!result.valid()) {
            throw new BusinessRuleException("COUPON_INVALID", result.message());
        }
        return result.discount();
    }

    private static CouponResult invalid(String code, String message) {
        return new CouponResult(code, false, message, null, BigDecimal.ZERO);
    }

    private static String inr(BigDecimal amount) {
        return NumberFormat.getIntegerInstance(Locale.of("en", "IN")).format(amount);
    }
}
