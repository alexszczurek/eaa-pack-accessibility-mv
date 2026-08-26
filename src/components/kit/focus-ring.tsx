/**
 * kit: focus-ring
 * Visible focus tokens plus a button and a link that always have an
 * accessible name and a clearly visible keyboard focus state.
 * Icon-only buttons MUST pass `label`.
 *
 * Fixes axe rules: button-name, link-name, input-button-name
 */
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

/** Shared focus classes — reuse on any interactive element. */
export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required when the button has no visible text (icon-only). */
  label?: string;
  children: ReactNode;
}

export function AccessibleButton({ label, children, className = "", ...rest }: AccessibleButtonProps) {
  return (
    <button
      type={rest.type ?? "button"}
      aria-label={label}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 ${focusRing} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

interface AccessibleLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

export function AccessibleLink({ children, className = "", ...rest }: AccessibleLinkProps) {
  return (
    <a
      className={`rounded-sm font-medium text-blue-700 underline decoration-blue-300 underline-offset-4 transition-colors hover:text-blue-900 hover:decoration-blue-700 ${focusRing} ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
}

/* Usage:
  <AccessibleButton onClick={save}>Save changes</AccessibleButton>
  <AccessibleButton label="Close cart"><XIcon aria-hidden /></AccessibleButton>
  <AccessibleLink href="/returns">Read our returns policy</AccessibleLink>
*/
