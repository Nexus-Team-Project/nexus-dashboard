/**
 * OfferUploaderBadge - a small "uploaded by <org>" chip shown on Benefits
 * Partnerships cards + table rows. Renders the uploading tenant's logo (image)
 * or its initials on the brand color, plus the org name. Presentational only.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import { buildOfferImageUrl, type ImageCrop } from '../../lib/cloudinaryImage';

interface OfferUploaderBadgeProps {
  /** Uploading tenant's org name (NEXUS for platform-created offers). */
  name?: string;
  /** Uploading tenant's logo URL (pristine), when set. */
  logoUrl?: string;
  /** Uploading tenant's logo crop (normalized fractions), applied at display time. */
  logoCrop?: ImageCrop | null;
  /** Uploading tenant's brand color, used for the initials fallback background. */
  brandColor?: string;
  /** Extra classes for spacing in the host layout. */
  className?: string;
  /** Prefix the name with "by" (cards). Off in a dedicated column whose header labels it. */
  showPrefix?: boolean;
}

export default function OfferUploaderBadge({ name, logoUrl, logoCrop, brandColor, className, showPrefix = true }: OfferUploaderBadgeProps) {
  const { t } = useLanguage();
  if (!name) return null;
  const initials = name.trim().slice(0, 2).toUpperCase();
  return (
    <span className={`inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 ${className ?? ''}`}>
      {logoUrl ? (
        <img
          src={buildOfferImageUrl(logoUrl, logoCrop ?? null, 'full')}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full bg-white object-cover ring-1 ring-slate-200 dark:ring-slate-700"
        />
      ) : (
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: brandColor || '#64748b' }}
          aria-hidden="true"
        >
          {initials}
        </span>
      )}
      <span className="truncate">{showPrefix ? `${t('bp_uploadedBy')} ${name}` : name}</span>
    </span>
  );
}
