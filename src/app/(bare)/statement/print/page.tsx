import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StatementPage } from "@/components/kit/statement-page";
import { generateStatementMarkdown, WATERMARK_TEXT } from "@/lib/statement";
import { renderMarkdown, stripH1 } from "@/lib/markdown";
import { queryOne } from "@/lib/db";

export const metadata: Metadata = { title: "Accessibility statement" };

export default async function StatementPrintPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const get = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);

  let markdown: string;
  let language: "pl" | "en";
  let siteName: string;
  let contactEmail: string | undefined;
  let lastReviewDate: string | undefined;
  let watermarked = true;

  const statementId = get("sid");
  if (statementId && /^[0-9a-f-]{36}$/i.test(statementId)) {
    // Saved statement from the app (watermark decided at save time).
    const row = await queryOne<{
      body_md: string;
      language: "pl" | "en";
      watermarked: boolean;
      site_name: string | null;
    }>(
      `select st.body_md, st.language, st.watermarked, s.name as site_name
       from statements st left join sites s on s.id = st.site_id
       where st.id = $1`,
      [statementId]
    );
    if (!row) notFound();
    markdown = row.body_md;
    language = row.language;
    watermarked = row.watermarked;
    siteName = row.site_name ?? "";
    const titleMatch = markdown.match(/^# .*— (.+)$/m);
    if (!siteName && titleMatch) siteName = titleMatch[1];
  } else {
    // Public preview: always watermarked, built from query params.
    siteName = get("siteName") ?? "";
    const siteUrl = get("siteUrl") ?? "";
    contactEmail = get("contactEmail");
    lastReviewDate = get("lastReviewDate");
    language = get("language") === "pl" ? "pl" : "en";
    if (!siteName || !siteUrl || !contactEmail || !lastReviewDate) notFound();
    const practicesRaw = params.practices;
    markdown = generateStatementMarkdown({
      siteName,
      siteUrl,
      contactEmail,
      lastReviewDate,
      language,
      practices: Array.isArray(practicesRaw) ? practicesRaw : practicesRaw ? [practicesRaw] : [],
      knownLimits: get("knownLimits") ?? "",
      watermarked: true,
    });
  }

  const bodyHtml = renderMarkdown(stripH1(markdown));

  return (
    <StatementPage
      siteName={siteName}
      lang={language}
      lastReviewDate={lastReviewDate}
      contactEmail={contactEmail}
      watermark={watermarked ? WATERMARK_TEXT[language] : undefined}
    >
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </StatementPage>
  );
}
