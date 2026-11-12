package com.mobinest.customer;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Me", description = "The signed-in customer")
@SecurityRequirement(name = "clerk")
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final CustomerService customers;

    public record MeResponse(String userId, String email, String name, String role) {}

    @GetMapping
    public MeResponse me(@AuthenticationPrincipal Jwt jwt) {
        Customer c = customers.resolve(jwt.getSubject(), jwt.getClaimAsString("email"), null);
        return new MeResponse(c.getClerkUserId(), c.getEmail(), c.getFullName(), c.getRole().name());
    }
}
