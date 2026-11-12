# MobiNest: Start Here

> **Read this first** (humans and AI assistants alike).
> This folder has everything needed to understand the MobiNest project and run it from scratch on a new machine.
> Last updated: **11 Nov 2026**. See [CHANGELOG.md](CHANGELOG.md) for history.

MobiNest is a full stack e-commerce application that sells **only mobile phones**: new, certified refurbished, pre-owned and eco-recycled, plus matching accessories, for the Indian market (₹ INR).

| Part | Folder | Tech | Status |
|---|---|---|---|
| **Backend API + database** (this project) | `mobinest-api/` | Java 25, Spring Boot 4.1, MySQL 8, Flyway | ✅ Working first draft: catalogue (3 active brands), checkout, orders |
| Frontend storefront | `mobinest/` (sibling folder) | React 19 + Vite + Clerk auth | ✅ **Connected to this API** (Vite proxy `/api` → :8080); has its own `CONTEXT.md` |

## Files in this folder

> 📘 **Sharing with students/others?** Start with **[NAMMA-MOBILES-COMPLETE-GUIDE.md](NAMMA-MOBILES-COMPLETE-GUIDE.md)**: one file covering setup (incl. creating your own Clerk keys), architecture, frontend, backend, database, API, admin, payments, testing, how-tos and troubleshooting. Build a secret-free zip of both projects with `setup/make-share-zip.ps1`.

| File | What it contains |
|---|---|
| [NAMMA-MOBILES-COMPLETE-GUIDE.md](NAMMA-MOBILES-COMPLETE-GUIDE.md) | **The one-file complete guide** (share this) |
| `setup/make-share-zip.ps1` | Builds `NammaMobiles-share-<date>.zip` (both projects + guide, no secrets; scans before zipping) |
| `tools/e2e/` | End-to-end test (Playwright driving installed Edge/Chrome, 23 checks) |
| **README.md** | This file: overview, folder map, **how to run**, verification, troubleshooting |
| [CONTEXT.md](CONTEXT.md) | Full project history: every request from the product owner, the decisions taken and why, current status and open items |
| [PROJECT.md](PROJECT.md) | Project details: scope, tech stack, architecture, design patterns, code structure, business rules, roadmap |
| [DATABASE.md](DATABASE.md) | Schema, ER diagram, every table and column, seed data, live statistics, reset instructions |
| [API.md](API.md) | Every endpoint with request and response examples, error format, authentication |
| [CHANGELOG.md](CHANGELOG.md) | Dated list of all changes |
| [PAYMENTS.md](PAYMENTS.md) | Razorpay + UPI integration guide for this project: quick answers, how UPI fits, step-by-step plan, testing, go-live checklist. Draft code is in `quarantine/razorpay-draft/`, pending the owner's decision |
| ADMIN.md | Admin side: access via Clerk + ADMIN role, admin endpoints (being built) |
| `setup/setup-database.ps1` | One-command MySQL setup (database, app user, local config) |
| `setup/start-mobinest.ps1` | One-command start of API + storefront in their own windows |
| `setup/create-database.template.sql` | Manual SQL alternative to the script |
| `setup/application.properties.example` | Template for the local secrets file |
| `tools/export-seed-from-frontend.mjs` | Regenerates the seed JSON from the React app's sample data |

---

## How to run (Windows)

These are the exact steps used on the original machine. An AI assistant can follow them in order.

### 1. Prerequisites

| Tool | Version | Install (if missing) | Check |
|---|---|---|---|
| JDK | **25** (Temurin) | `winget install --id EclipseAdoptium.Temurin.25.JDK -e` | `java -version` |
| MySQL Server | **8.x** | `winget install --id Oracle.MySQL -e`, then configure a root password with the MySQL Configurator (or use the MySQL Installer) | `Get-Service *mysql*` shows **Running** |
| Node.js | 22.15+ (only for the frontend or the seed tool) | `winget install OpenJS.NodeJS.LTS` | `node -v` |

You do **not** need to install Maven or Apache Tomcat. The project ships the Maven wrapper (`mvnw.cmd`), and Spring Boot runs an embedded Tomcat.

