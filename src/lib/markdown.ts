import { marked } from "marked";

/**
 * Renders markdown to HTML with raw HTML escaped first, so user-supplied
 * content cannot inject markup. Markdown syntax itself still works.
 */
export function renderMarkdown(md: string): string {
  const escaped = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Restore blockquote markers that the escape above broke ("> " at line start).
  const restored = escaped.replace(/^&gt; ?/gm, "> ");
  return marked.parse(restored, { async: false }) as string;
}

/** Strips the first level-1 heading (the layout renders its own title). */
export function stripH1(md: string): string {
  return md.replace(/^# .*$/m, "").trim();
}
