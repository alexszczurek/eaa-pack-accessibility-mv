import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { isBillingConfigured } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; upgraded?: string }>;
}) {
  const user = (await getSessionUser())!;
  const params = await searchParams;
  const sub = await queryOne<{ status: string; current_period_end: string | null }>(
    `select status, current_period_end from subscriptions where user_id = $1`,
    [user.id]
  );
  const billingReady = isBillingConfigured();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      {params.upgraded && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Thanks — your subscription is being activated. It can take a few seconds for the webhook to
          arrive; refresh if the plan below still says free.
        </p>
      )}
      {params.billing === "unconfigured" && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Billing is not configured on this install (no Stripe keys). Everything else works — see the
          README for how to enable test-mode billing.
        </p>
      )}
      {params.billing === "nocustomer" && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          No billing profile yet — start an upgrade first.
        </p>
      )}

      <section aria-label="Account" className="mt-8 rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Account</h2>
        </div>
        <dl className="grid gap-y-3 px-5 py-4 text-sm sm:grid-cols-[140px_1fr]">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-muted-foreground">Plan</dt>
          <dd className="flex items-center gap-2">
            <Badge variant={user.plan === "monitor" ? "default" : "secondary"} className="font-normal capitalize">
              {user.plan}
            </Badge>
            {sub?.status && user.plan === "monitor" && (
              <span className="text-xs text-muted-foreground">({sub.status})</span>
            )}
          </dd>
          {sub?.current_period_end && user.plan === "monitor" && (
            <>
              <dt className="text-muted-foreground">Renews</dt>
              <dd>{new Date(sub.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd>
            </>
          )}
        </dl>
      </section>

      <section aria-label="Billing" className="mt-6 rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Billing</h2>
        </div>
        <div className="px-5 py-4">
          {user.plan === "monitor" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Manage your payment method, invoices, or cancel — cancellation takes effect at the end
                of the period.
              </p>
              <form action="/api/stripe/portal" method="POST" className="mt-3">
                <Button type="submit" variant="outline" size="sm">Open billing portal</Button>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Monitor — $49/mo: up to 10 URLs, weekly rescans, email when new critical or serious
                issues appear, the full component kit, and statements without the watermark. 7-day
                trial, cancel anytime.
              </p>
              <form action="/api/stripe/checkout" method="POST" className="mt-3">
                <Button type="submit" size="sm" disabled={!billingReady}>
                  {billingReady ? "Upgrade to Monitor" : "Billing not configured"}
                </Button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
