package com.mobinest.customer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import com.mobinest.customer.Customer.Role;

class CustomerRoleServiceTest {

    private final CustomerRepository repo = mock(CustomerRepository.class);
    private final MutableClock clock = new MutableClock();

    private CustomerRoleService service(String... bootstrapIds) {
        return new CustomerRoleService(repo, new AdminProperties(List.of(bootstrapIds), Duration.ofSeconds(30)), clock);
    }

    private static Customer customer(String id, Role role) {
        Customer c = new Customer();
        c.setClerkUserId(id);
        c.setRole(role);
        return c;
    }

    @Test
    void roleComesFromTheCustomerTable() {
        when(repo.findByClerkUserId("user_admin")).thenReturn(Optional.of(customer("user_admin", Role.ADMIN)));
        when(repo.findByClerkUserId("user_cust")).thenReturn(Optional.of(customer("user_cust", Role.CUSTOMER)));
        CustomerRoleService roles = service();

        assertThat(roles.roleOf("user_admin")).isEqualTo(Role.ADMIN);
        assertThat(roles.roleOf("user_cust")).isEqualTo(Role.CUSTOMER);
        assertThat(roles.roleOf("user_unknown")).isEqualTo(Role.CUSTOMER);
        assertThat(roles.roleOf(null)).isEqualTo(Role.CUSTOMER);
    }

    @Test
    void lookupsAreCachedUntilTheTtlOrAnInvalidation() {
        when(repo.findByClerkUserId("user_a")).thenReturn(Optional.of(customer("user_a", Role.ADMIN)));
        CustomerRoleService roles = service();

        roles.roleOf("user_a");
        roles.roleOf("user_a");
        verify(repo, times(1)).findByClerkUserId("user_a");

        clock.advance(Duration.ofSeconds(31));
        roles.roleOf("user_a");
        verify(repo, times(2)).findByClerkUserId("user_a");

        roles.invalidate("user_a");
        roles.roleOf("user_a");
        verify(repo, times(3)).findByClerkUserId("user_a");
    }

    @Test
    void bootstrapAdminIsCreatedAndPromoted() {
        when(repo.findByClerkUserId("user_owner")).thenReturn(Optional.empty());
        CustomerRoleService roles = service("user_owner");

        assertThat(roles.roleOf("user_owner")).isEqualTo(Role.ADMIN);
        ArgumentCaptor<Customer> saved = ArgumentCaptor.forClass(Customer.class);
        verify(repo).save(saved.capture());
        assertThat(saved.getValue().getClerkUserId()).isEqualTo("user_owner");
        assertThat(saved.getValue().getRole()).isEqualTo(Role.ADMIN);
        assertThat(roles.isBootstrapAdmin("user_owner")).isTrue();
        assertThat(roles.isBootstrapAdmin("user_other")).isFalse();
    }

    @Test
    void existingBootstrapAdminIsNotSavedAgain() {
        when(repo.findByClerkUserId("user_owner")).thenReturn(Optional.of(customer("user_owner", Role.ADMIN)));
        assertThat(service("user_owner").roleOf("user_owner")).isEqualTo(Role.ADMIN);
        verify(repo, never()).save(any());
    }

    @Test
    void databaseErrorsFailClosed() {
        when(repo.findByClerkUserId("user_a")).thenThrow(new DataAccessResourceFailureException("down"));
        assertThat(service().roleOf("user_a")).isEqualTo(Role.CUSTOMER);
    }

    @Test
    void converterGrantsRoleAdminOnlyToAdmins() {
        when(repo.findByClerkUserId("user_admin")).thenReturn(Optional.of(customer("user_admin", Role.ADMIN)));
        ClerkRoleJwtConverter converter = new ClerkRoleJwtConverter(service());

        var admin = converter.convert(jwt("user_admin"));
        var other = converter.convert(jwt("user_other"));

        assertThat(admin.getAuthorities()).extracting(GrantedAuthority::getAuthority)
            .containsExactlyInAnyOrder("ROLE_CUSTOMER", "ROLE_ADMIN");
        assertThat(other.getAuthorities()).extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_CUSTOMER");
        assertThat(admin.getPrincipal()).isInstanceOf(Jwt.class);
        assertThat(admin.getName()).isEqualTo("user_admin");
    }

    @Test
    void aRoleClaimInTheTokenIsIgnored() {
        Jwt forged = Jwt.withTokenValue("t").header("alg", "RS256").subject("user_x")
            .claim("role", "ADMIN").claim("roles", List.of("ADMIN")).build();
        var auth = new ClerkRoleJwtConverter(service()).convert(forged);
        assertThat(auth.getAuthorities()).extracting(GrantedAuthority::getAuthority).doesNotContain("ROLE_ADMIN");
    }

    private static Jwt jwt(String sub) {
        return Jwt.withTokenValue("t").header("alg", "RS256").subject(sub).build();
    }

    private static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-11-12T10:00:00Z");

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
