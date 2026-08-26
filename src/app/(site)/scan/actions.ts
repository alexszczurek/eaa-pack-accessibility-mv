"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { enqueueScan, RateLimitError } from "@/lib/scans";
import { ScanUrlError } from "@/lib/ssrf";

export async function startScan(formData: FormData): Promise<void> {
  const url = String(formData.get("url") || "");
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "0.0.0.0";
  const user = await getSessionUser();

  let scanId: string;
  try {
    scanId = await enqueueScan({
      url,
      ip,
      userId: user?.id ?? null,
      plan: user?.plan ?? "free",
    });
  } catch (err) {
    if (err instanceof ScanUrlError || err instanceof RateLimitError) {
      redirect(`/scan?error=${encodeURIComponent(err.message)}&url=${encodeURIComponent(url)}`);
    }
    throw err;
  }
  redirect(`/scan/${scanId}`);
}
