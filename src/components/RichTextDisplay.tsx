/**
 * RichTextDisplay: safely renders HTML description output from the TipTap editor.
 * Sanitizes HTML via DOMPurify before rendering to prevent XSS.
 * Applies Tailwind typography prose classes for clean visual styling.
 *
 * Props:
 *   html      - the HTML string to render (from TipTap editor output).
 *   className - optional extra classes for the wrapper div.
 *   compact   - when true, applies line-clamp-3 for list/card previews.
 */
import DOMPurify from 'dompurify';
import { cn } from '../lib/utils';

interface RichTextDisplayProps {
  html: string;
  className?: string;
  compact?: boolean;
}

/**
 * Sanitizes HTML string using DOMPurify to strip dangerous tags/attributes.
 * Input: raw HTML string from the editor.
 * Output: safe HTML string safe for dangerouslySetInnerHTML.
 */
function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a',
      'h1', 'h2', 'h3', 'h4',
      'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'span', 'div',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
  });
}

export default function RichTextDisplay({ html, className, compact }: RichTextDisplayProps) {
  if (!html || html.trim() === '' || html === '<p></p>') return null;

  return (
    <div
      className={cn(
        'prose prose-sm max-w-none',
        'prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1',
        compact && 'line-clamp-3',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitize(html) }}
    />
  );
}
