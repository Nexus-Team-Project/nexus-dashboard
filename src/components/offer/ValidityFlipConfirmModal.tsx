/**
 * ValidityFlipConfirmModal: confirm dialog shown before changing a LIVE offer's
 * validity type (voucher-validity-dating). Flipping the type changes which date a
 * code's "available" units must carry, so any unit that lacks the now-active value
 * will block save until re-entered (nothing is deleted - the other set is kept).
 * Used only on Edit (a published offer); authoring an unpublished offer flips
 * freely. Bilingual; modeled on PublishConfirmModal (portal, z-index, scroll-lock).
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';

interface ValidityFlipConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ValidityFlipConfirmModal({ onConfirm, onCancel }: ValidityFlipConfirmModalProps) {
  const { t } = useLanguage();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = prev; };
  }, [onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
      onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="validity-flip-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1">
          <h2 id="validity-flip-title" className="text-base font-semibold text-slate-900 dark:text-white">{t('ef_flipTitle')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('ef_flipBody')}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onConfirm}
            className="flex-1 bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-opacity">
            {t('ef_flipConfirm')}
          </button>
          <button type="button" onClick={onCancel}
            className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {t('of_cancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
