/**
 * BrandColorPicker - pick an organization brand color with real RGB.
 *
 * Combines a native color input (full RGB wheel), a free-text hex field, and a
 * row of one-tap preset swatches. Fully controlled: the parent owns the current
 * hex value and receives every committed change via onChange.
 */
import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { BRAND_COLOR_PRESETS, normalizeHex } from '../../lib/brandColor';
import { cn } from '../../lib/utils';

interface BrandColorPickerProps {
  /** Current color as a "#rrggbb" hex. */
  value: string;
  /** Called with a normalized "#rrggbb" hex whenever the user picks a color. */
  onChange: (hex: string) => void;
  /** Optional extra classes for the outer wrapper. */
  className?: string;
}

export default function BrandColorPicker({ value, onChange, className }: BrandColorPickerProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';

  // Local text state lets the user type a partial hex without the parent
  // rejecting it mid-edit; we only push up once it is a complete color.
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  const commitText = (raw: string): void => {
    setText(raw);
    const hex = normalizeHex(raw);
    if (hex) onChange(hex);
  };

  const t = isHe
    ? { hex: 'קוד צבע', presets: 'צבעים מהירים' }
    : { hex: 'Hex code', presets: 'Quick colors' };

  return (
    <div className={cn('flex flex-col gap-3', className)} dir={isHe ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        {/* Native RGB picker - the swatch itself opens the OS color wheel. */}
        <label
          className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700"
          style={{ background: value }}
          aria-label={isHe ? 'בחירת צבע' : 'Pick a color'}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value.toLowerCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>

        {/* Free-text hex field for users who know the exact brand color. */}
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.hex}
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => commitText(e.target.value)}
            spellCheck={false}
            maxLength={7}
            placeholder="#635bff"
            dir="ltr"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* One-tap presets. */}
      <div>
        <span className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
          {t.presets}
        </span>
        <div className="flex flex-wrap gap-2">
          {BRAND_COLOR_PRESETS.map((hex) => {
            const active = value.toLowerCase() === hex.toLowerCase();
            return (
              <button
                key={hex}
                type="button"
                onClick={() => onChange(hex)}
                aria-label={hex}
                aria-pressed={active}
                className={cn(
                  'h-8 w-8 rounded-full border transition-transform hover:scale-110',
                  active
                    ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2 dark:border-white dark:ring-white dark:ring-offset-slate-900'
                    : 'border-black/10 dark:border-white/20',
                )}
                style={{ background: hex }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
