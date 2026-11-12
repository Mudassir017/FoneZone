package com.mobinest.customer;

import java.util.List;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import com.mobinest.customer.Customer.Role;

import lombok.RequiredArgsConstructor;

/**
 * Turns a verified Clerk JWT into a Spring Security authentication whose authorities come from
 * the local customer profile: everyone signed in gets {@code ROLE_CUSTOMER}; admins also get
 * {@code ROLE_ADMIN} (required by {@code /api/admin/**}). The principal stays the {@link Jwt}, so
 * {@code @AuthenticationPrincipal Jwt} keeps working in controllers.
 */
@Component
@RequiredArgsConstructor
public class ClerkRoleJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    public static final String ROLE_CUSTOMER = "ROLE_CUSTOMER";
    public static final String ROLE_ADMIN = "ROLE_ADMIN";

    private final CustomerRoleService roles;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Role role = roles.roleOf(jwt.getSubject());
        List<GrantedAuthority> authorities = role == Role.ADMIN
            ? List.of(new SimpleGrantedAuthority(ROLE_CUSTOMER), new SimpleGrantedAuthority(ROLE_ADMIN))
            : List.of(new SimpleGrantedAuthority(ROLE_CUSTOMER));
        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }
}
