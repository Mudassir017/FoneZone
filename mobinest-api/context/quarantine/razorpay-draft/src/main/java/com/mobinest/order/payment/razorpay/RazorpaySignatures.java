package com.mobinest.order.payment.razorpay;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Razorpay signature checks (HMAC-SHA256, lowercase hex).
 * <ul>
 *   <li>Checkout: {@code HMAC(key_secret, razorpay_order_id + "|" + razorpay_payment_id)}</li>
 *   <li>Webhook: {@code HMAC(webhook_secret, raw request body)} in the X-Razorpay-Signature header</li>
 * </ul>
 * Comparisons are constant-time so the check doesn't leak how many characters matched.
 */
public final class RazorpaySignatures {

    private RazorpaySignatures() {}

    /** True when {@code signature} is the Checkout signature for this order/payment pair. */
    public static boolean isValidCheckout(String razorpayOrderId, String razorpayPaymentId, String signature,
            String keySecret) {
        if (isBlank(razorpayOrderId) || isBlank(razorpayPaymentId) || isBlank(signature) || isBlank(keySecret)) {
            return false;
        }
        byte[] data = (razorpayOrderId + "|" + razorpayPaymentId).getBytes(StandardCharsets.UTF_8);
        return constantTimeEquals(hmacSha256Hex(data, keySecret), signature);
    }

    /** True when {@code signature} matches the raw webhook body (do NOT re-serialise the JSON first). */
    public static boolean isValidWebhook(byte[] rawBody, String signature, String webhookSecret) {
        if (rawBody == null || isBlank(signature) || isBlank(webhookSecret)) {
            return false;
        }
        return constantTimeEquals(hmacSha256Hex(rawBody, webhookSecret), signature);
    }

    public static String hmacSha256Hex(byte[] data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HmacSHA256 unavailable", e);
        }
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
            actual.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
