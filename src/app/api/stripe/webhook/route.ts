import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { query, queryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "billing not configured" }, { status: 501 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const row = await queryOne<{ user_id: string }>(
        `select user_id from subscriptions where stripe_customer_id = $1`,
        [customerId]
      );
      if (!row) break;
      const active = ["active", "trialing"].includes(subscription.status);
      const periodEnd = subscription.items.data[0]?.current_period_end;
      await query(
        `update subscriptions
         set stripe_subscription_id = $2,
             plan = $3,
             status = $4,
             current_period_end = $5,
             updated_at = now()
         where user_id = $1`,
        [
          row.user_id,
          subscription.id,
          active ? "monitor" : "free",
          subscription.status,
          periodEnd ? new Date(periodEnd * 1000) : null,
        ]
      );
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
