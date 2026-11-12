# MobiNest API

Spring Boot backend for **MobiNest**, an online store that sells only mobile phones (new, refurbished, pre-owned, recycled) and their accessories. The React storefront lives in `../mobinest`.

## Stack

| Layer | Choice |
|---|---|
| Language / runtime | Java 25 (Temurin) |
| Framework | Spring Boot 4.1 (embedded Tomcat on :8080; no separate Tomcat install) |
| Persistence | Spring Data JPA (Hibernate 7) + MySQL 8, schema managed by Flyway |
| Security | Spring Security OAuth2 resource server that verifies **Clerk** session JWTs |
| API docs | springdoc-openapi: http://localhost:8080/swagger-ui.html |
| Build | Maven wrapper (`mvnw.cmd`); no global Maven needed |

> 📁 **Full documentation lives in [`context/`](context/README.md)**: start with `context/README.md`
> (setup from scratch, project history, architecture, database, API, changelog).

## Run locally

```bat
:: one-time: create DB + app user + config\application.properties (asks for the MySQL root password)
powershell -ExecutionPolicy Bypass -File context\setup\setup-database.ps1

:: start the API (creates tables + loads the sample catalogue on first run)
mvnw.cmd spring-boot:run

:: tests
mvnw.cmd test
```

`config/application.properties` holds the local DB password. It is **git-ignored**, and Spring Boot loads it automatically. In production, set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `CLERK_ISSUER`, `CLERK_AUTHORIZED_PARTIES` and `CORS_ALLOWED_ORIGINS` as environment variables.

## Architecture

```
React (Clerk sign-in) --Bearer JWT--> Spring Boot REST API --JPA--> MySQL
```

Code is organised **by feature**. Each feature has its own entities, repositories, services, DTOs and controllers:

```
com.mobinest
├── config/     SecurityConfig (Clerk JWT, CORS), OpenApiConfig, AppProperties
├── common/     error handling (RFC 9457 problem details), JSON column converters, PageResponse
├── catalog/    domain (Brand, ConditionGrade, Phone, PhoneVariant, PhoneColor, Sku, Accessory...)
│               repo, service (CatalogService, PricingPolicy, PhoneSpecifications), web, seed
├── customer/   Customer (local profile keyed by Clerk user id), CustomerService, /api/me
└── order/      domain (CustomerOrder, OrderItem, ShippingAddress), coupon, payment, service, event, web
```

### Design patterns used

| Pattern | Where | Why |
|---|---|---|
| Layered (Controller → Service → Repository) | everywhere | separation of concerns, testability |
| DTO + Mapper | `*Dtos`, `CatalogMapper`, `OrderMapper` | entities never leak to the API |
| Repository + Specification | `PhoneRepository`, `PhoneSpecifications` | composable search filters |
| Strategy | `DiscountType`, `PaymentGateway` implementations | new coupon types or payment providers without editing checkout |
| Facade | `OrderService.placeOrder` | one transactional entry point over catalogue, stock, coupons, payments, customers |
| Observer (domain events) | `OrderPlacedEvent` + `@TransactionalEventListener` | side effects (email) only after a successful commit |
| Just-in-time provisioning | `CustomerService.resolve` | Clerk owns identity; a local profile is created on first use |

### Key business rules (enforced server-side)

- The client sends only *what* to buy; **all prices, discounts, shipping and totals are computed by the server**.
- **SKU = phone + variant + colour + condition**, each with its own price and stock.
- **No overselling:** stock is reserved with an atomic `UPDATE ... WHERE stock >= qty`, and a DB `CHECK (stock >= 0)` backs it up.
- Order lines store a **snapshot** of name and price, so later catalogue edits never change past orders.
- Free shipping from ₹499 (otherwise ₹49); Cash on Delivery only up to ₹50,000; coupons are validated against the DB.

## Endpoints

| Method | Path | Auth |
|---|---|---|
| GET | `/api/catalog` (everything the storefront needs) | public |
| GET | `/api/brands`, `/api/conditions` | public |
| GET | `/api/phones?brand=&q=&fiveG=&page=&size=` · `/api/phones/{id}` | public |
| GET | `/api/accessories?category=` · `/api/accessories/{id}` | public |
| POST | `/api/coupons/validate` | public |
| POST | `/api/orders` (guest or signed-in) | optional |
| GET | `/api/orders/me` · `/api/orders/{orderNumber}` | Clerk JWT |
| GET | `/api/me` | Clerk JWT |
| GET | `/actuator/health` | public |

## Roadmap

1. Razorpay payments (`RazorpayGateway`, signature verification, webhook, auto-cancel unpaid orders)
2. Server-side cart and wishlist, saved addresses
3. Admin APIs (products, SKU prices/stock, orders, coupons) with an `ADMIN` role
4. Trade-in (sell your phone) requests and pickups
5. Spring AI "phone advisor" chat with tool calling over `CatalogService`
6. Integration tests (Testcontainers MySQL), Docker image, deployment
