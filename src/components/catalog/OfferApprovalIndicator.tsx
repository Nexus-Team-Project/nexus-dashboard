/**
 * OfferApprovalIndicator - shows the admin-approval state of a global (ecosystem)
 * offer on Benefits Partnerships, so the uploading tenant can see whether their
 * offer is pending, denied, or approved.
 *
 * - ApprovalStatusBadge: an inline pill for the table Status cell.
 * - ApprovalCardOverlay: an image overlay for cards. Pending/denied dim the card
 *   (the offer is not live); an approved OWN offer gets a small green corner chip.
 *
 * Presentational only. The caller decides when to render these (e.g. only for a
 * tenant's own offers in the table).
 */
import { useLanguage } from '../../i18n/LanguageContext';

/** Localized label for an approval status, or '' for unknown values. */
function approvalLabel(status: string | undefined, language: 'he' | 'en'): string {
  switch (status) {
    case 'pending_approval': return language === 'he' ? 'ממתין לאישור' : 'Pending approval';
    case 'denied': return language === 'he' ? 'נדחה' : 'Denied';
    case 'active': return language === 'he' ? 'אושר' : 'Approved';
    default: return '';
  }
}

/** Small clock icon for the pending/denied overlay chip. */
const ClockIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h3.25a.75.75 0 000-1.5h-2.5V5z" clipRule="evenodd" />
  </svg>
);

/**
 * Inline approval-status pill. Renders nothing for unknown statuses.
 * Input: status - the offer's approval_status.
 */
export function ApprovalStatusBadge({ status }: { status?: string }) {
  const { language } = useLanguage();
  const text = approvalLabel(status, language);
  if (!text) return null;
  const cls = status === 'denied'
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    : status === 'pending_approval'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {text}
    </span>
  );
}

/**
 * Card image overlay reflecting approval state.
 * Input: status - the offer's approval_status; isOwn - true when this is the
 *   viewing tenant's own offer (gates the "approved" green chip so it never shows
 *   on other uploaders' live offers).
 */
export function ApprovalCardOverlay({ status, isOwn }: { status?: string; isOwn?: boolean }) {
  const { language } = useLanguage();

  if (status === 'pending_approval' || status === 'denied') {
    const chipCls = status === 'denied' ? 'bg-red-400/95 text-red-900' : 'bg-amber-400/95 text-amber-900';
    return (
      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow ${chipCls}`}>
          <ClockIcon />
          {approvalLabel(status, language)}
        </span>
      </div>
    );
  }

  if (status === 'active' && isOwn) {
    return (
      <div className="absolute top-2 start-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
          </svg>
          {approvalLabel('active', language)}
        </span>
      </div>
    );
  }

  return null;
}
