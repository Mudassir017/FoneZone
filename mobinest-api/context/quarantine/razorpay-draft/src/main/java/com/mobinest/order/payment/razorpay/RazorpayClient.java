package com.mobinest.order.payment.razorpay;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mobinest.common.error.BusinessRuleException;
import com.mobinest.config.AppProperties;

/**
 * Minimal Razorpay REST client (https://api.razorpay.com/v1, HTTP Basic auth with key_id:key_secret).
 * Plain HTTP instead of the razorpay-java SDK keeps dependencies small; only the four calls we
 * need are wrapped. Amounts are integers in paise.
 */
@Component
public class RazorpayClient {

    private static final Logger log = LoggerFactory.getLogger(RazorpayClient.class);

    private final RestClient http;

    public RazorpayClient(AppProperties props) {
        AppProperties.Razorpay rzp = props.razorpay();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(15));
        this.http = RestClient.builder()
            .baseUrl(rzp.apiBaseUrl())
            .requestFactory(factory)
            .defaultHeaders(h -> {
                if (rzp.enabled()) {
                    h.setBasicAuth(rzp.keyId(), rzp.keySecret());
                }
            })
            .build();
    }

    /** POST /orders. {@code receipt} is our order number (max 40 chars, unique). */
    public RzpOrder createOrder(long amountPaise, String receipt, Map<String, String> notes) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", amountPaise);
        body.put("currency", "INR");
        body.put("receipt", receipt);
        body.put("notes", notes);
        return call("create order " + receipt, () -> http.post().uri("/orders")
            .contentType(MediaType.APPLICATION_JSON).body(body).retrieve().body(RzpOrder.class));
    }

    /** GET /orders/{id}/payments: every attempt made against the order. */
    public List<RzpPayment> fetchOrderPayments(String razorpayOrderId) {
        RzpCollection<RzpPayment> page = call("fetch payments of " + razorpayOrderId, () -> http.get()
            .uri("/orders/{id}/payments", razorpayOrderId).retrieve()
            .body(new org.springframework.core.ParameterizedTypeReference<RzpCollection<RzpPayment>>() {}));
        return page == null || page.items() == null ? List.of() : page.items();
    }

    /** GET /payments/{id} */
    public RzpPayment fetchPayment(String razorpayPaymentId) {
        return call("fetch payment " + razorpayPaymentId, () -> http.get()
            .uri("/payments/{id}", razorpayPaymentId).retrieve().body(RzpPayment.class));
    }

    /** POST /payments/{id}/refund. {@code amountPaise == null} refunds the whole payment. */
    public RzpRefund refund(String razorpayPaymentId, Long amountPaise, String receipt, Map<String, String> notes) {
        Map<String, Object> body = new LinkedHashMap<>();
        if (amountPaise != null) {
            body.put("amount", amountPaise);
        }
        body.put("speed", "normal");
        body.put("receipt", receipt);
        body.put("notes", notes);
        return call("refund " + razorpayPaymentId, () -> http.post().uri("/payments/{id}/refund", razorpayPaymentId)
            .contentType(MediaType.APPLICATION_JSON).body(body).retrieve().body(RzpRefund.class));
    }

    private static <T> T call(String what, java.util.function.Supplier<T> request) {
        try {
            return request.get();
        } catch (RestClientResponseException e) {
            // Razorpay's error body never contains our secret; safe to log.
            log.error("Razorpay {} failed: HTTP {} {}", what, e.getStatusCode().value(), e.getResponseBodyAsString());
            throw unavailable();
        } catch (RestClientException e) {
            log.error("Razorpay {} failed: {}", what, e.getMessage());
            throw unavailable();
        }
    }

    private static BusinessRuleException unavailable() {
        return new BusinessRuleException(HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR",
            "Online payment is temporarily unavailable. Please try again in a moment or choose Cash on Delivery.");
    }

    // ---------- response shapes (only the fields we use) ----------

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RzpOrder(String id, long amount, @JsonProperty("amount_paid") long amountPaid, String currency,
            String receipt, String status) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RzpPayment(String id, long amount, String currency, String status, String method,
            @JsonProperty("order_id") String orderId, boolean captured,
            @JsonProperty("amount_refunded") long amountRefunded,
            @JsonProperty("error_code") String errorCode,
            @JsonProperty("error_description") String errorDescription) {

        public boolean isCaptured() {
            return "captured".equals(status) || "refunded".equals(status) && captured;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RzpRefund(String id, @JsonProperty("payment_id") String paymentId, long amount, String status) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RzpCollection<T>(int count, List<T> items) {}
}
