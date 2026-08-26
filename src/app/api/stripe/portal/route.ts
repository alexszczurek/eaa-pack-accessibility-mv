import { NextResponse } from "next/server";
import { getSessionUser, appUrl } from "@/lib/auth";
import { getStripe, isBillingConfigured } from "@/lib/stripe";
import { queryOne } from "@/lib/db";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(`${appUrl()}/login`, { status: 303 });
  if (!isBillingConfigured()) {
    return NextResponse.redirect(`${appUrl()}/app/settings?billing=unconfigured`, { status: 303 });
  }
  const sub = await queryOne<{ stripe_customer_id: string | null }>(
    `select stripe_customer_id from subscriptions where user_id = $1`,
    [user.id]
  );
  if (!sub?.stripe_customer_id) {
    return NextResponse.redirect(`${appUrl()}/app/settings?billing=nocustomer`, { status: 303 });
  }
  const session = await getStripe().billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appUrl()}/app/settings`,
  });
  return NextResponse.redirect(session.url, { status: 303 });
}
