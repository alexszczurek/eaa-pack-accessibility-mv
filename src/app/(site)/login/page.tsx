import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser, sendMagicLink } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Sign in — EAA Pack" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/app");
  const params = await searchParams;

  async function requestLink(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      redirect("/login?error=invalid");
    }
    await sendMagicLink(email);
    redirect("/login?sent=1");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center px-4">
      <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We email you a one-time link. No password.
      </p>

      {params.sent ? (
        <div className="mt-6 rounded-lg border bg-card p-4 text-sm">
          <p className="font-medium">Check your inbox</p>
          <p className="mt-1 text-muted-foreground">
            If email delivery is not configured on this install, the sign-in link is printed in
            the server console instead.
          </p>
        </div>
      ) : (
        <form action={requestLink} className="mt-6 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@company.com" />
          </div>
          {params.error && (
            <p className="text-sm text-destructive">Enter a valid email address.</p>
          )}
          <Button type="submit" className="w-full">
            Email me a sign-in link
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/scan" className="text-foreground underline underline-offset-4">
          Run a free scan first
        </Link>
        — no account needed.
      </p>
    </div>
  );
}
