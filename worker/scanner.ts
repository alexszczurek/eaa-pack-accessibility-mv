import { chromium, type Browser } from "playwright";
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

let sharedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    sharedBrowser = await chromium.launch({ headless: true });
  }
  return sharedBrowser;
}

export async function closeBrowser(): Promise<void> {
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => {});
    sharedBrowser = null;
  }
}

/**
 * Fetches one page and runs axe-core against it.
 * - 20s navigation budget, viewport 1440x900, identifies as EAAPackBot/0.1
 * - never logs in, never persists target cookies (fresh context per scan)
 * - rejects pages over 2MB of HTML and 401/403 responses
 */
export async function runScan(url: string): Promise<ScanResult> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: "Mozilla/5.0 (compatible; EAAPackBot/0.1)",
    javaScriptEnabled: true,
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(NAV_TIMEOUT_MS);

    let response;
    try {
      response = await page.goto(url, { waitUntil: "load", timeout: NAV_TIMEOUT_MS });
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
    // Fresh context per scan; closing it discards all target cookies/storage.
    await context.close().catch(() => {});
  }
}
