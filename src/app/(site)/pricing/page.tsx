import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const user = await getSessionUser();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Pricing</h1>
      <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
        Start free without a card. Upgrade when you want the page watched every week. Cancel
        anytime from the billing portal.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {/* Free */}
        <div className="flex flex-col rounded-2xl border bg-card p-7 shadow-sm">
          <h2 className="text-sm font-semibold">Free</h2>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            $0<span className="text-sm font-normal text-muted-foreground"> / forever</span>
          </p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm leading-6 text-muted-foreground">
            <Item>1 URL in your dashboard</Item>
            <Item>Full readable report, shareable by link</Item>
            <Item>10 scans per month (5/day without an account)</Item>
            <Item>Draft statement in PL + EN, with a watermark line</Item>
          </ul>
          <Button asChild variant="outline" className="mt-6">
            <Link href={user ? "/app" : "/scan"}>{user ? "Go to dashboard" : "Start with a scan"}</Link>
          </Button>
        </div>

        {/* Monitor */}
        <div className="relative flex flex-col rounded-2xl border-2 border-foreground/80 bg-card p-7 shadow-sm">
          <span className="absolute -top-2.5 left-6 rounded-md bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
            7-day trial
          </span>
          <h2 className="text-sm font-semibold">Monitor</h2>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            $49<span className="text-sm font-normal text-muted-foreground"> / month</span>
          </p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm leading-6 text-muted-foreground">
            <Item>Up to 10 URLs</Item>
            <Item>Automatic weekly rescans</Item>
            <Item>Email when new critical or serious issues appear</Item>
            <Item>Full component kit — React + plain HTML source</Item>
            <Item>Statements without the watermark</Item>
            <Item>Cancel anytime</Item>
          </ul>
          {user ? (
            <form action="/api/stripe/checkout" method="POST" className="mt-6">
              <Button type="submit" className="w-full">Start 7-day trial</Button>
            </form>
          ) : (
            <Button asChild className="mt-6">
              <Link href="/login">Sign in to start the trial</Link>
            </Button>
          )}
        </div>
      </div>

      <p className="mt-10 max-w-prose text-xs leading-5 text-muted-foreground">
        A subscription buys monitoring and tooling. It is not a legal service, and no plan makes a
        site legally conformant — that depends on the work you do with the findings.
      </p>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-1 shrink-0 text-foreground">
        <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </li>
  );
}
