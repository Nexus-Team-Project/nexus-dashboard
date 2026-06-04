/**
 * LogoSettingsCard - Settings section to manage the organization logo.
 *
 * Shows the CURRENT logo (or name initials). "Replace" opens the square crop
 * modal and previews the NEW crop beside the current one before Save (uploads to
 * Cloudinary). "Remove" clears the logo back to initials. Refreshes /api/me so
 * the header avatar + wallet reflect the change.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { tenantLogoApi } from '../../lib/api';
import TenantLogo from '../common/TenantLogo';
import LogoCropUpload from '../common/LogoCropUpload';
import InfoTooltip from '../common/InfoTooltip';

export default function LogoSettingsCard() {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const { me, reloadMe } = useAuth();
  const tenantName = me?.context.tenantName ?? '';
  const currentLogo = me?.context.tenantLogoUrl ?? null;

  const [newBlob, setNewBlob] = useState<Blob | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const c = isHe
    ? {
        title: 'לוגו הארגון', desc: 'הלוגו שמוצג לחברים באפליקציה. ללא לוגו - מוצגות ראשי התיבות של שם הארגון.',
        current: 'נוכחי', neu: 'חדש', replace: 'החלפת לוגו', remove: 'הסרה', save: 'שמירה', saving: 'שומר...', cancel: 'ביטול',
        saved: 'הלוגו עודכן', removed: 'הלוגו הוסר', failed: 'הפעולה נכשלה', invalidType: 'פורמט לא נתמך (PNG/JPG/WEBP)', tooLarge: 'הקובץ גדול מדי (עד 5MB)',
        tip: 'העלו לוגו מרובע (מומלץ 512×512 פיקסלים), עדיף PNG עם רקע שקוף - כך הלוגו נראה חד בכל מקום. עד 5MB. פורמטים: PNG, JPG, WEBP.',
      }
    : {
        title: 'Organization logo', desc: 'Shown to members in the app. With no logo, the organization-name initials are used.',
        current: 'Current', neu: 'New', replace: 'Replace logo', remove: 'Remove', save: 'Save', saving: 'Saving...', cancel: 'Cancel',
        saved: 'Logo updated', removed: 'Logo removed', failed: 'Action failed', invalidType: 'Unsupported format (PNG/JPG/WEBP)', tooLarge: 'File too large (max 5MB)',
        tip: 'Upload a square logo (recommended 512×512 px), ideally a transparent PNG so it stays crisp everywhere. Max 5MB. Formats: PNG, JPG, WEBP.',
      };

  const onError = (code: 'invalid_type' | 'too_large'): void =>
    toast.error(code === 'too_large' ? c.tooLarge : c.invalidType);

  const cancelNew = (): void => {
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewBlob(null);
    setNewPreview(null);
  };

  const save = async (): Promise<void> => {
    if (!newBlob) return;
    setBusy(true);
    try {
      await tenantLogoApi.upload(newBlob);
      await reloadMe();
      toast.success(c.saved);
      cancelNew();
    } catch {
      toast.error(c.failed);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (): Promise<void> => {
    setBusy(true);
    try {
      await tenantLogoApi.remove();
      await reloadMe();
      toast.success(c.removed);
    } catch {
      toast.error(c.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-10">
      <h2 className="mb-1 flex items-center text-xl font-bold text-slate-900 dark:text-white">
        {c.title}
        <InfoTooltip text={c.tip} />
      </h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{c.desc}</p>

      <div className="max-w-md rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-card-dark">
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center gap-1.5">
            <TenantLogo name={tenantName || 'N'} logoUrl={currentLogo} size={72} rounded="rounded-2xl" />
            <span className="text-[11px] text-slate-400">{c.current}</span>
          </div>
          {newPreview && (
            <>
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 shrink-0 text-slate-300 ${isHe ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <div className="flex flex-col items-center gap-1.5">
                <img src={newPreview} alt={c.neu} className="h-[72px] w-[72px] rounded-2xl bg-white object-contain ring-2 ring-primary" />
                <span className="text-[11px] font-semibold text-primary">{c.neu}</span>
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {newBlob ? (
            <>
              <button type="button" onClick={() => void save()} disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50">
                {busy ? c.saving : c.save}
              </button>
              <button type="button" onClick={cancelNew} disabled={busy} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {c.cancel}
              </button>
            </>
          ) : (
            <>
              <LogoCropUpload onCropped={(b, p) => { setNewBlob(b); setNewPreview(p); }} onError={onError}>
                {(open) => (
                  <button type="button" onClick={open} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90">
                    {c.replace}
                  </button>
                )}
              </LogoCropUpload>
              {currentLogo && (
                <button type="button" onClick={() => void remove()} disabled={busy} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900">
                  {c.remove}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
