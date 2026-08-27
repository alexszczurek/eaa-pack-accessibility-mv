# EAA Pack

Paste a live URL, get a readable accessibility report for that one page, fix the findings with a
small kit of copy-paste UI components, and draft an accessibility statement in Polish and English.

Built for EU-facing shops and booking sites. **Not** a legal service: reports and statements are
working drafts, not a conformity assessment, and nothing here makes a site legal.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui
- Postgres (plain SQL migration — local Postgres or Supabase both work)
- One worker process + one queue table (`scans`), Playwright + `@axe-core/playwright`
- Email magic-link auth (Resend optional; links print to console without it)
- Stripe Checkout + Customer Portal in test mode (optional; app runs without keys)

## Environment variables

Copy `.env.example` to `.env` and fill it in:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string (Supabase URI works) |
| `NEXT_PUBLIC_APP_URL` | yes | Public base URL, e.g. `http://localhost:4780` |
| `AUTH_SECRET` | yes | Long random string; hashes session tokens and requester IPs |
| `RESEND_API_KEY` | no | Email delivery. Without it, emails print to the console |
| `EMAIL_FROM` | no | From address for outgoing email |
| `STRIPE_SECRET_KEY` | no | Test-mode secret key. Without it, billing UI is disabled gracefully |
| `STRIPE_WEBHOOK_SECRET` | no | For `/api/stripe/webhook` |
| `STRIPE_MONITOR_PRICE_ID` | no | Price ID of the $49/mo Monitor subscription |
| `WORKER_POLL_INTERVAL_MS` | no | Queue poll interval (default 2000) |

## Run it

```bash
npm install
npx playwright install chromium --with-deps

# database (any Postgres; example for local)
createdb eaapack
npm run db:migrate            # runs db/schema.sql against $DATABASE_URL

# terminal 1 — web
npm run dev                   # http://localhost:4780

# terminal 2 — scan worker
npm run worker
```

Sign-in: enter an email on `/login`. Without `RESEND_API_KEY`, the magic link is printed in the
**web** server console — open it in the browser.

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
- one URL, one page; 20s budget; 1440×900 viewport; max 2MB HTML
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
worker/                        # queue worker: Playwright + axe-core
src/lib/                       # db, auth, ssrf, scans, kit-map, statement, stripe
src/components/kit/            # the 8 kit components (React + Tailwind)
src/components/kit/html/       # their plain-HTML twins
src/app/(site)/                # public pages: landing, scan, report, pricing, docs, statement
src/app/app/                   # signed-in app: sites, kit, settings
src/app/fixtures/              # bad-checkout / good-checkout acceptance fixtures
```