After installing the JDK, open a **new** terminal so `JAVA_HOME` and `PATH` are picked up.

### 2. Create the database (one time)

From the `mobinest-api` folder:

```powershell
powershell -ExecutionPolicy Bypass -File context\setup\setup-database.ps1
# asks for the MySQL root password (input hidden)
# non-interactive:  ... setup-database.ps1 -RootPassword "<root password>"
```

This creates the `mobinest` database and a least-privilege `mobinest_app` user, and writes `config/application.properties` with a generated password. That file is **git-ignored and must never be shared**.

Manual alternative: `context/setup/create-database.template.sql` plus `context/setup/application.properties.example`.

### 3. Start the API

```powershell
cd mobinest-api
.\mvnw.cmd spring-boot:run
```

The first start downloads dependencies (a few minutes). On startup:
- **Flyway** creates all tables (`src/main/resources/db/migration/V1__*.sql`, `V2__*.sql`).
- **CatalogSeeder** loads the sample catalogue into the empty database. The log shows: `Seeded 12 brands (3 active), 4 conditions, 32 phones (470 SKUs), 8 accessory categories, 17 accessories`.
- The API listens on **http://localhost:8080**.

### 4. Verify

| Check | Expected |
|---|---|
| http://localhost:8080/actuator/health | `{"status":"UP"}` |
| http://localhost:8080/swagger-ui.html | Interactive API docs |
| http://localhost:8080/api/catalog | JSON with 3 brands (Apple, Samsung, Google Pixel), 16 phones, 17 accessories |
| `.\mvnw.cmd test` | 7 unit tests pass (the `contextLoads` test also needs MySQL running) |

### Start everything with one command (recommended)

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\admin\mobinest-api\context\setup\start-mobinest.ps1
```
This starts MySQL if needed, then the API (waits until healthy), then the storefront. Each server runs in its own minimised window titled **"MobiNest API :8080"** and **"MobiNest Web :5173"**, so they keep running after the terminal or Claude session closes. Close those windows to stop them. Options: `-NoFrontend`, `-NoBrowser`.

> Servers started from inside a Claude Code session as background tasks stop when that session ends. Use this script to keep them running.

### 5. Frontend (optional, separate project)

```powershell
cd ..\mobinest
npm install
npm run dev     # http://localhost:5173 (needs .env.local with VITE_CLERK_PUBLISHABLE_KEY)
```

With the API running, the frontend loads its catalogue from it and places real orders. Without the API, it falls back to its bundled sample data. Start the API first, then the frontend, and open http://localhost:5173.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Access denied for user 'mobinest_app'` | `config/application.properties` is missing or stale. Re-run `setup-database.ps1`, then restart the API. |
| `Communications link failure` | MySQL isn't running: `Start-Service MySQL80` (the service name may differ). |
| `release version 25 not supported` / `java not found` | Install JDK 25 and open a new terminal, or set `JAVA_HOME` to the JDK 25 folder. |
| Port 8080 already in use | Stop the other process, or run `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"` |
| Want a clean database | `DROP DATABASE mobinest;` as root, re-run the setup script, restart the API (it re-seeds). |
| 401 on `/api/orders/me` | Expected without a valid Clerk session token. See API.md. |

## Sharing this project

- **Share:** the whole `mobinest-api` folder **except** `config/` (it holds the local DB password and logs), `target/` (build output) and `.idea/`/`.vscode/`.
- The receiver runs steps 1 to 4 above. `setup-database.ps1` generates their own password.
- Clerk keys for the frontend (`mobinest/.env.local`) are also secret. Share them privately, or let the receiver create their own Clerk app.

## Rule for maintaining this folder

Every change to the project (code, database, config, decisions, or new requests from the owner) **must** be reflected here in the same session:
1. Add a dated entry to **CHANGELOG.md**.
2. Record the request and decision in **CONTEXT.md** (conversation log and status).
3. Update whichever of **PROJECT.md / DATABASE.md / API.md / README.md** the change affects.
