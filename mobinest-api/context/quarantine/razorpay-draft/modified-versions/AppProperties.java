package com.mobinest.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

/** Typed view of the {@code mobinest.*} settings in application.yml. */
@ConfigurationProperties(prefix = "mobinest")
public record AppProperties(Clerk clerk, Cors cors, Seed seed, Razorpay razorpay) {

    /** Clerk issues the session tokens; we only verify them. */
    public record Clerk(String issuer, List<String> authorizedParties) {}

    public record Cors(List<String> allowedOrigins) {}

    public record Seed(boolean enabled) {}

    /**
     * Razorpay credentials and payment settings. Secrets come from environment variables
     * (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET) or the git-ignored
     * config/application.properties, never from source control. Only {@code keyId} is ever sent
     * to the browser.
     *
     * @param paymentWindow how long an unpaid online order keeps its stock reserved
     * @param allowDemo     when the keys are missing, fake online payments (local development only).
     *                      Set PAYMENTS_ALLOW_DEMO=false in production.
     */
    public record Razorpay(String keyId, String keySecret, String webhookSecret, String apiBaseUrl,
            String storeName, Duration paymentWindow, boolean allowDemo) {

        /** Online payments go through Razorpay only when both API keys are configured. */
        public boolean enabled() {
            return StringUtils.hasText(keyId) && StringUtils.hasText(keySecret);
        }

        public boolean liveMode() {
            return keyId != null && keyId.startsWith("rzp_live_");
        }
    }
}
