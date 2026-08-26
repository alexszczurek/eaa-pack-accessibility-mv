import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { enqueueScan, RateLimitError, type ScanSummary } from "@/lib/scans";
import { ScanUrlError } from "@/lib/ssrf";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Site" };

export default async function SiteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = (await getSessionUser())!;
  const { id } = await params;
  const { error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const site = await queryOne<{ id: string; url: string; name: string | null; created_at: string }>(
    `select id, url, name, created_at from sites where id = $1 and user_id = $2`,
    [id, user.id]
  );
  if (!site) notFound();

  const scans = await query<{
    id: string;
    status: string;
    summary: ScanSummary | null;
    created_at: string;
    finished_at: string | null;
    error: string | null;
  }>(
    `select id, status, summary, created_at, finished_at, error
     from scans where site_id = $1 order by created_at desc limit 30`,
    [id]
  );

  async function rescan() {
    "use server";
    const currentUser = await getSessionUser();
    if (!currentUser) redirect("/login");
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
    try {
      const scanId = await enqueueScan({
        url: site!.url,
        ip,
        userId: currentUser.id,
        plan: currentUser.plan,
        siteId: site!.id,
      });
      redirect(`/scan/${scanId}`);
    } catch (err) {
      if (err instanceof ScanUrlError || err instanceof RateLimitError) {
        redirect(`/app/sites/${site!.id}?error=${encodeURIComponent(err.message)}`);
      }
      throw err;
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app" className="hover:text-foreground">Sites</Link>
        <span aria-hidden>/</span>
        <span className="truncate">{site.name || site.url}</span>
      </nav>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{site.name || site.url}</h1>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{site.url}</p>
        </div>
        <div className="flex gap-2">
          <form action={rescan}>
            <Button type="submit" variant="outline" size="sm">Rescan now</Button>
          </form>
          <Button asChild size="sm">
            <Link href={`/app/sites/${site.id}/statement`}>Statement</Link>
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Scan history
      </h2>
      {scans.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No scans yet. Run the first one above.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {scans.map((scan) => (
            <li key={scan.id}>
              <Link
                href={`/scan/${scan.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-sm transition-colors hover:bg-accent"
              >
                <span className="text-muted-foreground">
                  {new Date(scan.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {scan.status === "done" && scan.summary ? (
                  <span className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-0.5">
                      <span className="size-1.5 rounded-full bg-red-500" aria-hidden />
                      <span className="font-medium">{scan.summary.critical}</span> critical
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-0.5">
                      <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
                      <span className="font-medium">{scan.summary.serious}</span> serious
                    </span>
                    <span className="text-muted-foreground">{scan.summary.total} total</span>
                  </span>
                ) : (
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      scan.status === "failed" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {scan.status}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
