import type { Metadata } from "next";
import Link from "next/link";
import { StatementForm, type StatementFormValues } from "@/components/statement-form";
import { generateStatementMarkdown } from "@/lib/statement";
import { renderMarkdown } from "@/lib/markdown";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Statement generator" };

function parseValues(params: Record<string, string | string[] | undefined>): StatementFormValues {
  const get = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const practices = params.practices;
  return {
    siteName: get("siteName"),
    siteUrl: get("siteUrl"),
    contactEmail: get("contactEmail"),
    lastReviewDate: get("lastReviewDate"),
    language: get("language"),
    practices: Array.isArray(practices) ? practices : practices ? [practices] : [],
    knownLimits: get("knownLimits"),
  };
}

export default async function StatementPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const values = parseValues(params);
  const complete = Boolean(values.siteName && values.siteUrl && values.contactEmail && values.lastReviewDate);

  const markdown = complete
    ? generateStatementMarkdown({
        siteName: values.siteName!,
        siteUrl: values.siteUrl!,
        contactEmail: values.contactEmail!,
        lastReviewDate: values.lastReviewDate!,
        language: values.language === "pl" ? "pl" : "en",
        practices: values.practices ?? [],
        knownLimits: values.knownLimits ?? "",
        watermarked: true, // the public preview is always watermarked
      })
    : null;

  const printQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((v) => printQuery.append(key, v));
    else if (value) printQuery.set(key, value);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Draft an accessibility statement</h1>
      <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
        Fill in the form and get a statement in markdown plus a printable page. It is a draft you
        edit and publish under your own name — not a declaration of conformity, and we are not
        your lawyer. Signed-in Monitor subscribers get the same generator without the watermark.
      </p>

      <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
        <StatementForm values={values} />
      </div>

      {markdown && (
        <section className="mt-10" aria-label="Generated draft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Your draft</h2>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/statement/print?${printQuery.toString()}`} target="_blank">
                  Open printable page
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border shadow-sm">
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground">Preview</span>
            </div>
            <div
              className="prose-sm max-w-none bg-card px-6 py-5 text-sm leading-6 [&_blockquote]:border-l-2 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50 [&_blockquote]:px-3 [&_blockquote]:py-2 [&_blockquote]:text-amber-900 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_a]:underline [&_a]:underline-offset-4 [&_p]:mt-2"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border shadow-sm">
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
              <span className="text-xs font-medium text-muted-foreground">Markdown — copy and edit</span>
            </div>
            <pre className="max-h-96 overflow-auto bg-card px-4 py-3 font-mono text-xs leading-5">{markdown}</pre>
          </div>
        </section>
      )}
    </div>
  );
}
