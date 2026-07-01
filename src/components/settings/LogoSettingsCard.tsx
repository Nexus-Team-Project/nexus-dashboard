/**
 * LogoSettingsCard - Settings section to manage the organization logo.
 *
 * The logo is stored PRISTINE (uncropped) with the crop kept as metadata and
 * applied at display time, so the crop is FREE (any shape) and reversible:
 *   - "Replace logo" uploads a new pristine image + a free crop.
 *   - "Adjust crop" re-crops the current logo WITHOUT re-uploading.
 *   - "Revert to full photo" clears the crop (shows the whole image).
 *   - "Remove" clears the logo back to name initials.
 * Refreshes /api/me so the header avatar reflects the change.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { tenantLogoApi } from '../../lib/api';
import { type ImageCrop } from '../../lib/cloudinaryImage';
import TenantLogo from '../common/TenantLogo';
import LogoCropUpload from '../common/LogoCropUpload';
import ImageCropModal from '../ImageCropModal';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import InfoTooltip from '../common/InfoTooltip';

export default function LogoSettingsCard() {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const { me, reloadMe } = useAuth();
  const tenantName = me?.context.tenantName ?? '';
  const currentLogo = me?.context.tenantLogoUrl ?? null;
  const currentCrop = me?.context.tenantLogoCrop ?? null;

  const [newFile, setNewFile] = useState<File | null>(null);
  const [newCrop, setNewCrop] = useState<ImageCrop | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [confirm, setConfirm] = useState<null | 'remove' | 'revert'>(null);
  const [busy, setBusy] = useState(false);

  const c = isHe
    ? {
        title: 'לוגו הארגון', desc: 'הלוגו שמוצג לחברים באפליקציה. ללא לוגו - מוצגות ראשי התיבות של שם הארגון.',
        current: 'נוכחי', neu: 'חדש', replace: 'החלפת לוגו', adjust: 'עריכת חיתוך', revert: 'חזרה לתמונה המלאה', remove: 'הסרה',
        save: 'שמירה', saving: 'שומר...', cancel: 'ביטול',
        saved: 'הלוגו עודכן', removed: 'הלוגו הוסר', reverted: 'החיתוך בוטל - מוצגת התמונה המלאה', cropUpdated: 'החיתוך עודכן',
        failed: 'הפעולה נכשלה', invalidType: 'פורמט לא נתמך (PNG/JPG/WEBP)', tooLarge: 'הקובץ גדול מדי (עד 5MB)',
        tip: 'העלו לוגו, חתכו אותו כרצונכם (חיתוך חופשי). התמונה המקורית נשמרת - אפשר לשנות את החיתוך או לחזור לתמונה המלאה בכל עת. עד 5MB. פורמטים: PNG, JPG, WEBP.',
        removeTitle: 'להסיר את הלוגו?', removeMsg: 'הלוגו יימחק והחברים יראו את ראשי התיבות של שם הארגון.', removeWarn: 'הפעולה מוחקת את הלוגו מהאחסון ואינה הפיכה.',
        revertTitle: 'לחזור לתמונה המלאה?', revertMsg: 'החיתוך יבוטל והתמונה המלאה תוצג בכל מקום.', confirm: 'אישור',
      }
    : {
        title: 'Organization logo', desc: 'Shown to members in the app. With no logo, the organization-name initials are used.',
        current: 'Current', neu: 'New', replace: 'Replace logo', adjust: 'Adjust crop', revert: 'Revert to full photo', remove: 'Remove',
        save: 'Save', saving: 'Saving...', cancel: 'Cancel',
        saved: 'Logo updated', removed: 'Logo removed', reverted: 'Crop cleared - showing the full photo', cropUpdated: 'Crop updated',
        failed: 'Action failed', invalidType: 'Unsupported format (PNG/JPG/WEBP)', tooLarge: 'File too large (max 5MB)',
        tip: 'Upload a logo and crop it freely (no forced shape). The original photo is kept, so you can adjust the crop or revert to the full photo any time. Max 5MB. Formats: PNG, JPG, WEBP.',
        removeTitle: 'Remove the logo?', removeMsg: 'The logo will be deleted and members will see the organization-name initials.', removeWarn: 'This deletes the logo from storage and cannot be undone.',
        revertTitle: 'Revert to the full photo?', revertMsg: 'The crop will be cleared and the full photo will be shown everywhere.', confirm: 'Confirm',
      };

  const onError = (code: 'invalid_type' | 'too_large'): void => {
    toast.error(code === 'too_large' ? c.tooLarge : c.invalidType);
  };

  const cancelNew = (): void => {
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewFile(null);
    setNewCrop(null);
    setNewPreview(null);
  };

  const save = async (): Promise<void> => {
    if (!newFile) return;
    setBusy(true);
    try {
      await tenantLogoApi.upload(newFile, newCrop);
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

  /** Set or clear the crop of the CURRENT logo without re-uploading. */
  const applyCrop = async (crop: ImageCrop | null, message: string): Promise<void> => {
    setBusy(true);
    try {
      await tenantLogoApi.setCrop(crop);
      await reloadMe();
      toast.success(message);
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
            <TenantLogo name={tenantName || 'N'} logoUrl={currentLogo} logoCrop={currentCrop} size={72} rounded="rounded-2xl" />
            <span className="text-[11px] text-slate-400">{c.current}</span>
          </div>
          {newPreview && (
            <>
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 shrink-0 text-slate-300 ${isHe ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
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
          {newFile ? (
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
              <LogoCropUpload onCropped={(f, crop, p) => { setNewFile(f); setNewCrop(crop); setNewPreview(p); }} onError={onError}>
                {(open) => (
                  <button type="button" onClick={open} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90">
                    {c.replace}
                  </button>
                )}
              </LogoCropUpload>
              {currentLogo && (
                <button type="button" onClick={() => setAdjusting(true)} disabled={busy} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {c.adjust}
                </button>
              )}
              {currentLogo && currentCrop && (
                <button type="button" onClick={() => setConfirm('revert')} disabled={busy} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {c.revert}
                </button>
              )}
              {currentLogo && (
                <button type="button" onClick={() => setConfirm('remove')} disabled={busy} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900">
                  {c.remove}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Adjust the crop of the current (already-uploaded) logo without re-uploading. */}
      {adjusting && currentLogo && (
        <ImageCropModal
          src={currentLogo}
          allowFullImage
          initialCrop={currentCrop}
          onCropMeta={(crop) => { setAdjusting(false); void applyCrop(crop, c.cropUpdated); }}
          onCancel={() => setAdjusting(false)}
        />
      )}

      {/* Confirm the destructive/reset actions (Remove logo, Revert to full photo). */}
      {confirm === 'remove' && (
        <ConfirmDeleteModal
          title={c.removeTitle}
          message={c.removeMsg}
          warning={c.removeWarn}
          confirmLabel={c.remove}
          cancelLabel={c.cancel}
          isDeleting={busy}
          onConfirm={() => { void remove().then(() => setConfirm(null)); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'revert' && (
        <ConfirmDeleteModal
          title={c.revertTitle}
          message={c.revertMsg}
          confirmLabel={c.confirm}
          cancelLabel={c.cancel}
          isDeleting={busy}
          onConfirm={() => { void applyCrop(null, c.reverted).then(() => setConfirm(null)); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
