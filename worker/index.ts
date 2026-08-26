/**
 * EAA Pack scan worker. One process, one queue table.
 * Run with: npm run worker
 *
 * - polls `scans` for queued rows (FOR UPDATE SKIP LOCKED)
 * - re-validates the target URL (SSRF guard), fetches it with Playwright,
 *   runs axe-core and flattens violations into `issues`
 * - enqueues weekly rescans for sites owned by Monitor subscribers
 * - emails the owner when a rescan finds new critical/serious issues
 */
import { getPool, query, queryOne } from "../src/lib/db";
import { validateScanUrl, ScanUrlError } from "../src/lib/ssrf";
import { RULE_TO_KIT } from "../src/lib/kit-map";
import { sendEmail } from "../src/lib/email";
import { runScan, ScanFailure, closeBrowser } from "./scanner";

const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_INTERVAL_MS || 2000);
const RESCAN_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const MAX_NODES_PER_RULE = 50;

const IMPACTS = ["critical", "serious", "moderate", "minor"] as const;

interface ClaimedScan extends Record<string, unknown> {
  id: string;
  site_id: string;
  url: string;
  requested_by: string | null;
}

async function claimScan(): Promise<ClaimedScan | null> {
  return queryOne<ClaimedScan>(
    `update scans set status = 'running', started_at = now()
     where id = (
       select id from scans where status = 'queued'
       order by created_at asc
       for update skip locked
       limit 1
     )
     returning id, site_id, requested_by,
       (select url from sites where sites.id = scans.site_id) as url`
  );
}

async function processScan(scan: ClaimedScan): Promise<void> {
  console.log(`[worker] scan ${scan.id} -> ${scan.url}`);
  try {
    // Re-validate at execution time (DNS may have changed since enqueue).
    await validateScanUrl(scan.url);
    const result = await runScan(scan.url);

    const counts: Record<string, number> = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const violation of result.violations) {
      const impact = normalizeImpact(violation.impact);
      const kitKey = RULE_TO_KIT[violation.id] ?? null;
      const nodes = violation.nodes.slice(0, MAX_NODES_PER_RULE);
      counts[impact] += nodes.length;
      for (const node of nodes) {
        await query(
          `insert into issues (scan_id, rule_id, impact, selector, html_snippet, help_url, kit_key)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [
            scan.id,
            violation.id,
            impact,
            (node.target ?? []).join(" "),
            (node.html ?? "").slice(0, 2000),
            violation.helpUrl ?? null,
            kitKey,
          ]
        );
      }
    }

    const summary = {
      critical: counts.critical,
      serious: counts.serious,
      moderate: counts.moderate,
      minor: counts.minor,
      total: counts.critical + counts.serious + counts.moderate + counts.minor,
      pageTitle: result.pageTitle,
      urlFinal: result.finalUrl,
    };

    await query(
      `update scans set status = 'done', axe_raw = $2, summary = $3, scope_guess = $4, finished_at = now()
       where id = $1`,
      [scan.id, JSON.stringify(result.axeRaw), JSON.stringify(summary), result.scopeGuess]
    );
    console.log(
      `[worker] scan ${scan.id} done: ${summary.total} issues (${summary.critical} critical, ${summary.serious} serious)`
    );

    await maybeNotifyOwner(scan, summary);
  } catch (err) {
    const message =
      err instanceof ScanFailure || err instanceof ScanUrlError
        ? err.message
        : "The scan failed unexpectedly. Try again in a few minutes.";
    if (!(err instanceof ScanFailure) && !(err instanceof ScanUrlError)) {
      console.error(`[worker] scan ${scan.id} unexpected error:`, err);
    }
    await query(`update scans set status = 'failed', error = $2, finished_at = now() where id = $1`, [
      scan.id,
      message,
    ]);
    console.log(`[worker] scan ${scan.id} failed: ${message}`);
  }
}

function normalizeImpact(impact: string | null): (typeof IMPACTS)[number] {
  return (IMPACTS as readonly string[]).includes(impact ?? "") ? (impact as (typeof IMPACTS)[number]) : "minor";
}

/** Email the site owner when a Monitor-plan rescan finds new critical/serious issues. */
async function maybeNotifyOwner(
  scan: ClaimedScan,
  summary: { critical: number; serious: number }
): Promise<void> {
  const owner = await queryOne<{ email: string; plan: string }>(
    `select u.email, coalesce(sub.plan, 'free') as plan
     from sites s
     join users u on u.id = s.user_id
     left join subscriptions sub on sub.user_id = u.id
     where s.id = $1`,
    [scan.site_id]
  );
  if (!owner || owner.plan !== "monitor") return;

  const previous = await queryOne<{ summary: { critical: number; serious: number } }>(
    `select summary from scans
     where site_id = $1 and status = 'done' and id != $2
     order by finished_at desc limit 1`,
    [scan.site_id, scan.id]
  );
  if (!previous?.summary) return;

  const newCritical = summary.critical - (previous.summary.critical ?? 0);
  const newSerious = summary.serious - (previous.summary.serious ?? 0);
  if (newCritical <= 0 && newSerious <= 0) return;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4780").replace(/\/$/, "");
  await sendEmail({
    to: owner.email,
    subject: `New accessibility issues found on ${hostnameOf(scan.url)}`,
    text: [
      `The latest scan of ${scan.url} found new issues since the previous scan:`,
      newCritical > 0 ? `- ${newCritical} new critical` : null,
      newSerious > 0 ? `- ${newSerious} new serious` : null,
      "",
      `Report: ${appUrl}/scan/${scan.id}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Queue weekly rescans for Monitor-plan sites whose last scan is older than 7 days. */
async function enqueueWeeklyRescans(): Promise<void> {
  const due = await query<{ id: string; user_id: string }>(
    `select s.id, s.user_id
     from sites s
     join subscriptions sub on sub.user_id = s.user_id and sub.plan = 'monitor'
     where not exists (
       select 1 from scans sc where sc.site_id = s.id and sc.status in ('queued','running')
     )
     and coalesce(
       (select max(sc.finished_at) from scans sc where sc.site_id = s.id and sc.status = 'done'),
       'epoch'::timestamptz
     ) < now() - interval '7 days'
     and exists (select 1 from scans sc where sc.site_id = s.id)`
  );
  for (const site of due) {
    await query(`insert into scans (site_id, requested_by) values ($1, $2)`, [site.id, site.user_id]);
    console.log(`[worker] weekly rescan queued for site ${site.id}`);
  }
}

async function main(): Promise<void> {
  console.log(`[worker] EAA Pack worker started (poll every ${POLL_INTERVAL_MS}ms)`);
  let lastRescanCheck = 0;
  let shuttingDown = false;

  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log("[worker] shutting down...");
    await closeBrowser();
    await getPool().end();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  for (;;) {
    if (shuttingDown) return;
    try {
      if (Date.now() - lastRescanCheck > RESCAN_CHECK_INTERVAL_MS) {
        lastRescanCheck = Date.now();
        await enqueueWeeklyRescans();
      }
      const scan = await claimScan();
      if (scan) {
        await processScan(scan);
        continue; // drain the queue without sleeping
      }
    } catch (err) {
      console.error("[worker] loop error:", err);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main();
