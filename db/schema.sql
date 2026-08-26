-- EAA Pack schema. Run with:
--   psql "$DATABASE_URL" -f db/schema.sql
-- Idempotent: safe to re-run.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Auth infrastructure (magic links + sessions).
create table if not exists auth_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: anonymous scans create a site row with no owner.
  user_id uuid references users(id) on delete set null,
  url text not null,
  name text,
  created_at timestamptz not null default now()
);
create index if not exists sites_user_id_idx on sites(user_id);

create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  requested_by uuid references users(id) on delete set null,
  -- sha256 of requester IP, for anonymous rate limiting only. No raw IPs stored.
  ip_hash text,
  status text not null default 'queued' check (status in ('queued','running','done','failed')),
  axe_raw jsonb,
  summary jsonb,
  scope_guess text check (scope_guess in ('ecommerce','unknown')),
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index if not exists scans_site_id_idx on scans(site_id);
create index if not exists scans_status_idx on scans(status) where status = 'queued';
create index if not exists scans_ip_hash_idx on scans(ip_hash, created_at);
create index if not exists scans_requested_by_idx on scans(requested_by, created_at);

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references scans(id) on delete cascade,
  rule_id text not null,
  impact text not null check (impact in ('critical','serious','moderate','minor')),
  selector text,
  html_snippet text,
  help_url text,
  kit_key text
);
create index if not exists issues_scan_id_idx on issues(scan_id);

create table if not exists statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  site_id uuid references sites(id) on delete set null,
  generated_from_scan_id uuid references scans(id) on delete set null,
  language text not null check (language in ('pl','en')),
  body_md text not null,
  watermarked boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists statements_site_id_idx on statements(site_id);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free','monitor')),
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists kit_items (
  key text primary key,
  title text not null,
  framework text not null default 'next' check (framework in ('next','html','framer')),
  issue_rule_ids text[] not null default '{}',
  source text not null,
  description text not null default ''
);

-- Seed the 8 kit items (React source paths; each has a plain-HTML twin
-- at src/components/kit/html/<key>.html).
insert into kit_items (key, title, framework, issue_rule_ids, source, description) values
  ('skip-link', 'Skip link', 'next', '{bypass,skip-link}', 'src/components/kit/skip-link.tsx',
   'A link that appears on first Tab press and jumps keyboard users past the header straight to the main content.'),
  ('focus-ring', 'Focus ring tokens', 'next', '{button-name,link-name,focus-order-semantics}', 'src/components/kit/focus-ring.tsx',
   'Visible focus styles plus button and link primitives with accessible names built in.'),
  ('text-field', 'Text field', 'next', '{label,label-title-only,select-name,form-field-multiple-labels,input-button-name}', 'src/components/kit/text-field.tsx',
   'Input with a real label, hint and error wiring via for/id and aria-describedby.'),
  ('checkbox-radio', 'Checkbox and radio', 'next', '{label,checkboxgroup,radiogroup}', 'src/components/kit/checkbox-radio.tsx',
   'Checkbox and radio with a 24px hit target and a clickable label.'),
  ('dialog', 'Dialog', 'next', '{aria-dialog-name,aria-hidden-focus}', 'src/components/kit/dialog.tsx',
   'Modal dialog with focus trap, Escape to close, and focus restore to the trigger.'),
  ('nav', 'Navigation', 'next', '{region,landmark-one-main,landmark-unique,landmark-no-duplicate-banner,landmark-banner-is-top-level}', 'src/components/kit/nav.tsx',
   'Header navigation landmark with a mobile toggle that reports aria-expanded.'),
  ('contrast-tokens', 'Contrast tokens', 'next', '{color-contrast,color-contrast-enhanced,link-in-text-block}', 'src/components/kit/contrast-tokens.tsx',
   'Text, muted, background and danger color tokens that hold 4.5:1 against their backgrounds.'),
  ('statement-page', 'Statement page', 'next', '{document-title,html-has-lang,page-has-heading-one}', 'src/components/kit/statement-page.tsx',
   'Printable page layout for publishing your accessibility statement.')
on conflict (key) do update set
  title = excluded.title,
  framework = excluded.framework,
  issue_rule_ids = excluded.issue_rule_ids,
  source = excluded.source,
  description = excluded.description;
