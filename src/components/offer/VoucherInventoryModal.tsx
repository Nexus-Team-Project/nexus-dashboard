/**
 * VoucherInventoryModal: the popup shown when an admin publishes a voucher.
 *
 * Top tabs: Image (disabled placeholder), Insert links, Generate barcodes.
 * - Generate barcodes: a quantity field sets how many mock codes to create.
 * - Insert links: one row per link; the + button adds a row AND increments the
 *   quantity, keeping quantity and the number of rows in sync.
 * Bottom actions: Skip (publish with no inventory) and Insert barcodes/links
 *   (publish + create the chosen inventory).
 *
 * Presentation only: the parent owns publishing. onConfirm receives the chosen
 * inventory payload; onSkip publishes with none. `z-[200]`, body-scroll lock.
 * The popup closes ONLY via the X button (onCancel), Skip, or Insert — never on
 * backdrop click or Escape, so an accidental click can't dismiss it.
 */
import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';
import type { OfferInventoryInput } from '../../lib/api';

type Tab = 'image' | 'links' | 'barcodes';

interface VoucherInventoryModalProps {
  /** Disables actions while the parent is publishing. */
  busy?: boolean;
  /**
   * Existing link values to pre-fill the Insert-links tab (used on Edit so the
   * voucher's current links are shown). When provided non-empty, the popup
   * opens on the links tab. Defaults to a single empty row.
   */
  initialLinks?: string[];
  /** Publish with the chosen inventory (barcodes or links). */
  onConfirm: (inventory: OfferInventoryInput) => void;
  /** Publish with no inventory. */
  onSkip: () => void;
  /** Dismiss the popup without publishing (X button only). */
  onCancel: () => void;
}

const MAX = 10000;

export default function VoucherInventoryModal({ busy = false, initialLinks, onConfirm, onSkip, onCancel }: VoucherInventoryModalProps) {
  const { t } = useLanguage();
  const hasInitialLinks = !!initialLinks && initialLinks.length > 0;
  const [tab, setTab] = useState<Tab>(hasInitialLinks ? 'links' : 'barcodes');
  const [quantity, setQuantity] = useState('1');
  // Seed existing links (+ a trailing empty row for adding more) on Edit.
  const [links, setLinks] = useState<string[]>(hasInitialLinks ? [...initialLinks!, ''] : ['']);
  const [error, setError] = useState<string | null>(null);

  // Body-scroll lock while the popup is open. The popup intentionally does NOT
  // close on Escape or backdrop click — only the X / Skip / Insert actions close it.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /** Links that actually have content (trailing empty row excluded). */
  const filledLinks = links.map((l) => l.trim()).filter(Boolean);

  /** Add a new empty link row — but only when the last row is already filled,
   *  so at most one trailing empty row exists ("only the last one may be empty"). */
  const addLinkRow = () => {
    setLinks((prev) => {
      if (prev.length >= MAX) return prev;
      if (prev[prev.length - 1].trim() === '') return prev;
      return [...prev, ''];
    });
  };

  const setLinkAt = (i: number, value: string) =>
    setLinks((prev) => prev.map((l, idx) => (idx === i ? value : l)));

  const removeLinkAt = (i: number) =>
    setLinks((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  /** Validates the active tab and forwards an inventory payload to the parent. */
  const handleInsert = () => {
    setError(null);
    if (tab === 'barcodes') {
      const n = Number(quantity);
      if (!Number.isInteger(n) || n < 1 || n > MAX) { setError(t('vi_errQuantity')); return; }
      onConfirm({ kind: 'barcode', quantity: n });
      return;
    }
    if (tab === 'links') {
      if (filledLinks.length === 0) { setError(t('vi_errLinksEmpty')); return; }
      // Only http/https URLs are accepted (blocks javascript:/data: and similar).
      if (filledLinks.some((l) => !/^https?:\/\//i.test(l))) { setError(t('vi_errLinksInvalid')); return; }
      onConfirm({ kind: 'link', links: filledLinks });
      return;
    }
  };

  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: 'image', label: t('vi_tabImage'), disabled: true },
    { key: 'links', label: t('vi_tabLinks') },
    { key: 'barcodes', label: t('vi_tabBarcodes') },
  ];

  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('vi_title')}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-card-dark shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('vi_title')}</h2>
          <button type="button" onClick={onCancel} disabled={busy} aria-label={t('of_cancel')}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            &#x2715;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 pt-4" role="tablist">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              type="button"
              role="tab"
              aria-selected={tab === tb.key}
              disabled={tb.disabled || busy}
              onClick={() => setTab(tb.key)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                tab === tb.key
                  ? 'border-primary bg-primary text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
              )}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quantity. Barcodes: an editable number input. Links: a plain count
              shown next to the title (driven only by the filled link rows). */}
          {tab === 'barcodes' && (
            <div>
              <label htmlFor="vi-quantity" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('vi_quantityLabel')}
              </label>
              <input
                id="vi-quantity"
                type="number"
                min="1"
                max={MAX}
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                disabled={busy}
                dir="ltr"
                className={inputCls + ' w-32'}
              />
            </div>
          )}
          {tab === 'links' && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">{t('vi_quantityLabel')}</span>
              <span className="font-semibold text-slate-900 dark:text-white" dir="ltr">{filledLinks.length}</span>
            </div>
          )}

          {tab === 'links' && (
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex gap-2" dir="ltr">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLinkAt(i, e.target.value)}
                    placeholder="https://..."
                    disabled={busy}
                    className={inputCls}
                  />
                  {links.length > 1 && (
                    <button type="button" onClick={() => removeLinkAt(i)} disabled={busy} aria-label={t('vi_removeLink')}
                      className="shrink-0 rounded-lg border border-slate-200 px-3 text-slate-400 hover:text-red-500 dark:border-slate-700">
                      &times;
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addLinkRow} disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <span aria-hidden>+</span> {t('vi_addLink')}
              </button>
            </div>
          )}

          {tab === 'barcodes' && (
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('vi_barcodesHint')}</p>
          )}
          {tab === 'image' && (
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('vi_imageSoon')}</p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 p-5 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onSkip} disabled={busy}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-60">
            {t('vi_skip')}
          </button>
          <button type="button" onClick={handleInsert} disabled={busy || tab === 'image'}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60">
            {busy ? t('of_saving') : t('vi_insert')}
          </button>
        </div>
      </div>
    </div>
  );
}
