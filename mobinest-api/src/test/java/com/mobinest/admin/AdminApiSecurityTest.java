package com.mobinest.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import com.mobinest.customer.Customer;
import com.mobinest.customer.Customer.Role;
import com.mobinest.customer.CustomerRepository;

/**
 * End-to-end checks of /api/admin/** through the real security filter chain and MockMvc.
 * Needs MySQL (like contextLoads). Every test runs in a transaction that is rolled back, so the
 * database is left exactly as it was.
 * <p>
 * The JwtDecoder is replaced by a mock that accepts fake tokens, so the REAL role converter
 * (customer.role lookup) decides admin access, exactly as with a Clerk token.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminApiSecurityTest {

    @Autowired MockMvc mvc;
    @Autowired CustomerRepository customers;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean JwtDecoder jwtDecoder;

    private String adminId;
    private String customerId;

    @BeforeEach
    void users() {
        // unique ids per test: the role cache is a singleton shared by all tests
        adminId = "user_testadmin" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        customerId = "user_testcust" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        customers.save(customer(adminId, Role.ADMIN, "admin@test.local"));
        customers.save(customer(customerId, Role.CUSTOMER, "shopper@test.local"));
        when(jwtDecoder.decode(anyString())).thenAnswer(inv -> {
            String token = inv.getArgument(0);
            if (token.startsWith("valid-")) {
                return Jwt.withTokenValue(token).header("alg", "RS256").subject(token.substring(6))
                    .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60)).build();
            }
            throw new BadJwtException("invalid token");
        });
    }

    private static Customer customer(String id, Role role, String email) {
        Customer c = new Customer();
        c.setClerkUserId(id);
        c.setRole(role);
        c.setEmail(email);
        return c;
    }

    private MockHttpServletRequestBuilder as(String clerkUserId, MockHttpServletRequestBuilder req) {
        return req.header("Authorization", "Bearer valid-" + clerkUserId);
    }

    // ------------------------------------------------------------------ access control

    @Test
    void anonymousGets401() throws Exception {
        mvc.perform(get("/api/admin/dashboard")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/orders")).andExpect(status().isUnauthorized());
    }

    @Test
    void invalidTokenGets401() throws Exception {
        mvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer garbage"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void signedInCustomerGets403() throws Exception {
        mvc.perform(as(customerId, get("/api/admin/dashboard"))).andExpect(status().isForbidden());
        mvc.perform(as(customerId, get("/api/admin/me"))).andExpect(status().isForbidden());
        // ...while their normal signed-in endpoints keep working
        mvc.perform(as(customerId, get("/api/me"))).andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    void unknownSignedInUserGets403() throws Exception {
        mvc.perform(as("user_neverseen123", get("/api/admin/orders"))).andExpect(status().isForbidden());
    }

    @Test
    void adminFromTheCustomerTableGetsIn() throws Exception {
        mvc.perform(as(adminId, get("/api/admin/me"))).andExpect(status().isOk())
            .andExpect(jsonPath("$.userId").value(adminId))
            .andExpect(jsonPath("$.role").value("ADMIN"));
        mvc.perform(as(adminId, get("/api/me"))).andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void jwtPostProcessorWithRoleAdminIsAccepted() throws Exception {
        mvc.perform(get("/api/admin/dashboard").with(jwt().jwt(j -> j.subject(adminId))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
            .andExpect(status().isOk());
        mvc.perform(get("/api/admin/dashboard").with(jwt())).andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------ read endpoints

    @Test
    void readEndpointsWork() throws Exception {
        mvc.perform(as(adminId, get("/api/admin/dashboard"))).andExpect(status().isOk())
            .andExpect(jsonPath("$.revenue.total").isNumber())
            .andExpect(jsonPath("$.ordersByStatus.CONFIRMED").isNumber())
            .andExpect(jsonPath("$.daily.length()").value(30))
            .andExpect(jsonPath("$.lowStock.threshold").value(5));
        mvc.perform(as(adminId, get("/api/admin/orders?size=5&sort=total,desc"))).andExpect(status().isOk())
            .andExpect(jsonPath("$.size").value(5));
        mvc.perform(as(adminId, get("/api/admin/payments?method=upi"))).andExpect(status().isOk());
        mvc.perform(as(adminId, get("/api/admin/payments/summary"))).andExpect(status().isOk())
            .andExpect(jsonPath("$.byMethod").isArray());
        mvc.perform(as(adminId, get("/api/admin/brands"))).andExpect(status().isOk())
            .andExpect(jsonPath("$[*].id", hasItem("apple")));
        mvc.perform(as(adminId, get("/api/admin/phones?active=true&sort=name"))).andExpect(status().isOk());
        mvc.perform(as(adminId, get("/api/admin/skus?lowStock=true&condition=used&sort=stock"))).andExpect(status().isOk());
        mvc.perform(as(adminId, get("/api/admin/accessories"))).andExpect(status().isOk());
        mvc.perform(as(adminId, get("/api/admin/coupons"))).andExpect(status().isOk())
            .andExpect(jsonPath("$.content[*].code", hasItem("WELCOME10")));
        mvc.perform(as(adminId, get("/api/admin/customers?role=admin"))).andExpect(status().isOk())
            .andExpect(jsonPath("$.content[*].clerkUserId", hasItem(adminId)));
        mvc.perform(as(adminId, get("/api/admin/audit"))).andExpect(status().isOk());
    }

    @Test
    void badParametersAre400NotErrors() throws Exception {
        mvc.perform(as(adminId, get("/api/admin/orders?status=LOST"))).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.title").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fields.status").exists());
        mvc.perform(as(adminId, get("/api/admin/orders?sort=password"))).andExpect(status().isBadRequest());
        mvc.perform(as(adminId, get("/api/admin/orders?size=1000"))).andExpect(status().isBadRequest());
        mvc.perform(as(adminId, get("/api/admin/orders?from=yesterday"))).andExpect(status().isBadRequest());
        mvc.perform(as(adminId, get("/api/admin/orders/NOPE123"))).andExpect(status().isNotFound());
        mvc.perform(as(adminId, post("/api/admin/coupons").contentType(MediaType.APPLICATION_JSON).content("{oops")))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.title").value("MALFORMED_REQUEST"));
    }

    // ------------------------------------------------------------------ writes (rolled back)

    @Test
    void couponLifecycleIsValidatedAndAudited() throws Exception {
        mvc.perform(as(adminId, post("/api/admin/coupons").contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"x\",\"description\":\"\",\"discountType\":\"PERCENT\",\"discountValue\":150}")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fields.code").exists())
            .andExpect(jsonPath("$.fields.description").exists());

        mvc.perform(as(adminId, post("/api/admin/coupons").contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"TEST_BIG\",\"description\":\"Too much\",\"discountType\":\"PERCENT\",\"discountValue\":150}")))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.discountValue").exists());

        mvc.perform(as(adminId, post("/api/admin/coupons").contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"test-diwali\",\"description\":\"Diwali 5%\",\"discountType\":\"percent\","
                    + "\"discountValue\":5,\"maxDiscount\":1500}")))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.code").value("TEST-DIWALI"))
            .andExpect(jsonPath("$.usable").value(true));

        mvc.perform(as(adminId, post("/api/admin/coupons").contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"TEST-DIWALI\",\"description\":\"dup\",\"discountType\":\"FLAT\",\"discountValue\":5}")))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.title").value("COUPON_EXISTS"));

        mvc.perform(as(adminId, put("/api/admin/coupons/test-diwali").contentType(MediaType.APPLICATION_JSON)
                .content("{\"description\":\"Diwali 7%\",\"discountType\":\"PERCENT\",\"discountValue\":7}")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.discountValue").value(7));

        mvc.perform(as(adminId, delete("/api/admin/coupons/TEST-DIWALI")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.active").value(false));

        Integer audits = jdbc.queryForObject(
            "SELECT COUNT(*) FROM admin_audit_log WHERE entity_type = 'COUPON' AND entity_id = 'TEST-DIWALI' AND actor_clerk_user_id = ?",
            Integer.class, adminId);
        assertThat(audits).isEqualTo(3);
    }

    @Test
    void cancellingAnOrderRestocksAndRecordsHistory() throws Exception {
        String orderNumber = jdbc.query("""
            SELECT o.order_number FROM orders o JOIN order_item i ON i.order_id = o.id
             WHERE o.status = 'CONFIRMED' AND (i.sku_id IS NOT NULL OR i.accessory_id IS NOT NULL) LIMIT 1""",
            rs -> rs.next() ? rs.getString(1) : null);
        if (orderNumber == null) {
            return; // no suitable order in this database
        }
        long stockBefore = stockOf(orderNumber);
        long units = jdbc.queryForObject("""
            SELECT COALESCE(SUM(i.quantity), 0) FROM order_item i JOIN orders o ON o.id = i.order_id
             WHERE o.order_number = ? AND (i.sku_id IS NOT NULL OR i.accessory_id IS NOT NULL)""", Long.class, orderNumber);

        mvc.perform(as(adminId, post("/api/admin/orders/" + orderNumber + "/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"DELIVERED\"}")))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.title").value("INVALID_TRANSITION"));

        mvc.perform(as(adminId, post("/api/admin/orders/" + orderNumber + "/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"CANCELLED\",\"note\":\"Customer called to cancel\"}")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CANCELLED"))
            .andExpect(jsonPath("$.allowedStatuses.length()").value(0))
            .andExpect(jsonPath("$.timeline[-1].to").value("CANCELLED"))
            .andExpect(jsonPath("$.timeline[-1].byId").value(adminId))
            .andExpect(jsonPath("$.timeline[-1].note").value("Customer called to cancel"));

        assertThat(stockOf(orderNumber)).isEqualTo(stockBefore + units);

        mvc.perform(as(adminId, post("/api/admin/orders/" + orderNumber + "/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"CANCELLED\"}")))
            .andExpect(status().isConflict()); // no double restock
        assertThat(stockOf(orderNumber)).isEqualTo(stockBefore + units);
    }

    private long stockOf(String orderNumber) {
        return jdbc.queryForObject("""
            SELECT COALESCE(SUM(COALESCE(s.stock, a.stock)), 0) FROM order_item i JOIN orders o ON o.id = i.order_id
              LEFT JOIN sku s ON s.id = i.sku_id LEFT JOIN accessory a ON a.id = i.accessory_id
             WHERE o.order_number = ?""", Long.class, orderNumber);
    }

    @Test
    void roleManagementRules() throws Exception {
        // promote, then demote another user
        mvc.perform(as(adminId, put("/api/admin/customers/" + customerId + "/role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"ADMIN\"}")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("ADMIN"));
        mvc.perform(as(customerId, get("/api/admin/me"))).andExpect(status().isOk()); // cache invalidated

        mvc.perform(as(adminId, put("/api/admin/customers/" + customerId + "/role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"CUSTOMER\"}")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("CUSTOMER"));
        mvc.perform(as(customerId, get("/api/admin/me"))).andExpect(status().isForbidden());

        // can't demote yourself
        mvc.perform(as(adminId, put("/api/admin/customers/" + adminId + "/role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"CUSTOMER\"}")))
            .andExpect(status().is(422)).andExpect(jsonPath("$.title").value("CANNOT_DEMOTE_SELF"));

        // unknown, invalid id
        mvc.perform(as(adminId, put("/api/admin/customers/nobody/role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"ADMIN\"}")))
            .andExpect(status().isNotFound());
    }
}
