/**
 * Converts an HTML string to a plain-text approximation suitable for
 * line-clamp display in tables and short previews.
 *
 * Decodes HTML entities (&amp;, &nbsp;, &mdash;, etc.) and collapses runs
 * of whitespace so multi-paragraph descriptions do not leave huge gaps.
 *
 * Implementation:
 *   - Browser path: uses DOMParser to parse the HTML into an inert document
 *     and reads textContent. DOMParser does NOT execute scripts, so this
 *     is safe to call on untrusted HTML coming from the API. We never
 *     render the result as HTML - only as plain text via React's default
 *     escaping - so there is no XSS surface.
 *   - SSR / Node path: falls back to a regex that strips angle-bracket
 *     blocks. Less accurate (does not decode entities) but the Vite dev
 *     server and production bundle both run in the browser, so this path
 *     is only hit if the helper is ever used in a Node test environment.
 *
 * Input:  html - raw HTML string or null/undefined.
 * Output: plain-text approximation, or '' when the input is empty.
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';

  // SSR / Node fallback: no DOMParser available.
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
