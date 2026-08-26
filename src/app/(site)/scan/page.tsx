import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startScan } from "./actions";

export const metadata: Metadata = { title: "Scan a page" };

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; url?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Scan one page</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Paste the URL of a checkout, product page or booking form. We load that single page in a
        real browser, run the axe-core engine against it, and give you a readable report you can
        share with your team.
      </p>

      <form action={startScan} className="mt-8 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="url">Page URL</Label>
          <Input
            id="url"
            name="url"
            type="url"
            required
            placeholder="https://yourshop.com/checkout"
            defaultValue={params.url ?? ""}
            className="h-11"
          />
        </div>
        {params.error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {params.error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full">
          Run scan
        </Button>
      </form>

      <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
        <li>· https pages only. We never log in and never store your visitors&apos; data.</li>
        <li>· One page per scan, 20 second budget, desktop viewport.</li>
        <li>· 5 anonymous scans per day. Sign in for 10 per month on the free plan.</li>
      </ul>

      <p className="mt-8 border-t pt-4 text-xs text-muted-foreground">
        A scan is an automated check of one page. It is not a conformity assessment and does not
        make a site legal.
      </p>
    </div>
  );
}
