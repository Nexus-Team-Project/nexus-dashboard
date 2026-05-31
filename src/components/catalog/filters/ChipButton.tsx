/**
 * Pill-shaped chip button used by every section of the admin
 * Benefits & Partnerships filter panel.
 *
 * Visual language matches the Stripe-inspired admin panels
 * (Transactions / Users): rounded pill, neutral inactive state,
 * #635bff active state. Uses the admin filter palette (active accent),
 * distinct from the member-facing palette.
 */
import { cn } from '../../../lib/utils';

interface ChipButtonProps {
  /** Whether this chip currently represents the selected value. */
  isActive: boolean;
  /** Click handler. Called whenever the chip is pressed. */
  onClick: () => void;
  /** Localized text shown inside the chip. */
  label: string;
}

/**
 * Renders a single toggle-able chip. Stateless; the parent owns
 * which chip in a group is active.
 */
export function ChipButton({ isActive, onClick, label }: ChipButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        isActive
          ? 'bg-[#635bff] text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
      )}
      aria-pressed={isActive}
    >
      {label}
    </button>
  );
}
