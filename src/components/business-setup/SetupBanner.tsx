import { useNavigate } from 'react-router-dom';
import { STEP_ORDER } from './types';
import { useLanguage } from '../../i18n/LanguageContext';

const STORAGE_KEY = 'nexus_business_setup';

function getCompletedCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { completedSteps } = JSON.parse(raw);
      return completedSteps?.length ?? 0;
    }
  } catch { /* ignore */ }
  return 0;
}

export default function SetupBanner() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const completedCount = getCompletedCount();
  const total = STEP_ORDER.length;

  // Hide banner when all steps are done
  if (completedCount >= total) return null;

  return (
    <div className="w-full bg-gradient-to-l from-orange-600 via-amber-600 to-orange-600 text-white pb-2">
      <div className="flex items-center justify-between px-5 py-1.5 text-[13px]">
        {/* Start side — label */}
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wide bg-white/20 px-2 py-0.5 rounded text-[11px]">{t('sbn_testEnv')}</span>
          <span className="font-medium">{t('sbn_testEnvMsg')}</span>
        </div>

        {/* End side — CTA */}
        <button
          onClick={() => navigate('/business-setup')}
          className="flex items-center gap-1.5 font-semibold hover:underline underline-offset-2 shrink-0 transition-opacity hover:opacity-90"
        >
          <span>{t('sbn_verifyBusiness')}</span>
          <span className="material-symbols-rounded !text-[16px]">north_east</span>
        </button>
      </div>
    </div>
  );
}
