# MobiNest: Project Details & Architecture

## 1. Product

An Indian e-commerce store that sells **only branded mobile phones**: a one-stop destination for anyone buying a phone.

- **Many brands and models**, each with colours and RAM/storage variants.
- **Every way to buy:** Brand New · Certified Refurbished (12-month warranty) · Pre-owned (6-month) · Eco Recycled (3-month).
- **Accessories** matched to phone brands (cases, screen protection, chargers, cables, audio, power banks, watches, mounts).
- Sell or recycle your old phone (trade-in quote and pickup). Frontend only so far.
- Market: India: ₹ INR, Indian states, 6-digit pincodes, 10-digit mobile numbers, UPI/cards/EMI/net banking/COD.

## 2. Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19, Vite 8, React Router 7, Clerk (`@clerk/react`) | Separate project `mobinest/` |
| API | **Spring Boot 4.1.2** (Spring Framework 7, Spring Security 7), **Java 25** | Embedded Tomcat on :8080 |
| Persistence | Spring Data JPA / Hibernate 7, **MySQL 8**, **Flyway** migrations | `ddl-auto: none` |
| JSON | Jackson 3 (`tools.jackson.*`) | Boot 4 default |
| Auth | OAuth2 Resource Server verifying **Clerk** JWTs | No passwords stored by us |
| Docs | springdoc-openapi 3.2.0 | `/swagger-ui.html` |
| Validation | Jakarta Bean Validation | Messages match the React form |
| Boilerplate | Lombok (entities), Java records (DTOs) | |
| Build / test | Maven wrapper, JUnit 5, AssertJ | |
| Planned | Razorpay, Spring AI, Testcontainers, Docker | See roadmap |

## 3. Architecture

```
┌─────────────────────┐   HTTPS / JSON    ┌───────────────────────────────────────┐   JPA    ┌──────────┐
│ React SPA (:5173)   │ ───────────────▶ │ Spring Boot API (:8080)               │ ───────▶ │ MySQL 8  │
│ Clerk <SignIn/>     │  Authorization:   │  SecurityFilterChain (JWT, CORS)      │          │ mobinest │
│ getToken() ─────────┼─ Bearer <jwt> ──▶ │  Controllers → Services → Repositories│          └──────────┘
└─────────────────────┘                   │  Flyway migrations · Catalogue seeder │
          │                               └───────────────────────────────────────┘
          │ sign-in                                    │ JWKS (public keys)
          ▼                                            ▼
     ┌──────────┐  ◀──────────────────────────────────────
     │  Clerk   │
     └──────────┘
```

### Request flow: placing an order
1. React sends `POST /api/orders` with the address, payment method, coupon and the **selection** for each line (product id, variant index, colour, condition, qty). No prices are sent.
2. `SecurityConfig`: the endpoint is public (guest checkout). If a Bearer token is present it must be a valid Clerk JWT.
3. `OrderController` validates the body (`@Valid`) and calls `OrderService.placeOrder` (one `@Transactional` unit).
4. For each line: look up the SKU, **atomically reserve stock**, and snapshot the name and price.
5. Calculate subtotal, coupon (`CouponService`), shipping (`CheckoutRules`), total; enforce the COD limit.
6. Link to the `Customer` (created on first use from the JWT `sub`), generate the order number, ask the `PaymentGateway` for a payment result.
7. Save, then publish `OrderPlacedEvent`. After commit, `OrderNotificationListener` runs (it will send email later).
8. Return `201 Created` with the order in the React app's order format.

## 4. Code structure

