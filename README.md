# EAA Pack

Paste a live URL, get a readable accessibility report for that one page, fix the findings with a
small kit of copy-paste UI components, and draft an accessibility statement in Polish and English.

Built for EU-facing shops and booking sites. **Not** a legal service: reports and statements are
working drafts, not a conformity assessment, and nothing here makes a site legal.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui
- Postgres (plain SQL migration — Neon free tier, Supabase, or local Postgres all work)
- Serverless scanning via API route (Playwright-core + `@sparticuz/chromium` on Vercel)
- Optional local worker process for development (`npm run worker`)
- Email magic-link auth (Resend optional; links print to console without it)
- Stripe Checkout + Customer Portal in test mode (optional; app runs without keys)

## Environment variables

Copy `.env.example` to `.env` and fill it in:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string (Neon, Supabase, or local — use `?sslmode=require` for Neon) |
| `NEXT_PUBLIC_APP_URL` | yes | Public base URL, e.g. `https://your-app.vercel.app` or `http://localhost:4780` |
| `AUTH_SECRET` | yes | Long random string; hashes session tokens and requester IPs |
| `RESEND_API_KEY` | no | Email delivery. Without it, emails print to the console |
| `EMAIL_FROM` | no | From address for outgoing email |
| `STRIPE_SECRET_KEY` | no | Test-mode secret key. Without it, billing UI is disabled gracefully |
| `STRIPE_WEBHOOK_SECRET` | no | For `/api/stripe/webhook` |
| `STRIPE_MONITOR_PRICE_ID` | no | Price ID of the $49/mo Monitor subscription |
| `WORKER_POLL_INTERVAL_MS` | no | Queue poll interval for local worker (default 2000) |

## Deploying to Vercel (free tier)

### 1. Set up free Neon Postgres

1. Sign up at [neon.tech](https://neon.tech) (free tier supports 0.5 GB storage)
2. Create a new project and database
3. Copy the connection string — it looks like:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
4. Run the schema migration against your Neon database:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```

### 2. Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [vercel.com](https://vercel.com)
3. Add environment variables in the Vercel dashboard:
   - `DATABASE_URL` — your Neon connection string (with `?sslmode=require`)
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXT_PUBLIC_APP_URL` — your Vercel deployment URL (e.g. `https://eaa-pack.vercel.app`)
   - `RESEND_API_KEY` — (optional) for email delivery
   - `EMAIL_FROM` — (optional) e.g. `EAA Pack <noreply@yourdomain.com>`
4. Deploy

Scans execute automatically via the `/api/scans/run` API route (60s max duration on Vercel Hobby).
No separate worker process needed in production.

## Run locally

```bash
npm install

# Install Chromium for local scanning
npx playwright install chromium --with-deps

# Database (any Postgres; example for local)
createdb eaapack
npm run db:migrate            # runs db/schema.sql against $DATABASE_URL

# Terminal 1 — web
npm run dev                   # http://localhost:4780

# Terminal 2 — scan worker (optional, for local dev)
npm run worker
```

Sign-in: enter an email on `/login`. Without `RESEND_API_KEY`, the magic link is printed in the
**web** server console — open it in the browser.

**Note:** On Vercel, scans run automatically via serverless functions. The local worker is only
needed for development if you want to test scanning without the API route.

## Run a scan against the fixtures (acceptance test)

The app ships two fixture pages that exercise the whole pipeline:

- `http://localhost:4780/fixtures/bad-checkout` — a checkout with deliberate failures. A scan
  must flag at least: a missing form label (`label`, critical), a contrast failure
  (`color-contrast`, serious) and a button without an accessible name (`button-name`, critical).
- `http://localhost:4780/fixtures/good-checkout` — the same checkout rebuilt from the kit. A scan
  must report **zero critical** issues.

With web + worker running, go to `/scan`, paste a fixture URL, submit, and watch the report page.
These fixture URLs are the single deliberate exception to the https/localhost scan rules (see
`src/lib/ssrf.ts`) so the acceptance test works locally.

## Scan rules

- https only; localhost, `file:` and private/link-local IPs are rejected (SSRF guard), re-checked
  in the worker at execution time
- one URL, one page; 20s navigation budget (50s total on Vercel); 1440×900 viewport; max 2MB HTML
- no login, no stored target cookies; identifies as `EAAPackBot/0.1`
- full axe JSON persisted on the scan; violations flattened into `issues` with a static
  `rule_id → kit_key` map (`src/lib/kit-map.ts`)
- `scope_guess` is a heuristic (`ecommerce` | `unknown`) — never "exempt"
- rate limits: 5 anonymous scans per IP per day, 10 per month on the free plan

## Billing (optional, test mode)

Create a $49/mo recurring price in a Stripe test account, set the three `STRIPE_*` vars, and
forward webhooks:

```bash
stripe listen --forward-to localhost:4780/api/stripe/webhook
```

Free: 1 URL, reports, watermarked statement. Monitor ($49/mo, 7-day trial): 10 URLs, weekly
rescans by the worker, email on new critical/serious issues, full kit source, unwatermarked
statements. Cancel anytime via the portal.

## Project map

```
db/schema.sql                  # all tables + kit_items seed (idempotent)
worker/                        # optional local worker: Playwright + axe-core
src/lib/scanner.ts             # shared scan logic (serverless-compatible)
src/lib/                       # db, auth, ssrf, scans, kit-map, statement, stripe
src/app/api/scans/run/         # serverless scan execution endpoint
src/components/kit/            # the 8 kit components (React + Tailwind)
src/components/kit/html/       # their plain-HTML twins
src/app/(site)/                # public pages: landing, scan, report, pricing, docs, statement
src/app/app/                   # signed-in app: sites, kit, settings
src/app/fixtures/              # bad-checkout / good-checkout acceptance fixtures
```
