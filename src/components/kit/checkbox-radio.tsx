/**
 * kit: checkbox-radio
 * Checkbox and radio with a 24x24px hit target and a label that is part of
 * the clickable area. The whole row toggles the control.
 *
 * Fixes axe rules: label (on checkboxes/radios), aria-toggle-field-name
 */
import type { InputHTMLAttributes, ReactNode } from "react";

interface CheckableProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: ReactNode;
  hint?: string;
}

export function Checkbox({ id, label, hint, className = "", ...rest }: CheckableProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-lg p-1 -m-1 hover:bg-zinc-50"
    >
      <input
        id={id}
        type="checkbox"
        className={`mt-0.5 size-6 shrink-0 cursor-pointer rounded border-zinc-400 accent-blue-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${className}`}
        {...rest}
      />
      <span className="text-sm leading-6">
        <span className="font-medium text-zinc-900">{label}</span>
        {hint && <span className="block text-zinc-600">{hint}</span>}
      </span>
    </label>
  );
}

export function Radio({ id, label, hint, className = "", ...rest }: CheckableProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-lg p-1 -m-1 hover:bg-zinc-50"
    >
      <input
        id={id}
        type="radio"
        className={`mt-0.5 size-6 shrink-0 cursor-pointer border-zinc-400 accent-blue-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${className}`}
        {...rest}
      />
      <span className="text-sm leading-6">
        <span className="font-medium text-zinc-900">{label}</span>
        {hint && <span className="block text-zinc-600">{hint}</span>}
      </span>
    </label>
  );
}

/* Usage:
  <Checkbox id="newsletter" name="newsletter" label="Email me order updates"
    hint="A shipping confirmation and a delivery notice. Nothing else." />
  <Radio id="ship-std" name="shipping" value="standard" label="Standard — free" />
*/
