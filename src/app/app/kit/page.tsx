import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "fs/promises";
import path from "path";
import { getSessionUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";

export const metadata: Metadata = { title: "Component kit" };

interface KitItem extends Record<string, unknown> {
  key: string;
  title: string;
  issue_rule_ids: string[];
  source: string;
  description: string;
}

export default async function KitPage() {
  const user = (await getSessionUser())!;
  const isMonitor = user.plan === "monitor";
  const items = await query<KitItem>(
    `select key, title, issue_rule_ids, source, description from kit_items order by key`
  );

  const withSource = await Promise.all(
    items.map(async (item) => {
      const reactSource = await readFile(path.join(process.cwd(), item.source), "utf8").catch(() => "");
      const htmlSource = await readFile(
        path.join(process.cwd(), "src/components/kit/html", `${item.key}.html`),
        "utf8"
      ).catch(() => "");
      return { ...item, reactSource, htmlSource };
    })
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-xl font-semibold tracking-tight">Component kit</h1>
      <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">
        Eight accessible building blocks in React + Tailwind, each with a plain-HTML twin. No
        framework-specific imports — paste them into any project. Scan reports link straight to the
        component that fixes the issue.
      </p>

      {!isMonitor && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 p-4 text-sm">
          <p className="text-muted-foreground">
            Full source code is part of the Monitor plan. You can browse what each component does
            below.
          </p>
          <Button asChild size="sm">
            <Link href="/pricing">See plans</Link>
          </Button>
        </div>
      )}

      <div className="mt-8 space-y-6">
        {withSource.map((item) => (
          <section
            key={item.key}
            id={item.key}
            aria-label={item.title}
            className="scroll-mt-20 overflow-hidden rounded-xl border bg-card shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2 border-b px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold">{item.title}</h2>
                <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {item.key}
              </code>
            </div>
            <div className="flex flex-wrap gap-1.5 border-b bg-muted/30 px-5 py-2.5">
              <span className="text-xs text-muted-foreground">Fixes:</span>
              {item.issue_rule_ids.map((rule) => (
                <Badge key={rule} variant="outline" className="font-mono text-[11px] font-normal">
                  {rule}
                </Badge>
              ))}
            </div>
            {isMonitor ? (
              <div>
                <CodeBlock label={`React — ${item.source.split("/").pop()}`} code={item.reactSource} />
                <CodeBlock label={`Plain HTML — ${item.key}.html`} code={item.htmlSource} />
              </div>
            ) : (
              <div className="px-5 py-4">
                <pre className="max-h-24 overflow-hidden rounded-lg border bg-muted/40 px-4 py-3 font-mono text-xs leading-5 text-muted-foreground [mask-image:linear-gradient(to_bottom,black_30%,transparent)]">
                  {item.reactSource.split("\n").slice(0, 6).join("\n")}
                </pre>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="border-b last:border-b-0">
      <div className="flex items-center justify-between bg-muted/50 px-5 py-2">
        <span className="font-mono text-xs text-muted-foreground">{label}</span>
        <CopyButton text={code} />
      </div>
      <pre className="max-h-96 overflow-auto px-5 py-4 font-mono text-xs leading-5">{code}</pre>
    </div>
  );
}
