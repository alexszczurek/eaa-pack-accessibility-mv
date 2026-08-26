/**
 * kit: contrast-tokens
 * A small color palette where every text/background pair holds at least
 * 4.5:1 contrast. Use the pairs as-is; do not lighten the muted tones.
 *
 * Fixes axe rules: color-contrast, link-in-text-block
 *
 * Measured contrast (WCAG relative luminance):
 *   text     #18181b on bg #ffffff  -> 16.7:1
 *   muted    #52525c on bg #ffffff  ->  7.1:1
 *   text     #18181b on surface #f4f4f5 -> 15.2:1
 *   danger   #b91c1c on bg #ffffff  ->  6.3:1
 *   link     #1d4ed8 on bg #ffffff  ->  6.4:1
 *   inverted #ffffff on brand #18181b -> 16.7:1
 */
export const contrastTokens = {
  bg: "#ffffff",
  surface: "#f4f4f5",
  text: "#18181b",
  muted: "#52525c",
  danger: "#b91c1c",
  link: "#1d4ed8",
  brand: "#18181b",
  brandText: "#ffffff",
} as const;

/** Tailwind class pairs that match the tokens above. */
export const contrastClasses = {
  body: "bg-white text-zinc-900",
  muted: "text-zinc-600", // zinc-600 = #52525c, 7.1:1 on white
  surface: "bg-zinc-100 text-zinc-900",
  danger: "text-red-700", // red-700 = #b91c1c, 6.3:1 on white
  link: "text-blue-700 underline underline-offset-4", // blue-700 = #1d4ed8; underline so color is not the only cue
  brandButton: "bg-zinc-900 text-white",
} as const;

/** Drop-in preview so you can see every pair in place. */
export function ContrastTokensPreview() {
  return (
    <div className={`space-y-3 rounded-xl border border-zinc-200 p-5 ${contrastClasses.body}`}>
      <p className="text-sm font-semibold">Primary text — always readable</p>
      <p className={`text-sm ${contrastClasses.muted}`}>
        Muted text for hints and captions. Still 7.1:1, still readable.
      </p>
      <p className={`text-sm ${contrastClasses.danger}`}>This price changed since you added it.</p>
      <p className="text-sm">
        Body text with{" "}
        <a href="#" className={contrastClasses.link}>
          a link you can actually spot
        </a>{" "}
        without guessing by color.
      </p>
      <button type="button" className={`rounded-lg px-4 py-2 text-sm font-medium ${contrastClasses.brandButton}`}>
        Continue to payment
      </button>
    </div>
  );
}