```
mobinest-api/
├── pom.xml                         Spring Boot 4.1.2 parent, Java 25, springdoc 3.2.0
├── mvnw, mvnw.cmd, .mvn/           Maven wrapper
├── config/                         (git-ignored) application.properties with DB password, logs
├── context/                        THIS documentation + setup scripts
└── src/
    ├── main/java/com/mobinest/
    │   ├── MobinestApiApplication.java      @SpringBootApplication @ConfigurationPropertiesScan @EnableAsync
    │   ├── config/        AppProperties (mobinest.*), SecurityConfig (JWT/CORS/rules), OpenApiConfig
    │   ├── common/
    │   │   ├── error/     ApiException, NotFoundException, BusinessRuleException, GlobalExceptionHandler
    │   │   ├── json/      JsonAttributeConverter + JsonConverters (List/Map/Swatch <-> MySQL JSON)
    │   │   └── web/       PageResponse
    │   ├── catalog/
    │   │   ├── domain/    Brand, ConditionGrade, Phone, PhoneVariant, PhoneColor, Sku, AccessoryCategory, Accessory, Swatch
    │   │   ├── repo/      Spring Data repositories (+ atomic stock decrement queries)
    │   │   ├── dto/       CatalogDtos (records shaped like the React data)
    │   │   ├── service/   CatalogService, CatalogMapper, PricingPolicy, PhoneSpecifications
    │   │   ├── web/       CatalogController
    │   │   └── seed/      CatalogSeeder (loads resources/seed/*.json into an empty DB)
    │   ├── customer/      Customer, CustomerRepository, CustomerService (JIT provisioning), MeController
    │   └── order/
    │       ├── domain/    CustomerOrder, OrderItem, ShippingAddress, OrderEnums, OrderRepository
    │       ├── coupon/    Coupon, DiscountType (strategy), CouponRepository, CouponService, CouponController
    │       ├── payment/   PaymentGateway (strategy), CashOnDeliveryGateway, DemoOnlineGateway
    │       ├── service/   OrderService (facade), OrderMapper, CheckoutRules, OrderNumberGenerator
    │       ├── event/     OrderPlacedEvent, OrderNotificationListener
    │       ├── dto/       OrderDtos (request + response records)
    │       └── web/       OrderController
    ├── main/resources/
    │   ├── application.yml                  all non-secret config (env-var overridable)
    │   ├── db/migration/V1__catalog.sql, V2__customers_coupons_orders.sql
    │   └── seed/*.json                      sample catalogue exported from the React app
    └── test/java/com/mobinest/
        ├── MobinestApiApplicationTests.java (context load: needs MySQL)
        ├── catalog/service/PricingPolicyTest.java
        └── order/coupon/CouponTest.java
```

## 5. Design patterns

| Pattern | Where | Benefit |
|---|---|---|
| **Layered architecture** | Controller → Service → Repository | Separation of concerns; each layer testable |
| **Package by feature** | `catalog`, `order`, `customer` | High cohesion; features can later become modules or services |
| **DTO + Mapper** | `CatalogDtos`/`OrderDtos`, `CatalogMapper`/`OrderMapper` | Entities never leak; API contract is explicit and stable |
| **Repository** | Spring Data interfaces | Persistence abstraction |
| **Specification** | `PhoneSpecifications` | Composable dynamic search filters |
| **Strategy** | `DiscountType` (PERCENT/FLAT); `PaymentGateway` impls | Add coupon types or payment providers without touching checkout |
| **Adapter** | `PaymentGateway` around providers; Clerk JWT to `Customer` | Isolates third-party APIs |
| **Facade** | `OrderService.placeOrder` | One transactional entry point over many collaborators |
| **Observer / domain events** | `OrderPlacedEvent` + `@TransactionalEventListener` | Side effects only after commit; loose coupling |
| **Aggregate root** | `Phone` owns variants, colours, SKUs; `CustomerOrder` owns items | Consistency boundaries; cascade rules |
| **Builder / value objects** | records, `ShippingAddress` (`@Embeddable`), `Swatch` | Immutable, self-describing data |
| **Dependency injection / singletons** | Spring beans, constructor injection (`@RequiredArgsConstructor`) | Testable, no static state |
| **Template method** | `JsonAttributeConverter<T>` base + typed subclasses | Reuse JSON column logic |

## 6. Business rules (server is the source of truth)

