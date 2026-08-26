import { NextResponse } from "next/server";
import { getSessionUser, appUrl } from "@/lib/auth";
import { getStripe, isBillingConfigured } from "@/lib/stripe";
import { queryOne, query } from "@/lib/db";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(`${appUrl()}/login`, { status: 303 });
  if (!isBillingConfigured()) {
    return NextResponse.redirect(`${appUrl()}/app/settings?billing=unconfigured`, { status: 303 });
  }

  const stripe = getStripe();
  const sub = await queryOne<{ stripe_customer_id: string | null }>(
    `select stripe_customer_id from subscriptions where user_id = $1`,
    [user.id]
  );

  let customerId = sub?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { eaa_user_id: user.id },
    });
    customerId = customer.id;
    await query(
      `insert into subscriptions (user_id, stripe_customer_id) values ($1, $2)
       on conflict (user_id) do update set stripe_customer_id = excluded.stripe_customer_id, updated_at = now()`,
      [user.id, customerId]
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_MONITOR_PRICE_ID!, quantity: 1 }],
    subscription_data: { trial_period_days: 7, metadata: { eaa_user_id: user.id } },
    success_url: `${appUrl()}/app/settings?upgraded=1`,
    cancel_url: `${appUrl()}/pricing`,
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
