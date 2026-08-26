import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { generateStatementMarkdown } from "@/lib/statement";
import { renderMarkdown } from "@/lib/markdown";
import { StatementForm, type StatementFormValues } from "@/components/statement-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Statement" };

export default async function SiteStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = (await getSessionUser())!;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const site = await queryOne<{ id: string; url: string; name: string | null }>(
    `select id, url, name from sites where id = $1 and user_id = $2`,
    [id, user.id]
  );
  if (!site) notFound();

  const sp = await searchParams;
  const get = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);
  const practicesRaw = sp.practices;
  const values: StatementFormValues = {
    siteName: get("siteName") ?? site.name ?? undefined,
    siteUrl: get("siteUrl") ?? site.url,
    contactEmail: get("contactEmail") ?? user.email,
    lastReviewDate: get("lastReviewDate"),
    language: get("language"),
    practices: Array.isArray(practicesRaw) ? practicesRaw : practicesRaw ? [practicesRaw] : [],
    knownLimits: get("knownLimits"),
  };
  const complete = Boolean(values.siteName && values.siteUrl && values.contactEmail && values.lastReviewDate);
  const watermarked = user.plan !== "monitor";

  const markdown = complete
    ? generateStatementMarkdown({
        siteName: values.siteName!,
        siteUrl: values.siteUrl!,
        contactEmail: values.contactEmail!,
        lastReviewDate: values.lastReviewDate!,
        language: values.language === "pl" ? "pl" : "en",
        practices: values.practices ?? [],
        knownLimits: values.knownLimits ?? "",
        watermarked,
      })
    : null;

  async function saveStatement(formData: FormData) {
    "use server";
    const currentUser = await getSessionUser();
    if (!currentUser) redirect("/login");
    const body = String(formData.get("body_md") || "");
    const language = formData.get("language") === "pl" ? "pl" : "en";
    if (!body) return;
    const row = await queryOne<{ id: string }>(
      `insert into statements (user_id, site_id, language, body_md, watermarked)
       values ($1, $2, $3, $4, $5) returning id`,
      [currentUser.id, site!.id, language, body, currentUser.plan !== "monitor"]
    );
    redirect(`/app/sites/${site!.id}/statement?saved=${row!.id}`);
  }

  const saved = await query<{ id: string; language: string; watermarked: boolean; created_at: string }>(
    `select id, language, watermarked, created_at from statements
     where site_id = $1 order by created_at desc limit 10`,
    [id]
  );
  const savedId = get("saved");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app" className="hover:text-foreground">Sites</Link>
        <span aria-hidden>/</span>
        <Link href={`/app/sites/${site.id}`} className="truncate hover:text-foreground">
          {site.name || site.url}
        </Link>
        <span aria-hidden>/</span>
        <span>Statement</span>
      </nav>

      <h1 className="mt-6 text-xl font-semibold tracking-tight">Accessibility statement</h1>
      <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">
        Generate a draft in Polish or English, edit the markdown, and publish it on your site with
        the statement-page component from the kit.
        {watermarked && " Drafts on the free plan carry a watermark line — Monitor removes it."}
      </p>

      {savedId && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Statement saved.{" "}
          <Link href={`/statement/print?sid=${savedId}`} target="_blank" className="underline underline-offset-4">
            Open the printable page
          </Link>
          .
        </p>
      )}

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <StatementForm values={values} submitLabel="Generate draft" />
      </div>

      {markdown && (
        <section className="mt-10" aria-label="Generated draft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Your draft</h2>
            <form action={saveStatement} className="flex gap-2">
              <input type="hidden" name="body_md" value={markdown} />
              <input type="hidden" name="language" value={values.language === "pl" ? "pl" : "en"} />
              <Button type="submit" size="sm">Save statement</Button>
            </form>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border shadow-sm">
            <div className="border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">Preview</div>
            <div
              className="max-w-none bg-card px-6 py-5 text-sm leading-6 [&_blockquote]:border-l-2 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50 [&_blockquote]:px-3 [&_blockquote]:py-2 [&_blockquote]:text-amber-900 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_a]:underline [&_a]:underline-offset-4 [&_p]:mt-2"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border shadow-sm">
            <div className="border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
              Markdown — copy and edit
            </div>
            <pre className="max-h-96 overflow-auto bg-card px-4 py-3 font-mono text-xs leading-5">{markdown}</pre>
          </div>
        </section>
      )}

      {saved.length > 0 && (
        <section className="mt-10" aria-label="Saved statements">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saved</h2>
          <ul className="mt-3 space-y-2">
            {saved.map((statement) => (
              <li key={statement.id}>
                <Link
                  href={`/statement/print?sid=${statement.id}`}
                  target="_blank"
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm shadow-sm hover:bg-accent"
                >
                  <span className="text-muted-foreground">
                    {new Date(statement.created_at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-normal uppercase">{statement.language}</Badge>
                    {statement.watermarked && (
                      <Badge variant="outline" className="font-normal">watermarked</Badge>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
