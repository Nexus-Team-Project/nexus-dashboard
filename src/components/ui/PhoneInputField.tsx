/**
 * Accessible phone number input built on react-international-phone's headless
 * usePhoneInput hook. Renders a portal-based searchable country dropdown and
 * a formatted phone input. Fully Tailwind-styled, RTL-aware, and self-validating.
 *
 * Exports:
 *   PhoneInputField   – the rendered component
 *   isPhoneComplete   – validator usable by parent canContinue checks
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  defaultCountries,
  FlagImage,
  parseCountry,
  usePhoneInput,
  type CountryIso2,
  type ParsedCountry,
} from 'react-international-phone';
import 'react-international-phone/style.css';

// ── Preferred countries shown at the top of the dropdown ─────────────────
const PREFERRED_COUNTRIES: CountryIso2[] = ['il', 'us', 'gb', 'de', 'fr', 'ae', 'sa'];

/**
 * Parses every country entry and produces a sorted list: preferred first,
 * then the rest alphabetically.
 */
const ALL_COUNTRIES: ParsedCountry[] = (() => {
  const parsed = defaultCountries.map(parseCountry);
  const preferred = PREFERRED_COUNTRIES
    .map(iso2 => parsed.find(c => c.iso2 === iso2))
    .filter(Boolean) as ParsedCountry[];
  const rest = parsed
    .filter(c => !PREFERRED_COUNTRIES.includes(c.iso2))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...preferred, ...rest];
})();

/**
 * Returns true when the E164 phone value is complete for the given country.
 * Uses the country's format mask to count expected digit slots.
 * Input: E164 phone string and the current ParsedCountry.
 * Output: boolean indicating whether the number is fully filled.
 */
export function isPhoneComplete(phone: string, country: ParsedCountry): boolean {
  if (!phone || phone.length < 5) return false;

  const fmt = country.format;
  let maskDigits = 0;
  if (typeof fmt === 'string') {
    maskDigits = (fmt.match(/\./g) ?? []).length;
  } else if (fmt && typeof fmt === 'object') {
    const def = (fmt as Record<string, string>).default ?? '';
    maskDigits = (def.match(/\./g) ?? []).length;
  }

  const actualDigits = phone.replace(/\D/g, '').length;
  if (maskDigits === 0) return actualDigits >= 8;
  return actualDigits >= maskDigits;
}

// ── Country Dropdown ──────────────────────────────────────────────────────

interface CountryDropdownProps {
  country: ParsedCountry;
  onSelect: (iso2: CountryIso2) => void;
  searchPlaceholder: string;
}

/**
 * Portal-based searchable country dropdown anchored to the flag button.
 * Uses fixed positioning to escape any overflow clipping from parent containers.
 */
function CountryDropdown({ country, onSelect, searchPlaceholder }: CountryDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = ALL_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dialCode.includes(search) ||
    c.iso2.includes(search.toLowerCase()),
  );

  const recalc = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 260),
      zIndex: 99999,
    });
  };

  useLayoutEffect(() => {
    if (open) recalc();
    else setSearch('');
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const scroll = () => recalc();
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(p => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-full cursor-pointer items-center gap-2 rounded-s-lg border border-e-0 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/30"
      >
        <FlagImage iso2={country.iso2} size="20px" />
        <span className="tabular-nums">+{country.dialCode}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="shrink-0 text-slate-400">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
        >
          {/* Search */}
          <div className="border-b border-slate-100 p-2">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Country list */}
          <ul role="listbox" className="max-h-52 overflow-y-auto">
            {filtered.map(c => (
              <li key={`${c.iso2}-${c.dialCode}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={country.iso2 === c.iso2}
                  onClick={() => { onSelect(c.iso2); setOpen(false); }}
                  className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-slate-50 ${country.iso2 === c.iso2 ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-700'}`}
                >
                  <FlagImage iso2={c.iso2} size="18px" />
                  <span className="min-w-0 flex-1 truncate text-start">{c.name}</span>
                  <span className="shrink-0 tabular-nums text-slate-400">+{c.dialCode}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-center text-[13px] text-slate-400">
                {searchPlaceholder === 'Search country' ? 'No results' : 'אין תוצאות'}
              </li>
            )}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ── PhoneInputField ───────────────────────────────────────────────────────

export interface PhoneInputFieldProps {
  /** E164 phone value (e.g. "+972508465858"). */
  value: string;
  /** Default country iso2 shown before user interacts. */
  defaultCountry?: CountryIso2;
  /** Called whenever the phone value or validity changes. */
  onChange: (phone: string, isValid: boolean) => void;
  label: string;
  errorText: string;
  searchPlaceholder: string;
  /** When true, shows error state if the field has been touched and is invalid. */
  touched?: boolean;
  /** When true, renders a required-field asterisk and sets aria-required. */
  required?: boolean;
}

/**
 * Composed phone input: country flag/code dropdown + formatted number field.
 * Uses react-international-phone's usePhoneInput for formatting, masking,
 * and country auto-detection. Validation uses isPhoneComplete.
 * Input: controlled E164 value, onChange callback, and display props.
 * Output: accessible phone input with integrated country selector.
 */
export function PhoneInputField({
  value,
  defaultCountry = 'il',
  onChange,
  label,
  errorText,
  searchPlaceholder,
  touched = false,
  required = false,
}: PhoneInputFieldProps) {
  const { inputValue, phone, country, setCountry, handlePhoneValueChange, inputRef } =
    usePhoneInput({
      defaultCountry,
      value,
      forceDialCode: true,
      preferredCountries: PREFERRED_COUNTRIES,
      onChange: ({ phone: p, country: c }) => {
        onChange(p, isPhoneComplete(p, c));
      },
    });

  const isValid = isPhoneComplete(phone, country);
  const showError = touched && inputValue.length > `+${country.dialCode} `.length && !isValid;

  return (
    <div>
      <label className="block text-[13px] font-medium text-slate-700 mb-1.5">{label}{required && <span aria-hidden="true" className="text-red-500"> *</span>}</label>
      <div className="flex" dir="ltr">
        <CountryDropdown
          country={country}
          onSelect={iso2 => setCountry(iso2, { focusOnInput: true })}
          searchPlaceholder={searchPlaceholder}
        />
        <input
          ref={inputRef}
          type="tel"
          value={inputValue}
          onChange={handlePhoneValueChange}
          aria-required={required}
          dir="ltr"
          className={`min-w-0 flex-1 rounded-e-lg border px-3.5 py-2.5 text-[14px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all ${
            showError
              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
              : 'border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-400'
          }`}
        />
      </div>
      {showError && (
        <p className="mt-1 text-[12px] text-red-500">{errorText}</p>
      )}
    </div>
  );
}
