/**
 * kit: statement-page
 * A printable page layout for publishing an accessibility statement.
 * Proper title/heading structure, lang attribute on the wrapper, readable
 * line length. Pass the statement content as children (rendered markdown
 * or plain JSX).
 *
 * Fixes axe rules: document-title, html-has-lang, page-has-heading-one
 */
import type { ReactNode } from "react";

interface StatementPageProps {
  siteName: string;
  /** BCP-47 language of the statement content, e.g. "pl" or "en". */
  lang: "pl" | "en";
  lastReviewDate?: string;
  contactEmail?: string;
  children: ReactNode;
  /** Shown as a banner on watermarked (free-plan) statements. */
  watermark?: string;
}

export function StatementPage({
  siteName,
  lang,
  lastReviewDate,
  contactEmail,
  children,
  watermark,
}: StatementPageProps) {
  const t =
    lang === "pl"
      ? { title: "Deklaracja dostępności", reviewed: "Ostatni przegląd", contact: "Kontakt" }
      : { title: "Accessibility statement", reviewed: "Last reviewed", contact: "Contact" };

  return (
    <div lang={lang} className="mx-auto max-w-2xl bg-white px-6 py-12 text-zinc-900">
      {watermark && (
        <p className="mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          {watermark}
        </p>
      )}
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.title} — {siteName}
        </h1>
        <dl className="mt-4 space-y-1 text-sm text-zinc-600">
          {lastReviewDate && (
            <div className="flex gap-2">
              <dt className="font-medium text-zinc-900">{t.reviewed}:</dt>
              <dd>{lastReviewDate}</dd>
            </div>
          )}
          {contactEmail && (
            <div className="flex gap-2">
              <dt className="font-medium text-zinc-900">{t.contact}:</dt>
              <dd>
                <a href={`mailto:${contactEmail}`} className="text-blue-700 underline underline-offset-4">
                  {contactEmail}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </header>
      <main className="prose-statement mt-8 space-y-4 text-[15px] leading-7 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-blue-700 [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </main>
    </div>
  );
}

/* Usage:
  <StatementPage siteName="Acme Store" lang="en" lastReviewDate="2026-08-01" contactEmail="access@acme.com">
    <div dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
  </StatementPage>
*/
