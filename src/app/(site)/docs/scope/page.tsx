import type { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import { renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = { title: "Who the EAA covers" };

export default async function ScopeDocsPage() {
  const md = await readFile(path.join(process.cwd(), "content/docs-scope.md"), "utf8");
  return (
    <article
      className="mx-auto w-full max-w-2xl px-4 py-14 text-[15px] leading-7 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_em]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(md) }}
    />
  );
}
