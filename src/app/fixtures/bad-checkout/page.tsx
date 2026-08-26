import type { Metadata } from "next";

export const metadata: Metadata = { title: "Checkout — Nordkette Outdoor (fixture: bad)" };

/**
 * Acceptance fixture: a checkout page with deliberate accessibility failures.
 * A scan of this page must flag at least:
 *  - a form field with no label        (axe: label, critical)
 *  - a text contrast failure           (axe: color-contrast, serious)
 *  - a button with no accessible name  (axe: button-name, critical)
 * Do not "fix" this page. Its twin is /fixtures/good-checkout.
 */
export default function BadCheckoutFixture() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header that is not a landmark, nav links without text */}
      <div className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold">Nordkette Outdoor</span>
          <div className="flex items-center gap-3">
            {/* Icon-only button with NO accessible name (button-name) */}
            <button type="button" className="rounded-lg border border-zinc-300 p-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 3h2l1.6 8h6.8L14 5H5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="6.5" cy="13" r="1" fill="currentColor" />
                <circle cx="11.5" cy="13" r="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-xl font-semibold">Checkout</h1>
        {/* Contrast failure: light gray on white, ~2.3:1 (color-contrast) */}
        <p className="mt-1 text-sm" style={{ color: "#b8b8b8" }}>
          Free shipping on orders over 60 € · 30-day returns · Secure payment
        </p>

        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_280px]">
          <form className="space-y-5">
            <div>
              {/* Label not associated with the input (label) */}
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                className="mt-1.5 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
              />
            </div>
            <div>
              {/* Input with no label at all, placeholder only (label) */}
              <input
                type="text"
                placeholder="Full name"
                className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Card number"
                className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
              />
              <input
                type="text"
                placeholder="MM/YY CVC"
                className="h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
              />
            </div>

            {/* Tiny click target, label not clickable */}
            <div className="flex items-center gap-2">
              <input type="checkbox" style={{ width: 12, height: 12 }} />
              <span className="text-sm" style={{ color: "#c0c0c0" }}>
                Keep me posted about seasonal offers
              </span>
            </div>

            <button
              type="submit"
              className="h-10 w-full rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "#18181b" }}
            >
              Pay 128,00 €
            </button>
          </form>

          <aside className="space-y-4">
            <div className="rounded-xl border border-zinc-200 p-4">
              {/* Image without alt text (image-alt) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='140'%3E%3Crect width='240' height='140' fill='%23e4e4e7'/%3E%3C/svg%3E"
                width={240}
                height={140}
                className="w-full rounded-lg"
              />
              <p className="mt-3 text-sm font-medium">Alpine Shell Jacket</p>
              <p className="text-sm" style={{ color: "#bdbdbd" }}>
                Size M · Moss green
              </p>
              <p className="mt-2 text-sm font-semibold">128,00 €</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
