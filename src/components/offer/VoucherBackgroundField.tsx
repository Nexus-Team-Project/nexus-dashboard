/**
 * VoucherBackgroundField: the voucher-only "Image | Color" background chooser.
 *
 * A voucher card background can be EITHER a single cover image OR a solid color,
 * and the two are mutually exclusive (switching mode clears the other side).
 * Both are optional — leaving Image mode with no image (and no color) means the
 * card later falls back to the tenant logo + brand color at render time.
 *
 * The mode is owned by the parent (so the Edit page can initialize it from the
 * loaded offer). This component performs the clearing when the mode switches:
 * entering Color clears the gallery (revoking new-file preview URLs); entering
 * Image clears the color. Reuses `OfferImageGallery` and `BrandColorPicker`.
 */
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';
import FieldTooltip from '../FieldTooltip';
import OfferImageGallery, { type GalleryItem } from './OfferImageGallery';
import BrandColorPicker from '../common/BrandColorPicker';

export type BgMode = 'image' | 'color';

interface VoucherBackgroundFieldProps {
  /** Active background mode. */
  mode: BgMode;
  /** Setter for the mode (parent-owned so Edit can initialize it). */
  setMode: (m: BgMode) => void;
  /** Gallery state (image mode). Capped at 1 for vouchers. */
  gallery: GalleryItem[];
  /** Gallery setter. */
  setGallery: (next: GalleryItem[]) => void;
  /** Background color ("#rrggbb" or '' when none). Color mode. */
  color: string;
  /** Color setter. */
  setColor: (hex: string) => void;
  /** Fallback color shown when entering color mode with no color yet (tenant brand color). */
  defaultColor: string;
  /** Disables controls while the parent form is submitting. */
  disabled?: boolean;
}

/**
 * Renders the mode chooser and the active editor (gallery or color picker).
 *
 * Input: mode + setMode, gallery + setGallery, color + setColor, defaultColor, disabled.
 * Output: a card with an "Image | Color" segmented control and the chosen editor.
 */
export default function VoucherBackgroundField({
  mode,
  setMode,
  gallery,
  setGallery,
  color,
  setColor,
  defaultColor,
  disabled = false,
}: VoucherBackgroundFieldProps) {
  const { t } = useLanguage();

  /**
   * Switches background mode and clears the other side so image and color stay
   * mutually exclusive. Entering color seeds a starting color when none is set.
   */
  const switchMode = (next: BgMode): void => {
    if (next === mode) return;
    if (next === 'color') {
      gallery.forEach((it) => { if (it.kind === 'new') URL.revokeObjectURL(it.previewUrl); });
      setGallery([]);
      if (!color) setColor(defaultColor);
    } else {
      setColor('');
    }
    setMode(next);
  };

  const modes: { key: BgMode; label: string }[] = [
    { key: 'image', label: t('co_voucherBgModeImage') },
    { key: 'color', label: t('co_voucherBgModeColor') },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-base font-semibold text-slate-800 dark:text-white">{t('of_sectionImages')}</h2>
        <FieldTooltip fieldKey="voucherBackground" />
      </div>

      <div className="mb-4 inline-flex gap-2" role="group" aria-label={t('fi_voucherBackground_label')}>
        {modes.map((m) => {
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => switchMode(m.key)}
              className={cn(
                'min-w-[5rem] rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                active
                  ? 'border-primary bg-primary text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {mode === 'image' ? (
        <OfferImageGallery value={gallery} onChange={setGallery} maxImages={1} disabled={disabled} />
      ) : (
        <BrandColorPicker value={color || defaultColor} onChange={setColor} />
      )}

      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">{t('co_voucherBgHint')}</p>
    </section>
  );
}
