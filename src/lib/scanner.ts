import "server-only";
import { chromium as playwrightCore, type Browser, type BrowserContext } from "playwright-core";
import { AxeBuilder } from "@axe-core/playwright";

export interface AxeNodeResult {
  target: string[];
  html: string;
}

export interface AxeViolation {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeNodeResult[];
}

export interface ScanResult {
  axeRaw: unknown;
  violations: AxeViolation[];
  scopeGuess: "ecommerce" | "unknown";
  pageTitle: string;
  finalUrl: string;
}

export class ScanFailure extends Error {}

const NAV_TIMEOUT_MS = 20_000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;

const ECOMMERCE_SIGNALS = [
  "add to cart",
  "add to basket",
  "add to bag",
  "checkout",
  "check out",
  "shopping cart",
  "buy now",
  "book now",
  "reserve now",
  "proceed to payment",
  "dodaj do koszyka",
  "koszyk",
  "do kasy",
  "kup teraz",
  "zarezerwuj",
];

async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    const chromium = await import("@sparticuz/chromium");
    const executablePath = await chromium.default.executablePath();
    return playwrightCore.launch({
      args: chromium.default.args,
      executablePath,
      headless: true,
    });
  }
  return playwrightCore.launch({ headless: true });
}

export async function runScan(
  url: string,
  options?: { deadlineMs?: number }
): Promise<ScanResult> {
  const deadline = options?.deadlineMs ?? 50_000;
  const start = Date.now();

  const browser = await launchBrowser();
  let context: BrowserContext | null = null;

  try {
    const remaining = () => deadline - (Date.now() - start);
    if (remaining() < 5000) {
      throw new ScanFailure("Not enough time remaining to run the scan.");
    }

    context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: "Mozilla/5.0 (compatible; EAAPackBot/0.1)",
      javaScriptEnabled: true,
    });

    const page = await context.newPage();
    const navTimeout = Math.min(NAV_TIMEOUT_MS, remaining() - 3000);
    page.setDefaultTimeout(navTimeout);

    let response;
    try {
      response = await page.goto(url, { waitUntil: "load", timeout: navTimeout });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/timeout/i.test(message)) {
        throw new ScanFailure(
          "The page did not finish loading within 20 seconds. We only scan pages that become interactive."
        );
      }
      throw new ScanFailure("We could not load that page. Check the URL is publicly reachable.");
    }
    if (!response) {
      throw new ScanFailure("The page did not return a response.");
    }
    const status = response.status();
    if (status === 401 || status === 403) {
      throw new ScanFailure(
        `The page answered with HTTP ${status}. It requires a login or blocks automated visitors, and we never log in to scan.`
      );
    }
    if (status >= 400) {
      throw new ScanFailure(`The page answered with HTTP ${status}.`);
    }

    const html = await page.content();
    if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
      throw new ScanFailure("The page HTML is larger than 2MB, which is over our single-page scan limit.");
    }

    if (remaining() < 2000) {
      throw new ScanFailure("Scan timed out before accessibility analysis could complete.");
    }

    const axeResults = await new AxeBuilder({ page }).analyze();

    const bodyText = ((await page.textContent("body").catch(() => "")) || "").toLowerCase();
    const htmlLower = html.toLowerCase();
    const isEcommerce = ECOMMERCE_SIGNALS.some(
      (signal) => bodyText.includes(signal) || htmlLower.includes(signal)
    );

    return {
      axeRaw: axeResults,
      violations: axeResults.violations as unknown as AxeViolation[],
      scopeGuess: isEcommerce ? "ecommerce" : "unknown",
      pageTitle: await page.title().catch(() => ""),
      finalUrl: page.url(),
    };
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }
    await browser.close().catch(() => {});
  }
}
