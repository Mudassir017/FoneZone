package com.mobinest.customer;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Admin access settings ({@code mobinest.admin.*}).
 *
 * @param clerkUserIds  Clerk user ids (e.g. {@code user_2abc...}) that are always ADMIN. They are
 *                      promoted (and the change saved) the next time they call the API. Env var
 *                      {@code ADMIN_CLERK_USER_IDS}, comma-separated, empty by default.
 * @param roleCacheTtl  how long a user's role is cached in memory after a database lookup.
 */
@ConfigurationProperties(prefix = "mobinest.admin")
public record AdminProperties(List<String> clerkUserIds, Duration roleCacheTtl) {

    public AdminProperties {
        clerkUserIds = clerkUserIds == null ? List.of()
            : clerkUserIds.stream().filter(s -> s != null && !s.isBlank()).map(String::trim).toList();
        roleCacheTtl = roleCacheTtl == null ? Duration.ofSeconds(30) : roleCacheTtl;
    }

    public Set<String> bootstrapIds() {
        return clerkUserIds.stream().collect(Collectors.toUnmodifiableSet());
    }
}
