package com.mobinest.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.mobinest.customer.ClerkRoleJwtConverter;

/**
 * Stateless REST security.
 * <p>
 * Users sign in on the React app with Clerk. The app sends the Clerk session token as
 * {@code Authorization: Bearer <jwt>}; this API acts as an OAuth2 resource server and verifies
 * the token's signature (Clerk JWKS), issuer, expiry and {@code azp} (authorised origin).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain apiSecurity(HttpSecurity http, ClerkRoleJwtConverter roleConverter) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // no cookies/sessions: bearer tokens are not CSRF-prone
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET,
                    "/api/catalog", "/api/brands", "/api/conditions",
                    "/api/phones", "/api/phones/**", "/api/accessories", "/api/accessories/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/orders", "/api/coupons/validate").permitAll() // guest checkout
                .requestMatchers("/actuator/health", "/actuator/info",
                    "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/error").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            // ROLE_ADMIN comes from our customer table (customer.role), never from the token: see ClerkRoleJwtConverter
            .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(roleConverter)));
        return http.build();
    }

    @Bean
    JwtDecoder jwtDecoder(AppProperties props) {
        String issuer = props.clerk().issuer();
        List<String> parties = props.clerk().authorizedParties();

        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(issuer + "/.well-known/jwks.json").build();
        OAuth2TokenValidator<Jwt> azp = new JwtClaimValidator<String>("azp",
            value -> value == null || parties.contains(value));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefaultWithIssuer(issuer), azp));
        return decoder;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(AppProperties props) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(props.cors().allowedOrigins());
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        cors.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cors);
        return source;
    }
}
