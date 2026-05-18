/**
 * Pagination - reusable numbered page bar with prev/next chevrons.
 *
 * Renders: « 1 ... 5 6 7 ... 12 » when there are many pages, or all numbers
 * when there are 7 or fewer. Disabled prev/next at the ends. Active page gets
 * the purple token used everywhere else in the admin dashboard.
 *
 * The component is dumb: parent owns the page state and reacts to onPageChange.
 *
 * RTL is handled by Tailwind's logical `start`/`end` utilities + Unicode
 * arrows; the parent simply sets the page's `dir` attribute and the bar reads
 * left-to-right or right-to-left correctly.
 */
import { useLanguage } from '../i18n/LanguageContext';
import { cn } from '../lib/utils';

// ─── Public contract ──────────────────────────────────────────────────────────

interface PaginationProps {
  /** Current 1-indexed page. */
  page: number;
  /** Total number of pages. When <=1 the component renders null. */
  pages: number;
  /** Called when the user picks a new page. Already bounded to [1, pages]. */
  onPageChange: (next: number) => void;
  /** Optional aria-label for the wrapping nav (e.g. "Catalog pagination"). */
  ariaLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Pagination bar.
 * Returns null when pages <= 1 so callers do not need to gate the render.
 */
const Pagination = ({ page, pages, onPageChange, ariaLabel }: PaginationProps) => {
  const { t } = useLanguage();
  if (pages <= 1) return null;

  // Bound the requested page within [1, pages]; ignore no-op clicks.
  const go = (next: number) => {
    const bounded = Math.max(1, Math.min(pages, next));
    if (bounded !== page) onPageChange(bounded);
  };

  const visible = buildPageList(page, pages);

  // ─── Shared button classes ──────────────────────────────────────────────────
  const baseBtn = 'w-9 h-9 inline-flex items-center justify-center rounded-md text-sm font-medium select-none';
  const inactive =
    'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer';
  const active = 'bg-[#635bff] text-white cursor-default';
  const disabled = 'text-slate-300 dark:text-slate-600 cursor-not-allowed';

  return (
    <nav aria-label={ariaLabel ?? t('bp_paginationGoTo')} className="flex items-center gap-1">
      {/* Prev */}
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page === 1}
        aria-label={t('bp_paginationPrev')}
        className={cn(baseBtn, page === 1 ? disabled : inactive)}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 010 1.06L9.06 10l3.73 3.71a.75.75 0 11-1.06 1.06l-4.25-4.24a.75.75 0 010-1.06l4.25-4.24a.75.75 0 011.06 0z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Numbered pages with ellipses */}
      {visible.map((entry, idx) =>
        entry === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-9 h-9 inline-flex items-center justify-center text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => go(entry)}
            aria-label={`${t('bp_paginationGoTo')} ${entry}`}
            aria-current={entry === page ? 'page' : undefined}
            className={cn(baseBtn, entry === page ? active : inactive)}
          >
            {entry}
          </button>
        )
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page === pages}
        aria-label={t('bp_paginationNext')}
        className={cn(baseBtn, page === pages ? disabled : inactive)}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 010-1.06L10.94 10 7.21 6.29a.75.75 0 111.06-1.06l4.25 4.24a.75.75 0 010 1.06l-4.25 4.24a.75.75 0 01-1.06 0z" clipRule="evenodd" />
        </svg>
      </button>
    </nav>
  );
};

// ─── Page-list helper ─────────────────────────────────────────────────────────

/**
 * Returns the list of page entries to render. Each entry is either a page
 * number or the literal 'ellipsis' marker.
 *
 * Rules (mirrors typical admin-table pagination):
 *   - pages <= 7: show 1..pages, no ellipses.
 *   - pages > 7: show first, last, the current page, its neighbors, and an
 *     ellipsis wherever there is a gap.
 */
function buildPageList(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const out: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push('ellipsis');
  for (let i = start; i <= end; i += 1) out.push(i);
  if (end < total - 1) out.push('ellipsis');
  out.push(total);
  return out;
}

export default Pagination;
