"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Polls the scan status while queued/running and refreshes the page on change. */
export function ScanPoller({ scanId, status }: { scanId: string; status: string }) {
  const router = useRouter();
  const statusRef = useRef(status);

  useEffect(() => {
    if (status !== "queued" && status !== "running") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/scans/${scanId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: { status: string } = await res.json();
        if (data.status !== statusRef.current) {
          statusRef.current = data.status;
          router.refresh();
        }
      } catch {
        // transient network error; next tick retries
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [scanId, status, router]);

  return null;
}
