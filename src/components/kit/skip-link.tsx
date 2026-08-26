/**
 * kit: skip-link
 * A link that is visually hidden until it receives keyboard focus, then jumps
 * past the header to your main content. Place it as the FIRST element inside
 * <body>, and give your main content id="main".
 *
 * Fixes axe rules: bypass, skip-link
 */
export function SkipLink({ targetId = "main", label = "Skip to main content" }: {
  targetId?: string;
  label?: string;
}) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {label}
    </a>
  );
}

/* Usage:
  <body>
    <SkipLink />
    <header>…</header>
    <main id="main" tabIndex={-1}>…</main>
  </body>
*/
