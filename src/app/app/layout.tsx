import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-7">
            <Link href="/app" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-[11px] font-bold text-background">
                EA
              </span>
              EAA Pack
            </Link>
            <nav aria-label="App" className="flex items-center gap-5 text-sm text-muted-foreground">
              <Link href="/app" className="hover:text-foreground">Sites</Link>
              <Link href="/app/kit" className="hover:text-foreground">Kit</Link>
              <Link href="/app/settings" className="hover:text-foreground">Settings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={user.plan === "monitor" ? "default" : "secondary"} className="font-normal capitalize">
              {user.plan}
            </Badge>
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            <form action="/auth/logout" method="POST">
              <Button type="submit" variant="ghost" size="sm">Sign out</Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-muted/40">
        <p className="mx-auto w-full max-w-5xl px-4 py-3 text-xs text-muted-foreground">
          Reports and statements are working drafts, not a conformity assessment. They do not make a
          site legal.
        </p>
      </footer>
    </div>
  );
}
