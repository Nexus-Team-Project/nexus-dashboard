/**
 * ToggleSwitch - a generic, RTL-safe on/off switch.
 *
 * Visual style is copied from the toggle inside ServiceActivationBanner
 * (track h-7 w-14, thumb h-5 w-5, translate-x-7 when ON / translate-x-0.5
 * when OFF, emerald track when ON / slate track when OFF). The `dir="ltr"`
 * wrapper is critical: without it, `translate-x-7` would push the thumb out
 * of the track on RTL (Hebrew) pages.
 *
 * Unlike the banner's toggle, this one exposes a plain controlled API
 * (`checked` + `onChange`) with no confirm flow, so it can be reused for
 * simple boolean settings.
 */

/**
 * Props for the reusable toggle switch.
 * - checked: current on/off state (controlled).
 * - onChange: called with the next boolean when the user toggles.
 * - disabled: when true, the switch is non-interactive and dimmed.
 * - activeColor: tailwind bg-* class for the ON track (default emerald).
 * - aria-label: accessible label describing what the switch controls.
 */
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
  'aria-label'?: string;
}

/**
 * Renders an accessible switch button.
 * Input: ToggleSwitchProps (controlled checked state + onChange handler).
 * Output: a <button role="switch"> whose thumb slides between OFF and ON.
 * Behavior: clicking (when enabled) calls onChange with the inverted value.
 */
export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  activeColor = 'bg-emerald-500',
  'aria-label': ariaLabel,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      dir="ltr"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border-2 border-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80'
      } ${checked ? activeColor : 'bg-slate-300'}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-7' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
