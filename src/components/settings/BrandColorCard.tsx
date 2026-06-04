/**
 * BrandColorCard - Settings section to manage the organization brand color.
 *
 * Lets a tenant admin pick the accent color wallet members see the first time
 * they sign in to this tenant's benefits. Shows a small live preview, saves via
 * the brand-color API, and refreshes /api/me so the change is reflected
 * everywhere. "Reset" clears the color so the wallet falls back to a color
 * derived from the tenant id.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { tenantBrandColorApi } from '../../lib/api';
import { DEFAULT_BRAND_COLOR } from '../../lib/brandColor';
import BrandColorPicker from '../common/BrandColorPicker';
import InfoTooltip from '../common/InfoTooltip';

export default function BrandColorCard() {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const { me, reloadMe } = useAuth();
  const tenantName = me?.context.tenantName ?? '';
  const saved = me?.context.tenantBrandColor ?? null;

  // Draft starts from the saved color, or the shared default when none is set.
  const [draft, setDraft] = useState<string>(saved ?? DEFAULT_BRAND_COLOR);
  const [busy, setBusy] = useState(false);

  const dirty = (saved ?? DEFAULT_BRAND_COLOR).toLowerCase() !== draft.toLowerCase();

  const c = isHe
    ? {
        title: 'צבע המותג',
        desc: 'הצבע שמלווה את חברי הארגון באפליקציית הארנק.',
        tip: 'זהו הצבע שמשתמשי הארגון שלך יראו כשהם נכנסים בפעם הראשונה להטבות שלך.',
        preview: 'תצוגה מקדימה', previewCta: 'הצטרפות להטבות', save: 'שמירה', saving: 'שומר...',
        reset: 'איפוס לברירת מחדל', savedMsg: 'צבע המותג עודכן', resetMsg: 'הצבע אופס', failed: 'הפעולה נכשלה',
      }
    : {
        title: 'Brand color',
        desc: "The accent color that follows your members across the wallet app.",
        tip: 'This is the color your organization users will see when logging in for the first time to your benefits.',
        preview: 'Preview', previewCta: 'Join benefits', save: 'Save', saving: 'Saving...',
        reset: 'Reset to default', savedMsg: 'Brand color updated', resetMsg: 'Color reset', failed: 'Action failed',
      };

  const save = async (): Promise<void> => {
    setBusy(true);
    try {
      await tenantBrandColorApi.set(draft);
      await reloadMe();
      toast.success(c.savedMsg);
    } catch {
      toast.error(c.failed);
    } finally {
      setBusy(false);
    }
  };

  const reset = async (): Promise<void> => {
    setBusy(true);
    try {
      await tenantBrandColorApi.set(null);
      await reloadMe();
      setDraft(DEFAULT_BRAND_COLOR);
      toast.success(c.resetMsg);
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
        <BrandColorPicker value={draft} onChange={setDraft} />

        {/* Live mini-preview of the wallet first-login accent. */}
        <div className="mt-5">
          <span className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">{c.preview}</span>
          <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="h-12" style={{ background: draft }} />
            <div className="flex items-center justify-between gap-3 bg-white px-4 py-3 dark:bg-slate-900">
              <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {tenantName || 'Your organization'}
              </span>
              <span
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{ background: draft }}
              >
                {c.previewCta}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy || !dirty}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            {busy ? c.saving : c.save}
          </button>
          {saved && (
            <button
              type="button"
              onClick={() => void reset()}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {c.reset}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
