/**
 * Admin filter: offer-type multi-select via chip row.
 *
 * Backed by the shared OFFER_TYPE_OPTIONS so the chip set stays in
 * sync with the member catalog. ANY-of semantics: backend uses $in.
 */
import { useLanguage } from '../../../i18n/LanguageContext';
import { OFFER_TYPE_OPTIONS } from '../catalogFilters';
import { ChipButton } from './ChipButton';

interface AdminOfferTypeFilterProps {
  value: string[];
  onChange: (next: string[]) => void;
}

/** Offer-type filter section (chip row). */
export function AdminOfferTypeFilter({ value, onChange }: AdminOfferTypeFilterProps) {
  const { t, language } = useLanguage();

  const toggle = (type: string) => {
    onChange(value.includes(type) ? value.filter((v) => v !== type) : [...value, type]);
  };

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('bp_filterOfferTypeLabel')}
      </legend>
      <div className="flex flex-wrap gap-2">
        {OFFER_TYPE_OPTIONS.map((opt) => (
          <ChipButton
            key={opt.value}
            isActive={value.includes(opt.value)}
            onClick={() => toggle(opt.value)}
            label={language === 'he' ? opt.he : opt.en}
          />
        ))}
      </div>
    </fieldset>
  );
}
