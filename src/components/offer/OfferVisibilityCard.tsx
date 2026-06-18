/**
 * OfferVisibilityCard: the right-column sidebar of the Create Offer form.
 *
 * Non-platform-admins choose ecosystem vs tenant_only (ecosystem requires
 * completed business setup + NEXUS approval); platform admins see a short note
 * because they always create ecosystem offers. Extracted from CreateOffer to
 * keep that page under the 350-line limit. Presentation only — visibility
 * state is owned by the parent.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import FieldTooltip from '../FieldTooltip';

type OfferVisibility = 'ecosystem' | 'tenant_only';

interface OfferVisibilityCardProps {
  isPlatformAdmin: boolean;
  businessSetupComplete: boolean;
  visibility: OfferVisibility;
  setVisibility: (v: OfferVisibility) => void;
  isSubmitting: boolean;
}

export default function OfferVisibilityCard({
  isPlatformAdmin,
  businessSetupComplete,
  visibility,
  setVisibility,
  isSubmitting,
}: OfferVisibilityCardProps) {
  const { t, language } = useLanguage();

  if (isPlatformAdmin) {
    return (
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-700">
        {t('co_platformNote')}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
        {t('co_sectionVisibility')}
        <FieldTooltip fieldKey="visibility" />
      </h2>
      <fieldset>
        <legend className="sr-only">{t('co_visibilityLegend')}</legend>
        <div className="space-y-4">
          <label className={`flex items-start gap-3 ${!businessSetupComplete ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <input
              type="radio" name="visibility" value="ecosystem"
              checked={visibility === 'ecosystem'}
              onChange={() => businessSetupComplete && setVisibility('ecosystem')}
              disabled={isSubmitting || !businessSetupComplete}
              className="mt-0.5 accent-primary"
            />
            <span>
              <span className="block text-sm font-medium text-slate-700">{t('co_visAllTenants')}</span>
              <span className="mt-0.5 block text-xs text-amber-600">
                {businessSetupComplete
                  ? t('co_visEcosystemApproval')
                  : (language === 'he' ? 'יש להשלים הגדרת עסק כדי לפרסם לכל הפלטפורמה' : 'Complete business setup to publish to the full platform')}
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio" name="visibility" value="tenant_only"
              checked={visibility === 'tenant_only'}
              onChange={() => setVisibility('tenant_only')}
              disabled={isSubmitting}
              className="mt-0.5 accent-primary"
            />
            <span>
              <span className="block text-sm font-medium text-slate-700">{t('co_visMyTenantOnly')}</span>
              <span className="mt-0.5 block text-xs text-green-600">{t('co_visMyTenantNoApproval')}</span>
            </span>
          </label>
        </div>
      </fieldset>
    </section>
  );
}
