/**
 * OfferVisibilityCard: the right-column sidebar of the Create Offer form.
 *
 * Non-platform-admins choose ecosystem vs tenant_only (ecosystem requires
 * completed business setup + NEXUS approval); platform admins see a short note
 * because they always create ecosystem offers. Extracted from CreateOffer to
 * keep that page under the 350-line limit. Presentation only — visibility
 * state is owned by the parent.
 */
import { useId } from 'react';
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
  // Unique radio-group name per instance. This card is rendered twice on the
  // Create Offer page (top + bottom); a shared name="visibility" would make the
  // browser treat all four radios as ONE native group, so only the last-painted
  // card would show a selection. useId() gives each mount its own group.
  const groupName = useId();
  // In development the ecosystem option is available without completed business setup
  // so the global-upload flow can be tested. import.meta.env.DEV is false in prod builds.
  const ecosystemEnabled = businessSetupComplete || import.meta.env.DEV;

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
          <label className={`flex items-start gap-3 ${!ecosystemEnabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <input
              type="radio" name={groupName} value="ecosystem"
              checked={visibility === 'ecosystem'}
              onChange={() => ecosystemEnabled && setVisibility('ecosystem')}
              disabled={isSubmitting || !ecosystemEnabled}
              className="mt-0.5 accent-primary"
            />
            <span>
              <span className="block text-sm font-medium text-slate-700">{t('co_visAllTenants')}</span>
              <span className="mt-0.5 block text-xs text-amber-600">
                {businessSetupComplete
                  ? t('co_visEcosystemApproval')
                  : import.meta.env.DEV
                    ? (language === 'he' ? 'מצב פיתוח: מאופשר ללא הגדרת עסק' : 'Dev only: enabled without business setup')
                    : (language === 'he' ? 'יש להשלים הגדרת עסק כדי לפרסם לכל הפלטפורמה' : 'Complete business setup to publish to the full platform')}
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio" name={groupName} value="tenant_only"
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
