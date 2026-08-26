import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { startScan } from "@/app/(site)/scan/actions";
import { FREE_SITE_LIMIT, MONITOR_SITE_LIMIT, type ScanSummary } from "@/lib/scans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Sites" };

interface SiteRow extends Record<string, unknown> {
  id: string;
  url: string;
  name: string | null;
  last_scan_id: string | null;
  last_status: string | null;
  last_finished_at: string | null;
  last_summary: ScanSummary | null;
}

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = (await getSessionUser())!;
  const params = await searchParams;
  const sites = await query<SiteRow>(
    `select s.id, s.url, s.name,
            ls.id as last_scan_id, ls.status as last_status,
            ls.finished_at as last_finished_at, ls.summary as last_summary
     from sites s
     left join lateral (
       select id, status, finished_at, summary from scans
       where site_id = s.id order by created_at desc limit 1
     ) ls on true
     where s.user_id = $1
     order by s.created_at desc`,
    [user.id]
  );
  const siteLimit = user.plan === "monitor" ? MONITOR_SITE_LIMIT : FREE_SITE_LIMIT;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sites</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sites.length} of {siteLimit} URLs on the {user.plan === "monitor" ? "Monitor" : "free"} plan
            {user.plan === "monitor" && " · rescanned weekly"}
          </p>
        </div>
        <form action={startScan} className="flex w-full max-w-md gap-2">
          <label htmlFor="new-url" className="sr-only">Page URL to add and scan</label>
          <Input id="new-url" name="url" type="url" required placeholder="https://yourshop.com/checkout" />
          <Button type="submit" className="shrink-0">Add &amp; scan</Button>
        </form>
      </div>
      {params.error && (
        <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {params.error}
        </p>
      )}

      {sites.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed bg-card p-10 text-center">
          <p className="text-sm font-medium">No sites yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Add the URL of your checkout, product page or booking form above. We scan it and keep the
            history here.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {sites.map((site) => (
            <li key={site.id}>
              <Link
                href={`/app/sites/${site.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{site.name || site.url}</p>
                  <p className="truncate text-sm text-muted-foreground">{site.url}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {site.last_summary ? (
                    <>
                      <Chip dot="bg-red-500" value={site.last_summary.critical} label="critical" />
                      <Chip dot="bg-amber-500" value={site.last_summary.serious} label="serious" />
                      <span className="text-muted-foreground">
                        {site.last_finished_at &&
                          new Date(site.last_finished_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                      </span>
                    </>
                  ) : site.last_status ? (
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                      {site.last_status === "failed" ? "last scan failed" : "scan in progress"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">never scanned</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip({ dot, value, label }: { dot: string; value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-0.5">
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden />
      <span className="font-medium">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
