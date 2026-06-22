/**
 * VoucherInventoryModal: the popup for choosing a voucher's redeemable inventory.
 *
 * Two tabs, both row-based:
 *   - Generate barcodes: one provider-entered barcode STRING per row. On finish,
 *     a client-side preview (CodePreviewModal) shows a sample barcode + QR before
 *     the choice is recorded.
 *   - Insert links: one row per link (required, http(s)) + an OPTIONAL code
 *     (a plain coupon/redemption string, safe-charset validated).
 * Both support paste-to-grow (see voucherInventoryPaste): barcodes split on
 * commas/newlines; links parse one row per line as `link, code`.
 *
 * A voucher's inventory is ONE kind only — when `lockedKind` is set (the offer
 * already has units of that kind, e.g. on Edit) the other tab is disabled. The
 * backend re-validates and is the authoritative guard.
 *
 * Presentation only: the parent owns what happens with the choice (onConfirm /
 * onSkip). This component performs no backend call. `z-[200]`, body-scroll lock.
 * Closes only via X (onCancel), Skip, or a confirmed Insert — never on backdrop.
 */
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';
import type { OfferInventoryInput } from '../../lib/api';
import CodePreviewModal from './CodePreviewModal';
import {
  INVENTORY_MAX, isHttpUrl, isSafeCode, splitPastedBarcodes, parsePastedLinkRows, buildLinkExample,
  type LinkRow,
} from './voucherInventoryPaste';

type Tab = 'links' | 'barcodes';

interface VoucherInventoryModalProps {
  busy?: boolean;
  /** Pre-fill the barcode tab (re-open preserves a previously staged choice). */
  initialBarcodes?: string[];
  /** Pre-fill the links tab with URLs (+ optional codes) — Edit existing links, or a re-opened staged choice. */
  initialLinks?: { url: string; code?: string }[];
  /** When set, the voucher already uses this kind — the other tab is disabled. */
  lockedKind?: 'barcode' | 'link' | null;
  /** Record the chosen inventory (barcodes or links+codes). */
  onConfirm: (inventory: OfferInventoryInput) => void;
  /** Record "no inventory". */
  onSkip: () => void;
  /** Dismiss without recording (X button only). */
  onCancel: () => void;
}

/** Append a trailing empty row only when the last row is non-empty. */
function withTrailingBarcode(rows: string[]): string[] {
  return rows.length === 0 || rows[rows.length - 1].trim() !== '' ? [...rows, ''] : rows;
}
function withTrailingLink(rows: LinkRow[]): LinkRow[] {
  return rows.length === 0 || rows[rows.length - 1].url.trim() !== '' ? [...rows, { url: '', code: '' }] : rows;
}

