import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-7">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-[11px] font-bold text-background">
                EA
              </span>
              EAA Pack
            </Link>
            <div className="hidden items-center gap-5 text-sm text-muted-foreground sm:flex">
              <Link href="/scan" className="hover:text-foreground">Scan</Link>
              <Link href="/statement/preview" className="hover:text-foreground">Statement</Link>
              <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
              <Link href="/docs/scope" className="hover:text-foreground">Scope</Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/app">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/scan">Run a scan</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>EAA Pack — accessibility reports for EU-facing shops.</p>
          <div className="flex gap-4">
            <Link href="/docs/scope" className="hover:text-foreground">Who the EAA covers</Link>
            <Link href="/compare/overlays" className="hover:text-foreground">Why not an overlay</Link>
          </div>
        </div>
        <div className="border-t bg-muted/40">
          <p className="mx-auto w-full max-w-5xl px-4 py-3 text-xs text-muted-foreground">
            Reports and statements from EAA Pack are working drafts, not a conformity assessment. They
            do not make a site legal.
          </p>
        </div>
      </footer>
    </div>
  );
}
