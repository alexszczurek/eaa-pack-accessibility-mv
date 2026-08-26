/**
 * kit: text-field
 * Input with a real <label> (for/id), optional hint and error, both wired
 * through aria-describedby, and aria-invalid on error.
 *
 * Fixes axe rules: label, label-title-only, select-name, form-field-multiple-labels
 */
import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Unique id — also links the label, hint and error. */
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({ id, label, hint, error, className = "", ...rest }: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-900">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-zinc-600">
          {hint}
        </p>
      )}
      <input
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
          error ? "border-red-700" : "border-zinc-300"
        } ${className}`}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/* Usage:
  <TextField id="email" label="Email" hint="We only use this for your receipt."
    type="email" autoComplete="email" error={errors.email} />
*/
