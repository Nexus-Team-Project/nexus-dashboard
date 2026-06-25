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
import FieldTooltip from '../FieldTooltip';
import CodePreviewModal from './CodePreviewModal';
import {
  INVENTORY_MAX, isHttpUrl, isSafeCode, splitPastedBarcodes, parsePastedLinkRows, buildLinkExample,
  findDuplicateCodes, findDuplicateUrls, type LinkRow,
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
  /** The variant's effective validity type - drives the per-batch date control. */
  validityType: 'limit' | 'from_until';
  /** Re-open pre-fill: a previously staged inventory choice (carries its validity). */
  initialValidity?: OfferInventoryInput;
  /** Record the chosen inventory (barcodes or links+codes) with its batch validity. */
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

export default function VoucherInventoryModal({ busy = false, initialBarcodes, initialLinks, lockedKind, validityType, initialValidity, onConfirm, onSkip, onCancel }: VoucherInventoryModalProps) {
  const { t, language } = useLanguage();
  // Per-batch validity (voucher-validity-dating): stamped onto every unit added in
  // this batch. 'limit' defaults to 5 years; 'from_until' takes a window and warns
  // (non-blocking) when the span is under the 5-year legal recommendation.
  const [limitValue, setLimitValue] = useState<string>(
    initialValidity?.validityValue != null ? String(initialValidity.validityValue) : (validityType === 'limit' ? '5' : ''),
  );
  const [limitUnit, setLimitUnit] = useState<'days' | 'months' | 'years'>(initialValidity?.validityUnit ?? 'years');
  const [fromDate, setFromDate] = useState<string>(initialValidity?.validFrom ? initialValidity.validFrom.slice(0, 10) : '');
  const [untilDate, setUntilDate] = useState<string>(initialValidity?.validUntil ? initialValidity.validUntil.slice(0, 10) : '');
  // Validated batch validity captured at finish-time, attached to the onConfirm payload.
  const [batchValidity, setBatchValidity] = useState<Partial<OfferInventoryInput> | null>(null);
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
  // Codes reused across DIFFERENT links - a hard error (no upload). The set holds
  // the offending trimmed codes; rows carrying one get a red border (see render).
  const [dupCodes, setDupCodes] = useState<Set<string>>(new Set());
  // Links repeated on more than one row (combined into one on confirm); the
  // duplicated url inputs get a red border so the admin sees which rows merge.
  const [dupUrls, setDupUrls] = useState<Set<string>>(new Set());

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

  // ── Per-batch validity ──────────────────────────────────────────────────────
  const FIVE_YEARS_MS = 5 * 365.25 * 24 * 60 * 60 * 1000;
  // Non-blocking legal advisory: a from-until span under 5 years.
  const showAdvisory =
    validityType === 'from_until' && !!fromDate && !!untilDate
    && new Date(untilDate).getTime() >= new Date(fromDate).getTime()
    && (new Date(untilDate).getTime() - new Date(fromDate).getTime()) < FIVE_YEARS_MS;
  /** Validates + builds the batch validity for the variant's effective type. */
  const resolveBatchValidity = (): { ok: true; v: Partial<OfferInventoryInput> } | { ok: false; err: string } => {
    if (validityType === 'limit') {
      const n = Number(limitValue);
      if (!limitValue.trim() || !Number.isInteger(n) || n <= 0) return { ok: false, err: t('vi_errBatchValidity') };
      return { ok: true, v: { validityValue: n, validityUnit: limitUnit } };
    }
    if (!fromDate || !untilDate) return { ok: false, err: t('vi_errBatchValidity') };
    if (new Date(untilDate).getTime() < new Date(fromDate).getTime()) return { ok: false, err: t('vi_errBatchRange') };
    return { ok: true, v: { validFrom: fromDate, validUntil: untilDate } };
  };

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

  // ── Link rows ── (each edit clears a pending duplicate notice + code errors) ──
  const clearLinkNotices = () => { setLinkDup(null); setDupCodes(new Set()); setDupUrls(new Set()); setError(null); };
  const setLinkUrl = (i: number, url: string) => { clearLinkNotices(); setLinkRows((p) => withTrailingLink(p.map((r, idx) => (idx === i ? { ...r, url } : r)))); };
  const setLinkCode = (i: number, code: string) => { clearLinkNotices(); setLinkRows((p) => p.map((r, idx) => (idx === i ? { ...r, code } : r))); };
  const removeLinkAt = (i: number) => { clearLinkNotices(); setLinkRows((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i))); };
  const pasteLinks = (text: string): boolean => {
    clearLinkNotices();
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
    const bv = resolveBatchValidity();
    if (!bv.ok) { setError(bv.err); return; }
    setBatchValidity(bv.v);
    // Combine duplicates into one (keep first occurrence); the preview reports how
    // many were removed before the admin accepts.
    const unique = Array.from(new Set(filledBarcodes));
    setPreviewDup(filledBarcodes.length - unique.length);
    setPreviewValues(unique);
  };
  const finishLinks = () => {
    setError(null);
    setDupCodes(new Set());
    setDupUrls(new Set());
    if (filledLinks.length === 0) { setError(t('vi_errLinksEmpty')); return; }
    const bv = resolveBatchValidity();
    if (!bv.ok) { setError(bv.err); return; }
    if (filledLinks.some((r) => !isHttpUrl(r.url))) { setError(t('vi_errLinksInvalid')); return; }
    if (filledLinks.some((r) => !isSafeCode(r.code))) { setError(t('vi_errCodeInvalid')); return; }
    // Combine duplicate URLs into one (first row wins, keeping its code).
    const seen = new Set<string>();
    const uniqueRows = filledLinks.filter((r) => { const u = r.url.trim(); if (seen.has(u)) return false; seen.add(u); return true; });
    // A code may not be shared across DIFFERENT links - that is a hard error,
    // never an upload. Flag the offending codes (red border) and name them.
    const conflicts = findDuplicateCodes(uniqueRows);
    if (conflicts.size > 0) {
      setDupCodes(conflicts);
      setError(t('vi_errCodeDup').replace('{codes}', Array.from(conflicts).join(', ')));
      return;
    }
    const removed = filledLinks.length - uniqueRows.length;
    // First click with duplicates: flag the repeated link rows (red border), show
    // the count, and wait for a confirming click to combine them.
    if (removed > 0 && !linkDup) { setDupUrls(findDuplicateUrls(filledLinks)); setLinkDup({ removed, unique: uniqueRows.length }); return; }
    onConfirm({ kind: 'link', links: uniqueRows.map((r) => ({ url: r.url.trim(), ...(r.code.trim() ? { code: r.code.trim() } : {}) })), ...bv.v });
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

            {/* Per-batch validity: stamped onto every code added in this batch. */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('vi_batchValidityTitle')}
                <FieldTooltip fieldKey="batchValidity" />
              </p>
              {validityType === 'limit' ? (
                <div className="flex gap-2" dir="ltr">
                  <input
                    type="number" min="1" step="1" value={limitValue}
                    onChange={(e) => setLimitValue(e.target.value)} onWheel={(e) => e.currentTarget.blur()}
                    disabled={busy} className={`w-24 ${inputCls}`} aria-label={t('vi_batchValidFor')}
                  />
                  <select
                    value={limitUnit} onChange={(e) => setLimitUnit(e.target.value as 'days' | 'months' | 'years')}
                    disabled={busy} className={`flex-1 ${inputCls}`} aria-label={t('vi_batchValidFor')}
                  >
                    <option value="days">{t('co_validityUnitDays')}</option>
                    <option value="months">{t('co_validityUnitMonths')}</option>
                    <option value="years">{t('co_validityUnitYears')}</option>
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                    {t('vi_batchValidFrom')}
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                      disabled={busy} dir="ltr" className={`mt-1 ${inputCls}`} />
                  </label>
                  <label className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                    {t('vi_batchValidUntil')}
                    <input type="date" value={untilDate} min={fromDate || undefined} onChange={(e) => setUntilDate(e.target.value)}
                      disabled={busy} dir="ltr" className={`mt-1 ${inputCls}`} />
                  </label>
                </div>
              )}
              <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                {validityType === 'limit' ? t('vi_batchValidityHintLimit') : t('vi_batchValidityHintFromUntil')}
              </p>
              {showAdvisory && (
                <p className="mt-2 rounded-md bg-amber-50 dark:bg-amber-900/20 p-2 text-xs text-amber-700 dark:text-amber-400">
                  {t('vi_legalAdvisory')}
                </p>
              )}
            </div>

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
                      placeholder="https://..." disabled={busy}
                      aria-invalid={row.url.trim() !== '' && dupUrls.has(row.url.trim())}
                      className={cn(inputCls,
                        row.url.trim() !== '' && dupUrls.has(row.url.trim()) && 'border-red-500 focus:border-red-500 dark:border-red-500')} />
                    <input value={row.code} onChange={(e) => setLinkCode(i, e.target.value)}
                      placeholder={t('vi_linkCodePlaceholder')} disabled={busy}
                      aria-invalid={row.code.trim() !== '' && dupCodes.has(row.code.trim())}
                      className={cn(inputCls, 'max-w-[40%]',
                        row.code.trim() !== '' && dupCodes.has(row.code.trim()) && 'border-red-500 focus:border-red-500 dark:border-red-500')} />
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
          onConfirm={() => { onConfirm({ kind: 'barcode', values: previewValues, ...(batchValidity ?? {}) }); setPreviewValues(null); }}
          onCancel={() => { setPreviewValues(null); setPreviewDup(0); }}
        />
      )}
    </>
  );
}
