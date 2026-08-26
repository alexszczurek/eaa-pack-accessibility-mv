"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- kit components stay framework-agnostic: plain <a>, no next/link */
/**
 * kit: nav
 * Header navigation as a proper landmark. The mobile toggle reports its state
 * with aria-expanded and controls the menu with aria-controls.
 *
 * Fixes axe rules: region, landmark-unique, landmark-banner-is-top-level
 */
import { useId, useState, type ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
}

interface SiteNavProps {
  brand: ReactNode;
  items: NavItem[];
  /** e.g. a cart button or account link, shown on the right. */
  actions?: ReactNode;
}

export function SiteNav({ brand, items, actions }: SiteNavProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav aria-label="Main" className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <a href="/" className="text-sm font-semibold text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-sm">
            {brand}
          </a>
          <ul className="hidden items-center gap-6 md:flex">
            {items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm text-zinc-700 hover:text-zinc-950 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-sm"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <button
            type="button"
            className="rounded-lg border border-zinc-300 p-2 md:hidden outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
              {open ? (
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>
      <ul
        id={menuId}
        className={`${open ? "block" : "hidden"} border-t border-zinc-200 px-4 py-2 md:hidden`}
      >
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="block rounded-lg px-2 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </header>
  );
}

/* Usage:
  <SiteNav
    brand="Acme Store"
    items={[{ href: "/shop", label: "Shop" }, { href: "/support", label: "Support" }]}
    actions={<a href="/cart">Cart (2)</a>}
  />
*/
