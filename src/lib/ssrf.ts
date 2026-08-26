import { isIP } from "net";
import { lookup } from "dns/promises";

/**
 * Validates a user-supplied scan target. https only, no localhost,
 * no private/link-local/reserved IPs. Returns a normalized URL string
 * or throws with a user-facing message.
 */
export async function validateScanUrl(raw: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ScanUrlError("That does not look like a valid URL. Include https:// at the start.");
  }
  // Single deliberate exception to the https/localhost rules: this app's own
  // /fixtures/* pages, so the built-in acceptance fixtures can be scanned in dev.
  if (isOwnFixtureUrl(url)) {
    url.hash = "";
    return url.toString();
  }
  if (url.protocol !== "https:") {
    throw new ScanUrlError("Only https:// URLs can be scanned.");
  }
  if (url.username || url.password) {
    throw new ScanUrlError("URLs with embedded credentials are not allowed.");
  }
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new ScanUrlError("Local and internal hostnames cannot be scanned.");
  }
  if (isIP(host)) {
    if (isPrivateIp(host)) {
      throw new ScanUrlError("Private or reserved IP addresses cannot be scanned.");
    }
  } else {
    let addresses;
    try {
      addresses = await lookup(host, { all: true });
    } catch {
      throw new ScanUrlError("We could not resolve that hostname.");
    }
    for (const a of addresses) {
      if (isPrivateIp(a.address)) {
        throw new ScanUrlError("That hostname resolves to a private address and cannot be scanned.");
      }
    }
  }
  url.hash = "";
  return url.toString();
}

export class ScanUrlError extends Error {}

export function isOwnFixtureUrl(url: URL): boolean {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return false;
  try {
    const app = new URL(base);
    return url.origin === app.origin && url.pathname.startsWith("/fixtures/");
  } catch {
    return false;
  }
}

export function isPrivateIp(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true; // not an IP at all -> treat as unsafe
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true; // this-net, private, loopback
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 192 && b === 0) return true; // IETF reserved blocks
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateIpv6(address: string): boolean {
  const lower = address.toLowerCase();
  if (lower === "::" || lower === "::1") return true; // unspecified, loopback
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb"))
    return true; // link-local fe80::/10
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local fc00::/7
  if (lower.startsWith("::ffff:")) {
    // IPv4-mapped
    const v4 = lower.replace("::ffff:", "");
    if (isIP(v4) === 4) return isPrivateIpv4(v4);
    return true;
  }
  return false;
}