| Rule | Value / behaviour | Where |
|---|---|---|
| Selling price of a SKU | `MRP x (1 - phone.discount) x condition.priceFactor`, rounded to ₹..99 (min ₹99); MRP unchanged when the factor is 1 and there's no discount | `PricingPolicy` (applied when seeding) |
| Condition price factors | new 1.00 · refurbished 0.78 · used 0.64 · recycled 0.52 | `condition_grade` |
| Free shipping | subtotal ≥ ₹499, otherwise ₹49 | `CheckoutRules` |
| COD limit | total ≤ ₹50,000 | `CheckoutRules` |
| Max qty per line | 5; max 20 lines per order | `OrderDtos` validation + DB CHECK |
| Coupons | WELCOME10 (10%, max ₹2,000) · MOBI1000 (₹1,000 off, subtotal ≥ ₹25,000) · ACCESS20 (20%, subtotal ≤ ₹5,000) | `coupon` table |
| Stock | reserved atomically; never negative | `SkuRepository.decrementStock`, `CHECK (stock >= 0)` |
| Estimated delivery | today (Asia/Kolkata) + 4 days | `CheckoutRules.DELIVERY_DAYS` |
| Order number | `MN` + base-36 timestamp + 4 random chars | `OrderNumberGenerator` |
| Order visibility | owner only (others get 404) | `OrderService.myOrder` |
| Brand visibility | only `brand.active` brands and their phones are listed, viewable and orderable; inactive data is kept. Current focus: Apple, Samsung, Google Pixel | `PhoneRepository.findVisible*`, `PhoneSpecifications.visible()`, V3 |

## 7. Configuration

`src/main/resources/application.yml` (defaults, overridable by environment variables):

| Property | Env var | Default |
|---|---|---|
| `spring.datasource.url` | `DB_URL` | `jdbc:mysql://localhost:3306/mobinest?...` |
| `spring.datasource.username` | `DB_USERNAME` | `mobinest_app` |
| `spring.datasource.password` | `DB_PASSWORD` | _(from config/application.properties)_ |
| `mobinest.clerk.issuer` | `CLERK_ISSUER` | `https://unique-glider-3348.clerk.accounts.dev` (dev instance, public) |
| `mobinest.clerk.authorized-parties` | `CLERK_AUTHORIZED_PARTIES` | `http://localhost:5173` |
| `mobinest.cors.allowed-origins` | `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` |
| `mobinest.seed.enabled` | `SEED_ENABLED` | `true` |
| `mobinest.admin.clerk-user-ids` | `ADMIN_CLERK_USER_IDS` | _(empty)_ Clerk user ids that are always ADMIN (comma-separated) |
| `mobinest.admin.role-cache-ttl` | `ADMIN_ROLE_CACHE_TTL` | `30s` |
| `server.port` | `SERVER_PORT` | `8080` |

## 8. Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Project setup, MySQL, Flyway, Swagger | ✅ Done |
| 1 | Catalogue APIs + seed from the React data | ✅ Done |
| 2 | Auth via Clerk JWT, `/api/me` | ✅ Done (backend side) |
| 3 | Checkout: server pricing, coupons, stock, orders, order history | ✅ Done (demo payments) |
| 3b | Brand visibility (3 active brands, hero phones), Flyway V3 | ✅ Done |
| 4 | Connect the React app to the API | ✅ Done by the frontend session (signed-in flow still to be tried by the owner) |
| 4b | Product image URLs in the API (optional) | Proposed |
| 5 | Razorpay payments + webhook + auto-cancel | Planned |
| 6 | Server-side cart, wishlist, addresses | Planned |
| 7 | Admin APIs + admin UI (dashboard, orders, payments, catalogue, stock, prices, coupons, roles, audit) | ✅ Done 12 Nov (see ADMIN.md) |
| 8 | Trade-in API, reviews, emails | Planned |
| 9 | Spring AI phone advisor | Planned |
| 10 | Testcontainers integration tests, Docker, CI, deployment | Planned |
