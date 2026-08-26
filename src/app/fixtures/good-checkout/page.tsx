import type { Metadata } from "next";
import { SkipLink } from "@/components/kit/skip-link";
import { SiteNav } from "@/components/kit/nav";
import { TextField } from "@/components/kit/text-field";
import { Checkbox, Radio } from "@/components/kit/checkbox-radio";
import { AccessibleButton } from "@/components/kit/focus-ring";
import { contrastClasses } from "@/components/kit/contrast-tokens";

export const metadata: Metadata = { title: "Checkout — Nordkette Outdoor (fixture: good)" };

/**
 * Acceptance fixture: the same checkout rebuilt from the EAA Pack kit.
 * A scan of this page must report ZERO critical issues.
 */
export default function GoodCheckoutFixture() {
  return (
    <div className={`min-h-screen ${contrastClasses.body}`}>
      <SkipLink />
      <SiteNav
        brand="Nordkette Outdoor"
        items={[
          { href: "#", label: "Jackets" },
          { href: "#", label: "Footwear" },
          { href: "#", label: "Support" },
        ]}
        actions={
          <a
            href="#"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Cart (1)
          </a>
        }
      />

      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-xl font-semibold">Checkout</h1>
        <p className={`mt-1 text-sm ${contrastClasses.muted}`}>
          Free shipping on orders over 60 € · 30-day returns · Secure payment
        </p>

        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_280px]">
          <form className="space-y-5">
            <TextField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              hint="We only use this for your receipt."
            />
            <TextField id="name" label="Full name" type="text" autoComplete="name" />
            <div className="grid grid-cols-2 gap-4">
              <TextField id="card" label="Card number" type="text" inputMode="numeric" autoComplete="cc-number" />
              <TextField id="expiry" label="Expiry and CVC" type="text" inputMode="numeric" />
            </div>

            <fieldset className="space-y-2 border-0 p-0">
              <legend className="pb-1 text-sm font-medium">Shipping speed</legend>
              <Radio id="ship-std" name="shipping" value="standard" defaultChecked label="Standard — free" />
              <Radio id="ship-exp" name="shipping" value="express" label="Express — 9,99 €" />
            </fieldset>

            <Checkbox
              id="updates"
              name="updates"
              label="Email me order updates"
              hint="A shipping confirmation and a delivery notice. Nothing else."
            />

            <AccessibleButton type="submit" className="w-full">
              Pay 128,00 €
            </AccessibleButton>
          </form>

          <aside aria-label="Order summary" className="space-y-4">
            <div className="rounded-xl border border-zinc-200 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='140'%3E%3Crect width='240' height='140' fill='%23e4e4e7'/%3E%3C/svg%3E"
                alt="Alpine Shell Jacket in moss green, front view"
                width={240}
                height={140}
                className="w-full rounded-lg"
              />
              <p className="mt-3 text-sm font-medium">Alpine Shell Jacket</p>
              <p className={`text-sm ${contrastClasses.muted}`}>Size M · Moss green</p>
              <p className="mt-2 text-sm font-semibold">128,00 €</p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-6">
        <p className={`mx-auto max-w-3xl px-6 text-sm ${contrastClasses.muted}`}>
          Nordkette Outdoor GmbH · Innsbruck
        </p>
      </footer>
    </div>
  );
}