export default function VoucherInventoryModal({ busy = false, initialBarcodes, initialLinks, lockedKind, onConfirm, onSkip, onCancel }: VoucherInventoryModalProps) {
  const { t, language } = useLanguage();
  const hasInitialBarcodes = !!initialBarcodes && initialBarcodes.length > 0;
  const hasInitialLinks = !!initialLinks && initialLinks.length > 0;
  // Scrollbar side for the fixed-height row list: right in Hebrew, left in English.
  const scrollDir = language === 'he' ? 'ltr' : 'rtl';
  const initialTab: Tab = lockedKind
    ? (lockedKind === 'link' ? 'links' : 'barcodes')
    : (hasInitialBarcodes ? 'barcodes' : hasInitialLinks ? 'links' : 'barcodes');
  const [tab, setTab] = useState<Tab>(initialTab);
  const [barcodes, setBarcodes] = useState<string[]>(hasInitialBarcodes ? [...initialBarcodes!, ''] : ['']);
  const [linkRows, setLinkRows] = useState<LinkRow[]>(hasInitialLinks ? [...initialLinks!.map((l) => ({ url: l.url, code: l.code ?? '' })), { url: '', code: '' }] : [{ url: '', code: '' }]);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [previewValues, setPreviewValues] = useState<string[] | null>(null);
  const [previewDup, setPreviewDup] = useState(0);
  // Links have no preview; when duplicates are combined we show a notice and
  // require a second Insert click to confirm. Reset (in the link mutators) on edit.
  const [linkDup, setLinkDup] = useState<{ removed: number; unique: number } | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Auto-scroll the fixed-height row list to the bottom when a new row appears,
  // so the freshly-added (empty) row is visible.
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(0);
  const activeCount = tab === 'barcodes' ? barcodes.length : linkRows.length;
  useEffect(() => {
    if (activeCount > prevCount.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevCount.current = activeCount;
  }, [activeCount]);

  const filledBarcodes = barcodes.map((b) => b.trim()).filter(Boolean);
  const filledLinks = linkRows.filter((r) => r.url.trim() !== '');

  // ── Barcode rows ──────────────────────────────────────────────────────────
  const setBarcodeAt = (i: number, v: string) => setBarcodes((p) => withTrailingBarcode(p.map((b, idx) => (idx === i ? v : b))));
  const removeBarcodeAt = (i: number) => setBarcodes((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i)));
  const pasteBarcodes = (i: number, text: string): boolean => {
    const items = splitPastedBarcodes(text);
    if (items.length <= 1) return false; // let the field handle a single paste
    const merged = Array.from(new Set([...filledBarcodes, ...items])).slice(0, INVENTORY_MAX);
    setBarcodes([...merged, '']);
    return true;
  };

  // ── Link rows ── (each edit clears a pending duplicate notice) ──────────────
  const setLinkUrl = (i: number, url: string) => { setLinkDup(null); setLinkRows((p) => withTrailingLink(p.map((r, idx) => (idx === i ? { ...r, url } : r)))); };
  const setLinkCode = (i: number, code: string) => { setLinkDup(null); setLinkRows((p) => p.map((r, idx) => (idx === i ? { ...r, code } : r))); };
  const removeLinkAt = (i: number) => { setLinkDup(null); setLinkRows((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i))); };
  const pasteLinks = (text: string): boolean => {
    setLinkDup(null);
    const parsed = parsePastedLinkRows(text);
    if (parsed.length === 0) return false;
    if (parsed.length === 1 && !parsed[0].code) return false; // single bare url → normal paste
    const seen = new Set(filledLinks.map((r) => r.url));
    const merged = [...filledLinks];
    for (const r of parsed) { if (!seen.has(r.url) && merged.length < INVENTORY_MAX) { seen.add(r.url); merged.push(r); } }
    setLinkRows([...merged, { url: '', code: '' }]);
    return true;
  };

  // ── Finish ────────────────────────────────────────────────────────────────
  const finishBarcodes = () => {
    setError(null);
    if (filledBarcodes.length === 0) { setError(t('vi_errBarcodesEmpty')); return; }
    // Combine duplicates into one (keep first occurrence); the preview reports how
    // many were removed before the admin accepts.
    const unique = Array.from(new Set(filledBarcodes));
    setPreviewDup(filledBarcodes.length - unique.length);
    setPreviewValues(unique);
  };
  const finishLinks = () => {
    setError(null);
    if (filledLinks.length === 0) { setError(t('vi_errLinksEmpty')); return; }
    if (filledLinks.some((r) => !isHttpUrl(r.url))) { setError(t('vi_errLinksInvalid')); return; }
    if (filledLinks.some((r) => !isSafeCode(r.code))) { setError(t('vi_errCodeInvalid')); return; }
    // Combine duplicate URLs into one (first row wins, keeping its code).
    const seen = new Set<string>();
    const uniqueRows = filledLinks.filter((r) => { const u = r.url.trim(); if (seen.has(u)) return false; seen.add(u); return true; });
    const removed = filledLinks.length - uniqueRows.length;
    // First click with duplicates: show the count and wait for a confirming click.
    if (removed > 0 && !linkDup) { setLinkDup({ removed, unique: uniqueRows.length }); return; }
    onConfirm({ kind: 'link', links: uniqueRows.map((r) => ({ url: r.url.trim(), ...(r.code.trim() ? { code: r.code.trim() } : {}) })) });
  };

  const downloadExample = () => {
    const blob = new Blob([buildLinkExample()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'voucher-links-example.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'links', label: t('vi_tabLinks') },
    { key: 'barcodes', label: t('vi_tabBarcodes') },
  ];
  const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true" aria-label={t('vi_title')}>
        <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-card-dark shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('vi_title')}</h2>
            <button type="button" onClick={onCancel} disabled={busy} aria-label={t('of_cancel')}
              className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">&#x2715;</button>
          </div>

          {/* Tabs (the other tab is disabled when the voucher is locked to one kind) */}
          <div className="flex gap-2 px-5 pt-4" role="tablist">
            {tabs.map((tb) => {
              const locked = !!lockedKind && lockedKind !== (tb.key === 'links' ? 'link' : 'barcode');
              return (
                <button key={tb.key} type="button" role="tab" aria-selected={tab === tb.key} disabled={busy || locked}
                  onClick={() => setTab(tb.key)}
                  title={locked ? t('vi_lockedNote') : undefined}
                  className={cn('rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    tab === tb.key ? 'border-primary bg-primary text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200')}>
                  {tb.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {lockedKind && <p className="text-xs text-amber-600 dark:text-amber-400">{t('vi_lockedNote')}</p>}

            {/* Count + format help */}
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-600 dark:text-slate-300">
                <span className="font-medium">{t('vi_countLabel')} </span>
                <span className="font-semibold" dir="ltr">{tab === 'barcodes' ? filledBarcodes.length : filledLinks.length}</span>
              </span>
              <button type="button" onClick={() => setShowHelp((s) => !s)} className="text-xs font-medium text-primary hover:underline" aria-expanded={showHelp}>
                {t('vi_helpToggle')}
              </button>
            </div>
            {showHelp && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <p>{tab === 'barcodes' ? t('vi_pasteHintBarcodes') : t('vi_pasteHintLinks')}</p>
                {tab === 'links' && (
                  <>
                    <pre className="overflow-x-auto rounded bg-white dark:bg-slate-900 p-2 text-[11px]" dir="ltr">{buildLinkExample()}</pre>
                    <button type="button" onClick={downloadExample} className="font-medium text-primary hover:underline">{t('vi_downloadExample')}</button>
                  </>
                )}
              </div>
            )}

            {/* Barcode rows — fixed-height scroll area so the popup never grows. */}
            {tab === 'barcodes' && (
              <div ref={scrollRef} dir={scrollDir} className="h-[340px] overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800 p-2 space-y-2">
                {barcodes.map((b, i) => (
                  <div key={i} className="flex gap-2" dir="ltr">
                    <input value={b} onChange={(e) => setBarcodeAt(i, e.target.value)}
                      onPaste={(e) => { if (pasteBarcodes(i, e.clipboardData.getData('text'))) e.preventDefault(); }}
                      placeholder={t('vi_barcodePlaceholder')} disabled={busy} className={inputCls} />
                    {barcodes.length > 1 && (
                      <button type="button" onClick={() => removeBarcodeAt(i)} disabled={busy} aria-label={t('vi_removeLink')}
                        className="shrink-0 rounded-lg border border-slate-200 px-3 text-slate-400 hover:text-red-500 dark:border-slate-700">&times;</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Link rows (url + optional code) — fixed-height scroll area. */}
            {tab === 'links' && (
              <div ref={scrollRef} dir={scrollDir} className="h-[340px] overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800 p-2 space-y-2">
                {linkRows.map((row, i) => (
                  <div key={i} className="flex gap-2" dir="ltr">
                    <input type="url" value={row.url} onChange={(e) => setLinkUrl(i, e.target.value)}
                      onPaste={(e) => { if (pasteLinks(e.clipboardData.getData('text'))) e.preventDefault(); }}
                      placeholder="https://..." disabled={busy} className={inputCls} />
                    <input value={row.code} onChange={(e) => setLinkCode(i, e.target.value)}
                      placeholder={t('vi_linkCodePlaceholder')} disabled={busy} className={cn(inputCls, 'max-w-[40%]')} />
                    {linkRows.length > 1 && (
                      <button type="button" onClick={() => removeLinkAt(i)} disabled={busy} aria-label={t('vi_removeLink')}
                        className="shrink-0 rounded-lg border border-slate-200 px-3 text-slate-400 hover:text-red-500 dark:border-slate-700">&times;</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Duplicate notice for links — shown before accepting; a second
                Insert click confirms. (Barcodes report duplicates in the preview.) */}
            {tab === 'links' && linkDup && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {t('vi_dupNotice').replace('{removed}', String(linkDup.removed)).replace('{unique}', String(linkDup.unique))}
              </p>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 p-5 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onSkip} disabled={busy}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-60">{t('vi_skip')}</button>
            <button type="button" onClick={tab === 'barcodes' ? finishBarcodes : finishLinks} disabled={busy}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60">{busy ? t('of_saving') : (tab === 'links' && linkDup ? t('vi_dupConfirm') : t('vi_insert'))}</button>
          </div>
        </div>
      </div>

      {previewValues && (
        <CodePreviewModal
          sampleValue={previewValues[0]}
          count={previewValues.length}
          duplicatesRemoved={previewDup}
          busy={busy}
          onConfirm={() => { onConfirm({ kind: 'barcode', values: previewValues }); setPreviewValues(null); }}
          onCancel={() => { setPreviewValues(null); setPreviewDup(0); }}
        />
      )}
    </>
  );
}
