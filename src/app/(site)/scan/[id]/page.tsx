import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getScanWithIssues, type ScanSummary } from "@/lib/scans";
import { humanSentence } from "@/lib/kit-map";
import { ScanPoller } from "@/components/scan-poller";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Scan report" };

const IMPACT_ORDER = ["critical", "serious", "moderate", "minor"] as const;

const IMPACT_STYLE: Record<string, { dot: string; label: string }> = {
  critical: { dot: "bg-red-500", label: "Critical" },
  serious: { dot: "bg-amber-500", label: "Serious" },
  moderate: { dot: "bg-blue-400", label: "Moderate" },
  minor: { dot: "bg-zinc-400", label: "Minor" },
};

export default async function ScanReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getScanWithIssues(id);
  if (!data) notFound();
  const { scan, issues } = data;
  const summary = (scan.summary ?? null) as ScanSummary | null;
  const hostname = safeHostname(scan.url);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <ScanPoller scanId={scan.id} status={scan.status} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/scan" className="hover:text-foreground">Scans</Link>
        <span aria-hidden>/</span>
        <span className="font-mono text-xs">{scan.id.slice(0, 8)}</span>
      </nav>

      {/* Header */}
      <div className="mt-6 flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card shadow-sm">
          <GlobeIcon />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            {summary?.pageTitle || hostname}
          </h1>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{scan.url}</p>
        </div>
      </div>

      {/* Property rows */}
      <dl className="mt-8 grid gap-y-3 text-sm sm:grid-cols-[140px_1fr]">
        <dt className="text-muted-foreground">Status</dt>
        <dd><StatusBadge status={scan.status} /></dd>
        <dt className="text-muted-foreground">Scanned</dt>
        <dd>{formatDate(scan.finished_at ?? scan.created_at)}</dd>
        {summary && (
          <>
            <dt className="text-muted-foreground">Issues</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <CountChip dot="bg-red-500" label="Critical" count={summary.critical} />
              <CountChip dot="bg-amber-500" label="Serious" count={summary.serious} />
              <CountChip dot="bg-zinc-400" label="Other" count={summary.moderate + summary.minor} />
            </dd>
          </>
        )}
        {scan.status === "done" && (
          <>
            <dt className="text-muted-foreground">Scope guess</dt>
            <dd>
              <Badge variant="secondary" className="font-normal">
                {scan.scope_guess === "ecommerce" ? "Looks like a shop or booking flow" : "Could not tell"}
              </Badge>
            </dd>
          </>
        )}
      </dl>

      {scan.status === "done" && (
        <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
          {scan.scope_guess === "ecommerce"
            ? "This page has shop or booking signals, the kind of consumer service the European Accessibility Act is aimed at."
            : "We could not tell from one page whether this is a consumer shop or booking service."}{" "}
          This guess is a heuristic, not an assessment —{" "}
          <Link href="/docs/scope" className="text-foreground underline underline-offset-4">
            read who the EAA covers
          </Link>
          .
        </p>
      )}

      {/* States */}
      {(scan.status === "queued" || scan.status === "running") && (
        <div className="mt-10 rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          <p className="mt-4 text-sm font-medium">
            {scan.status === "queued" ? "Waiting for a worker…" : "Loading the page and running checks…"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Usually 10–30 seconds. This page refreshes itself.
          </p>
        </div>
      )}

      {scan.status === "failed" && (
        <div className="mt-10 rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm font-semibold text-destructive">Scan failed</p>
          <p className="mt-1 text-sm leading-6">{scan.error}</p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href={`/scan?url=${encodeURIComponent(scan.url)}`}>Try again</Link>
          </Button>
        </div>
      )}

      {scan.status === "done" && (
        <div className="mt-10 space-y-10">
          {issues.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
              <p className="text-sm font-medium">The automated checks found no issues on this page.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Automated checks catch a fraction of real barriers — manual review still matters.
              </p>
            </div>
          ) : (
            IMPACT_ORDER.map((impact) => {
              const group = issues.filter((issue) => issue.impact === impact);
              if (group.length === 0) return null;
              const style = IMPACT_STYLE[impact];
              return (
                <section key={impact} aria-label={`${style.label} issues`}>
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${style.dot}`} aria-hidden />
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {style.label}
                    </h2>
                    <span className="rounded-md border bg-muted px-1.5 text-xs text-muted-foreground">
                      {group.length}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-3">
                    {group.map((issue) => (
                      <li key={issue.id} className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="min-w-0 flex-1 text-sm leading-6">
                            {humanSentence(issue.rule_id, `Fails the ${issue.rule_id} check.`)}
                          </p>
                          {issue.kit_key && (
                            <Button asChild size="sm" variant="outline" className="shrink-0">
                              <Link href={`/app/kit#${issue.kit_key}`}>Use component</Link>
                            </Button>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{issue.rule_id}</code>
                          {issue.help_url && (
                            <a
                              href={issue.help_url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-4 hover:text-foreground"
                            >
                              rule reference
                            </a>
                          )}
                        </div>
                        {(issue.selector || issue.html_snippet) && (
                          <details className="group mt-3">
                            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                              Where on the page
                            </summary>
                            <div className="mt-2 overflow-hidden rounded-lg border">
                              {issue.selector && (
                                <div className="border-b bg-muted/50 px-3 py-1.5 font-mono text-xs text-muted-foreground">
                                  {issue.selector}
                                </div>
                              )}
                              {issue.html_snippet && (
                                <pre className="overflow-x-auto bg-card px-3 py-2 font-mono text-xs leading-5">
                                  {issue.html_snippet}
                                </pre>
                              )}
                            </div>
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}

          <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            Want this page rechecked every week, with the component kit and an editable statement?{" "}
            <Link href="/pricing" className="text-foreground underline underline-offset-4">
              See plans
            </Link>
            . Anyone with this link can view this report.
          </div>
        </div>
      )}

      <p className="mt-12 border-t pt-4 text-xs text-muted-foreground">
        This is not a conformity assessment. It does not make the site legal.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    queued: "bg-zinc-100 text-zinc-700",
    running: "bg-blue-50 text-blue-700",
    done: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${map[status] ?? ""}`}>
      {status === "done" ? "Complete" : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function CountChip({ dot, label, count }: { dot: string; label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-0.5 text-xs">
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden />
      <span className="font-medium">{count}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function GlobeIcon() {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.75 10h14.5M10 2.75c-4.5 4.5-4.5 10 0 14.5M10 2.75c4.5 4.5 4.5 10 0 14.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
