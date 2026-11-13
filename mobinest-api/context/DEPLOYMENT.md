# Deployment (demo): Vercel + Railway

Live since 2026-11-13.

| Part | Host | URL |
|---|---|---|
| React storefront | Vercel (team `class-thetapacadems-projects`, project `namma-mobiles`) | https://namma-mobiles.vercel.app |
| Spring Boot API | Railway (workspace classtapacademy, project `namma-mobiles`, service `mobinest-api`) | https://mobinest-api-production.up.railway.app |
| MySQL 8 | Railway (service `MySQL`, private network only) | n/a |

```
Browser ──► namma-mobiles.vercel.app ──/api/*──► mobinest-api-production.up.railway.app ──► Railway MySQL
            (static React build)      (vercel.json rewrite)    (Spring Boot, Java 21)
```

The browser only ever talks to the Vercel domain; Vercel forwards `/api/*` to Railway, so no CORS is needed
for normal use (CORS is still configured as a fallback).

## Backend on Railway (no Docker)

Railway's **Railpack** builder detects Maven and installs Java 21. Config: `mobinest-api/railway.json`.

Service variables (`railway variables`):

| Variable | Value |
|---|---|
| `DB_URL` | `jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?serverTimezone=UTC&useSSL=false&allowPublicKeyRetrieval=true` |
| `DB_USERNAME` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `SEED_ENABLED` | `true` (loads the sample catalogue into the empty database once) |
| `RAILPACK_BUILD_CMD` | `chmod +x mvnw && ./mvnw -B -ntp -DskipTests clean package` |
| `CORS_ALLOWED_ORIGINS` | `https://namma-mobiles.vercel.app,http://localhost:5173` |
| `CLERK_AUTHORIZED_PARTIES` | `https://namma-mobiles.vercel.app,http://localhost:5173` |
| `ADMIN_CLERK_USER_IDS` | (not set yet) your Clerk `user_...` id to become admin |

`PORT` is provided by Railway; `application.yml` uses `server.port: ${PORT:8080}`.

Redeploy from your PC (after `railway login`):

```powershell
cd mobinest-api
railway link          # once: pick namma-mobiles / mobinest-api
railway up --detach   # uploads the folder, builds, deploys
railway logs          # runtime logs
```

> **Gotcha seen on 2026-11-13:** when deploying from inside the git repo, `railway up` dropped
> `src/main/java/com/mobinest/config/` (it matched a `config` ignore rule too broadly). The working
> deploy was made from a clean copy of the folder without `.gitignore`/`.railwayignore`. If the build
> says `package com.mobinest.config does not exist`, deploy from such a copy (exclude `target`, `config`,
> `context`).

## Frontend on Vercel

`mobinest/vercel.json`: Vite build to `dist`, rewrite `/api/*` → Railway, everything else → `index.html`
(so refreshing `/brand/apple` works).

Environment variable (Production + Preview): `VITE_CLERK_PUBLISHABLE_KEY` (the `pk_test_…` key; public by design).
`VITE_API_BASE_URL` is **not** needed (same-origin through the rewrite).

Redeploy from your PC (after `vercel login`):

```powershell
cd mobinest
vercel deploy --prod
```

## Notes for a demo
- Clerk runs on the **development** instance, which is fine for a demo. A real launch needs a Clerk production
  instance plus your own domain.
- Payments: cash on delivery only.
- Railway trial credit covers a demo; the API sleeps/stops if the credit runs out.
- `railway.json` (config-as-code) is deprecated by Railway in favour of `.railway/railway.ts`; existing
  files keep working until 2026-12-01. Before then, run `railway config migrate` or set the build/start
  command in the Railway dashboard.
