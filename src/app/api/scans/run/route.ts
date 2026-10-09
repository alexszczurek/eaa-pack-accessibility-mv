import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { validateScanUrl, ScanUrlError } from "@/lib/ssrf";
import { RULE_TO_KIT } from "@/lib/kit-map";
import { sendEmail } from "@/lib/email";
import { runScan, ScanFailure } from "@/lib/scanner";

export const runtime = "nodejs";
export const maxDuration = 60;

const INTERNAL_DEADLINE_MS = 50_000;
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
    `UPDATE scans SET status = 'running', started_at = now()
     WHERE id = (
       SELECT id FROM scans WHERE status = 'queued'
       ORDER BY created_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     RETURNING id, site_id, requested_by,
       (SELECT url FROM sites WHERE sites.id = scans.site_id) AS url`
  );
}

function normalizeImpact(impact: string | null): (typeof IMPACTS)[number] {
  return (IMPACTS as readonly string[]).includes(impact ?? "")
    ? (impact as (typeof IMPACTS)[number])
    : "minor";
}

async function maybeNotifyOwner(
  scan: ClaimedScan,
  summary: { critical: number; serious: number }
): Promise<void> {
  const owner = await queryOne<{ email: string; plan: string }>(
    `SELECT u.email, coalesce(sub.plan, 'free') AS plan
     FROM sites s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN subscriptions sub ON sub.user_id = u.id
     WHERE s.id = $1`,
    [scan.site_id]
  );
  if (!owner || owner.plan !== "monitor") return;

  const previous = await queryOne<{ summary: { critical: number; serious: number } }>(
    `SELECT summary FROM scans
     WHERE site_id = $1 AND status = 'done' AND id != $2
     ORDER BY finished_at DESC LIMIT 1`,
    [scan.site_id, scan.id]
  );
  if (!previous?.summary) return;

  const newCritical = summary.critical - (previous.summary.critical ?? 0);
  const newSerious = summary.serious - (previous.summary.serious ?? 0);
  if (newCritical <= 0 && newSerious <= 0) return;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4780").replace(/\/$/, "");
  const hostname = (() => {
    try {
      return new URL(scan.url).hostname;
    } catch {
      return scan.url;
    }
  })();

  await sendEmail({
    to: owner.email,
    subject: `New accessibility issues found on ${hostname}`,
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

async function processScan(scan: ClaimedScan): Promise<void> {
  console.log(`[scan-run] scan ${scan.id} -> ${scan.url}`);
  try {
    await validateScanUrl(scan.url);
    const result = await runScan(scan.url, { deadlineMs: INTERNAL_DEADLINE_MS });

    const counts: Record<string, number> = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const violation of result.violations) {
      const impact = normalizeImpact(violation.impact);
      const kitKey = RULE_TO_KIT[violation.id] ?? null;
      const nodes = violation.nodes.slice(0, MAX_NODES_PER_RULE);
      counts[impact] += nodes.length;
      for (const node of nodes) {
        await query(
          `INSERT INTO issues (scan_id, rule_id, impact, selector, html_snippet, help_url, kit_key)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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
      `UPDATE scans SET status = 'done', axe_raw = $2, summary = $3, scope_guess = $4, finished_at = now()
       WHERE id = $1`,
      [scan.id, JSON.stringify(result.axeRaw), JSON.stringify(summary), result.scopeGuess]
    );
    console.log(
      `[scan-run] scan ${scan.id} done: ${summary.total} issues (${summary.critical} critical, ${summary.serious} serious)`
    );

    await maybeNotifyOwner(scan, summary);
  } catch (err) {
    const message =
      err instanceof ScanFailure || err instanceof ScanUrlError
        ? err.message
        : "The scan failed unexpectedly. Try again in a few minutes.";
    if (!(err instanceof ScanFailure) && !(err instanceof ScanUrlError)) {
      console.error(`[scan-run] scan ${scan.id} unexpected error:`, err);
    }
    await query(`UPDATE scans SET status = 'failed', error = $2, finished_at = now() WHERE id = $1`, [
      scan.id,
      message,
    ]);
    console.log(`[scan-run] scan ${scan.id} failed: ${message}`);
  }
}

export async function POST(): Promise<NextResponse> {
  const scan = await claimScan();
  if (!scan) {
    return NextResponse.json({ ok: true, message: "No queued scans" });
  }
  await processScan(scan);
  return NextResponse.json({ ok: true, scanId: scan.id });
}
