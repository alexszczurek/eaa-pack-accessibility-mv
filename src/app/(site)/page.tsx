import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <Badge variant="secondary" className="font-normal">
          For EU-facing shops and booking sites
        </Badge>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          See what breaks your checkout for disabled customers. Then fix it with real components.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
          Paste a URL. We scan that page in a real browser, explain each barrier in plain
          language, and hand you copy-paste React and HTML components that fix the common ones.
          Plus a draft accessibility statement in Polish and English that you edit and own.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/scan">Scan a page — free, no signup</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/pricing">Pricing</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          No overlay. No widget on your site. No score out of 100.
        </p>
      </section>

      {/* How it works */}
      <section className="border-t py-16">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          How it works
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StepCard
            step="1"
            title="Scan one page"
            body="We load your checkout or booking page at desktop size and run the axe-core engine — the same checks accessibility teams use."
          />
          <StepCard
            step="2"
            title="Read a human report"
            body="Each issue is a sentence a product manager understands, with the exact selector and HTML underneath for the developer."
          />
          <StepCard
            step="3"
            title="Fix with the kit"
            body="Issues link to a small kit of accessible components — text fields, dialogs, navigation — in React and plain HTML."
          />
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Built for consumer services</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The European Accessibility Act targets consumer-facing e-commerce and services —
              shops, ticketing, booking, banking. If people pay you through a browser, this is for
              you. If you run a personal blog, you probably do not need us.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Not sure?{" "}
              <Link href="/docs/scope" className="text-foreground underline underline-offset-4">
                Read our plain-language scope guide
              </Link>
              .
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">What we will not do</h2>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
              <li>· Inject an overlay or widget into your site.</li>
              <li>· Give you a meaningless score out of 100.</li>
              <li>· Stamp your site as safe. A report is a to-do list, not a verdict.</li>
            </ul>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              <Link href="/compare/overlays" className="text-foreground underline underline-offset-4">
                Why overlays are the wrong tool
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="border-t py-16">
        <div className="rounded-2xl border bg-card p-8 shadow-sm sm:p-10">
          <h2 className="text-lg font-semibold tracking-tight">
            Draft accessibility statement, PL + EN
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Answer a short form and get a markdown statement plus a printable page you can publish.
            Every draft says what it is: a starting point you edit and take responsibility for —
            not a declaration of conformity.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/statement/preview">Preview the statement generator</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function StepCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <span className="flex size-6 items-center justify-center rounded-md border bg-muted text-xs font-semibold text-muted-foreground">
        {step}
      </span>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
