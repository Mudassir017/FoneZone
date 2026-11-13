package com.mobinest.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Typed view of the {@code mobinest.*} settings in application.yml. */
@ConfigurationProperties(prefix = "mobinest")
public record AppProperties(Clerk clerk, Cors cors, Seed seed) {

    /** Clerk issues the session tokens; we only verify them. */
    public record Clerk(String issuer, List<String> authorizedParties) {}

    public record Cors(List<String> allowedOrigins) {}

    public record Seed(boolean enabled) {}
}
