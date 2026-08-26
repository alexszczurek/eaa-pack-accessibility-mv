import "server-only";
import { createHash } from "crypto";
import { query, queryOne } from "./db";
import { validateScanUrl, ScanUrlError } from "./ssrf";

export const ANON_SCANS_PER_IP_PER_DAY = 5;
export const FREE_SCANS_PER_MONTH = 10;
export const FREE_SITE_LIMIT = 1;
export const MONITOR_SITE_LIMIT = 10;

export interface ScanSummary {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  total: number;
  urlFinal?: string;
  pageTitle?: string;
}

export class RateLimitError extends Error {}

export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + (process.env.AUTH_SECRET || ""))
    .digest("hex");
}

interface EnqueueArgs {
  url: string;
  ip: string;
  userId?: string | null;
  plan?: "free" | "monitor";
  /** Reuse an existing site (rescans from the app). */
  siteId?: string;
}

/**
 * Validates the URL, enforces rate limits, creates (or reuses) the site row
 * and inserts a queued scan. Returns the scan id.
 * Throws ScanUrlError or RateLimitError with user-facing messages.
 */
export async function enqueueScan(args: EnqueueArgs): Promise<string> {
  const normalizedUrl = await validateScanUrl(args.url);
  const ipHash = hashIp(args.ip);

  if (!args.userId) {
    const row = await queryOne<{ count: string }>(
      `select count(*) as count from scans
       where ip_hash = $1 and requested_by is null and created_at > now() - interval '1 day'`,
      [ipHash]
    );
    if (Number(row?.count ?? 0) >= ANON_SCANS_PER_IP_PER_DAY) {
      throw new RateLimitError(
        `Anonymous scans are limited to ${ANON_SCANS_PER_IP_PER_DAY} per day. Sign in to continue.`
      );
    }
  } else if (args.plan !== "monitor") {
    const row = await queryOne<{ count: string }>(
      `select count(*) as count from scans
       where requested_by = $1 and created_at > date_trunc('month', now())`,
      [args.userId]
    );
    if (Number(row?.count ?? 0) >= FREE_SCANS_PER_MONTH) {
      throw new RateLimitError(
        `The free plan includes ${FREE_SCANS_PER_MONTH} scans per month. Upgrade to Monitor for weekly automatic rescans.`
      );
    }
  }

  let siteId = args.siteId ?? null;
  if (siteId) {
    const site = await queryOne<{ id: string }>(
      `select id from sites where id = $1 and user_id = $2`,
      [siteId, args.userId ?? null]
    );
    if (!site) throw new ScanUrlError("Site not found.");
  } else if (args.userId) {
    const existing = await queryOne<{ id: string }>(
      `select id from sites where user_id = $1 and url = $2`,
      [args.userId, normalizedUrl]
    );
    if (existing) {
      siteId = existing.id;
    } else {
      const limit = args.plan === "monitor" ? MONITOR_SITE_LIMIT : FREE_SITE_LIMIT;
      const row = await queryOne<{ count: string }>(
        `select count(*) as count from sites where user_id = $1`,
        [args.userId]
      );
      if (Number(row?.count ?? 0) >= limit) {
        throw new RateLimitError(
          args.plan === "monitor"
            ? `The Monitor plan covers up to ${MONITOR_SITE_LIMIT} URLs.`
            : `The free plan covers 1 URL. Upgrade to Monitor for up to ${MONITOR_SITE_LIMIT}.`
        );
      }
      const site = await queryOne<{ id: string }>(
        `insert into sites (user_id, url, name) values ($1, $2, $3) returning id`,
        [args.userId, normalizedUrl, hostnameOf(normalizedUrl)]
      );
      siteId = site!.id;
    }
  } else {
    const site = await queryOne<{ id: string }>(
      `insert into sites (user_id, url, name) values (null, $1, $2) returning id`,
      [normalizedUrl, hostnameOf(normalizedUrl)]
    );
    siteId = site!.id;
  }

  const scan = await queryOne<{ id: string }>(
    `insert into scans (site_id, requested_by, ip_hash) values ($1, $2, $3) returning id`,
    [siteId, args.userId ?? null, ipHash]
  );
  return scan!.id;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export async function getScanWithIssues(scanId: string) {
  const scan = await queryOne<{
    id: string;
    status: string;
    summary: ScanSummary | null;
    scope_guess: string | null;
    error: string | null;
    created_at: string;
    finished_at: string | null;
    url: string;
    site_id: string;
    site_user_id: string | null;
  }>(
    `select sc.id, sc.status, sc.summary, sc.scope_guess, sc.error, sc.created_at, sc.finished_at,
            s.url, s.id as site_id, s.user_id as site_user_id
     from scans sc join sites s on s.id = sc.site_id
     where sc.id = $1`,
    [scanId]
  );
  if (!scan) return null;
  const issues = await query<{
    id: string;
    rule_id: string;
    impact: string;
    selector: string | null;
    html_snippet: string | null;
    help_url: string | null;
    kit_key: string | null;
  }>(
    `select id, rule_id, impact, selector, html_snippet, help_url, kit_key
     from issues where scan_id = $1
     order by array_position(array['critical','serious','moderate','minor'], impact), rule_id`,
    [scanId]
  );
  return { scan, issues };
}
