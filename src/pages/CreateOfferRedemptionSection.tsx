/**
 * CreateOfferRedemptionSection: renders the "Redemption Details" card within the
 * CreateOffer form. Extracted to keep CreateOffer.tsx under the 350-line limit.
 *
 * All state lives in the parent (CreateOffer) and is passed down as controlled props,
 * so the parent remains the single source of truth for the form payload.
 */
import type { Dispatch, SetStateAction } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import FieldTooltip from '../components/FieldTooltip';

// ─── Props ────────────────────────────────────────────────────────────────────

/**
 * Props for the redemption details section.
 *
 * All string/array values are controlled (read from parent state).
 * All setter functions update the corresponding parent state.
 */
interface RedemptionSectionProps {
  /** URL where members can redeem the offer. */
  implementationLink: string;
  /** Setter for implementationLink. */
  setImplementationLink: (v: string) => void;
  /** Step-by-step instructions for members. */
  implementationInstructions: string;
  /** Setter for implementationInstructions. */
  setImplementationInstructions: (v: string) => void;
  /** ISO date string representing when the offer expires. */
  validUntil: string;
  /** Setter for validUntil. */
  setValidUntil: (v: string) => void;
  /** Terms and conditions text. */
  terms: string;
  /** Setter for terms. */
  setTerms: (v: string) => void;
  /** Current text being typed into the tag input field. */
  tagInput: string;
  /** Setter for tagInput. */
  setTagInput: (v: string) => void;
  /** List of confirmed tags (max 10). */
  tags: string[];
  /** Setter for tags. */
  setTags: Dispatch<SetStateAction<string[]>>;
  /** Whether the parent form is submitting - disables all inputs. */
  isSubmitting: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Redemption Details card section for the CreateOffer form.
 *
 * Input: controlled props for all redemption fields and their setters.
 * Output: renders a card section with inputs for URL, instructions, expiry,
 *         terms, and a tag input with add/remove chip UI.
 */
const CreateOfferRedemptionSection = ({
  implementationLink,
  setImplementationLink,
  implementationInstructions,
  setImplementationInstructions,
  validUntil,
  setValidUntil,
  terms,
  setTerms,
  tagInput,
  setTagInput,
  tags,
  setTags,
  isSubmitting,
}: RedemptionSectionProps) => {
  const { t } = useLanguage();

  /**
   * Attempts to add the current tagInput value as a new tag.
   * Silently ignores duplicates and enforces a 10-tag limit.
   * Input: none - reads tagInput and tags from props.
   * Output: updates tags and clears tagInput via setters.
   */
  const addTag = () => {
    const v = tagInput.trim();
    if (v && tags.length < 10 && !tags.includes(v)) {
      setTags((prev) => [...prev, v]);
      setTagInput('');
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
      <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
        {t('co_sectionRedemption')}
      </h2>

      {/* Implementation link - URL where members redeem the offer */}
      <div className="mb-4">
        <label
          htmlFor="offer-impl-link"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {t('co_fieldImplLink')}
          <span className="font-normal text-slate-400 ms-1 me-0.5">{t('co_optional')}</span>
          <FieldTooltip fieldKey="implementationLink" />
        </label>
        <input
          id="offer-impl-link"
          type="url"
          value={implementationLink}
          onChange={(e) => setImplementationLink(e.target.value)}
          placeholder="https://..."
          disabled={isSubmitting}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Implementation instructions - step-by-step guide for members */}
      <div className="mb-4">
        <label
          htmlFor="offer-impl-instructions"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {t('co_fieldImplInstructions')}
          <span className="font-normal text-slate-400 ms-1 me-0.5">{t('co_optional')}</span>
          <FieldTooltip fieldKey="implementationInstructions" />
        </label>
        <textarea
          id="offer-impl-instructions"
          value={implementationInstructions}
          onChange={(e) => setImplementationInstructions(e.target.value)}
          placeholder={t('co_implInstructionsPlaceholder')}
          rows={3}
          disabled={isSubmitting}
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Valid until - expiry date picker */}
      <div className="mb-4">
        <label
          htmlFor="offer-valid-until"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {t('co_fieldValidUntil')}
          <span className="font-normal text-slate-400 ms-1 me-0.5">{t('co_optional')}</span>
          <FieldTooltip fieldKey="validUntil" />
        </label>
        <input
          id="offer-valid-until"
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Terms and conditions text */}
      <div className="mb-4">
        <label
          htmlFor="offer-terms"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {t('co_fieldTerms')}
          <span className="font-normal text-slate-400 ms-1 me-0.5">{t('co_optional')}</span>
          <FieldTooltip fieldKey="terms" />
        </label>
        <textarea
          id="offer-terms"
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          placeholder={t('co_termsPlaceholder')}
          rows={3}
          disabled={isSubmitting}
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* Tags - up to 10 searchable labels; press Enter or comma to add */}
      <div>
        <label htmlFor="offer-tag-input" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('co_fieldTags')}
          <span className="font-normal text-slate-400 ms-1 me-0.5">{t('co_optional')}</span>
          <FieldTooltip fieldKey="tags" />
        </label>
        <div className="flex gap-2 mb-2">
          <input
            id="offer-tag-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={t('co_tagsPlaceholder')}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:opacity-60"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-50 transition-colors"
          >
            {t('co_addTag')}
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((tg) => tg !== tag))}
                  className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove tag ${tag}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CreateOfferRedemptionSection;
