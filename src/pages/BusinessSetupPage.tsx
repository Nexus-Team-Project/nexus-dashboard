import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SetupSidebar from '../components/business-setup/SetupSidebar';
import BusinessTypeStep from '../components/business-setup/steps/BusinessTypeStep';
import TaxDetailsStep from '../components/business-setup/steps/TaxDetailsStep';
import BusinessDetailsStep from '../components/business-setup/steps/BusinessDetailsStep';
import ProductsServicesStep from '../components/business-setup/steps/ProductsServicesStep';
import BusinessRepresentativeStep from '../components/business-setup/steps/BusinessRepresentativeStep';
import BusinessOwnersStep from '../components/business-setup/steps/BusinessOwnersStep';
import BankAccountStep from '../components/business-setup/steps/BankAccountStep';
import PublicDetailsStep from '../components/business-setup/steps/PublicDetailsStep';
import DocumentUploadStep from '../components/business-setup/steps/DocumentUploadStep';
import AccountSecurityStep from '../components/business-setup/steps/AccountSecurityStep';
import ReviewSubmitStep from '../components/business-setup/steps/ReviewSubmitStep';
import {
  type SubStepId,
  type BusinessSetupData,
  createEmptyFormData,
  getNextStep,
  getPrevStep,
  STEP_ORDER,
} from '../components/business-setup/types';
import { useLanguage } from '../i18n/LanguageContext';

const STORAGE_KEY = 'nexus_business_setup';

function loadState(): { currentStep: SubStepId; completedSteps: string[]; formData: BusinessSetupData } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveState(currentStep: SubStepId, completedSteps: Set<string>, formData: BusinessSetupData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentStep,
    completedSteps: [...completedSteps],
    formData,
  }));
}

export default function BusinessSetupPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const saved = loadState();

  const [currentStep, setCurrentStep] = useState<SubStepId>(saved?.currentStep ?? 'business_type');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    () => new Set(saved?.completedSteps ?? [])
  );
  const [formData, setFormData] = useState<BusinessSetupData>(
    () => saved?.formData ?? createEmptyFormData()
  );

  // Persist on every change
  useEffect(() => {
    saveState(currentStep, completedSteps, formData);
  }, [currentStep, completedSteps, formData]);

  const updateFormData = useCallback((patch: Partial<BusinessSetupData>) => {
    setFormData(prev => ({ ...prev, ...patch }));
  }, []);

  const handleContinue = useCallback(() => {
    // Mark current step as completed
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.add(currentStep);
      return next;
    });
    // Go to next step
    const next = getNextStep(currentStep);
    if (next) {
      setCurrentStep(next);
    } else {
      // All done — log data & return
      console.log('📋 Business Setup Data:', formData);
      navigate('/');
    }
  }, [currentStep, formData, navigate]);

  const handleBack = useCallback(() => {
    const prev = getPrevStep(currentStep);
    if (prev) setCurrentStep(prev);
  }, [currentStep]);

  const handleStepClick = useCallback((stepId: SubStepId) => {
    setCurrentStep(stepId);
  }, []);

  const handleClose = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Progress calculation
  const totalSteps = STEP_ORDER.length;
  const doneCount = completedSteps.size;
  const progressPct = Math.round((doneCount / totalSteps) * 100);

  const isFirstStep = currentStep === STEP_ORDER[0];

  // Render the active step form
  const renderStep = () => {
    const props = { data: formData, onChange: updateFormData };
    switch (currentStep) {
      case 'business_type': return <BusinessTypeStep {...props} />;
      case 'tax_details': return <TaxDetailsStep {...props} />;
      case 'business_details': return <BusinessDetailsStep {...props} />;
      case 'products_services': return <ProductsServicesStep {...props} />;
      case 'business_representative': return <BusinessRepresentativeStep {...props} />;
      case 'business_owners': return <BusinessOwnersStep {...props} />;
      case 'bank_account': return <BankAccountStep {...props} />;
      case 'public_details': return <PublicDetailsStep {...props} />;
      case 'document_upload': return <DocumentUploadStep {...props} />;
      case 'account_security': return <AccountSecurityStep {...props} />;
      case 'review_submit': return <ReviewSubmitStep {...props} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gray-50 flex flex-col">
      {/* ── Top header bar ─────────────────────────────────────── */}
      <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-rounded !text-[20px]">close</span>
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <h1 className="text-[15px] font-semibold text-gray-900">{t('bsg_activateAccount')}</h1>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="text-xs font-medium">{progressPct}% {t('bsp_progressCompleted')}</span>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {/* ── Body: sidebar + content ────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <SetupSidebar
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {/* Scrollable form area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto py-10 px-8">
              {renderStep()}
            </div>
          </div>

          {/* Footer with nav buttons */}
          <div className="shrink-0 border-t border-gray-200 bg-white px-8 py-4 flex items-center justify-between">
            <div>
              {!isFirstStep && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  <span className="material-symbols-rounded !text-[18px] ltr:rotate-180">arrow_forward</span>
                  <span>{t('bsp_back')}</span>
                </button>
              )}
            </div>

            <button
              onClick={handleContinue}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              <span>{currentStep === 'review_submit' ? t('bsp_submit') : t('bsp_continue')}</span>
              {currentStep !== 'review_submit' && (
                <span className="material-symbols-rounded !text-[18px] ltr:rotate-180">arrow_back</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
