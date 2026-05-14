/**
 * ServiceActivationBanner: reusable lifecycle banner for tenant services.
 *
 * Renders the correct UI for each service activation state:
 * - loading:  animated skeleton while /api/me is refreshing (no page reload needed)
 * - inactive: interactive toggle switch (OFF) to activate the service
 * - sandbox:  amber card; service on but workspace not live yet
 * - live:     emerald card; fully active
 *
 * RTL safety: all toggle switch elements carry dir="ltr" so that
 * translate-x-* positions the thumb correctly regardless of page direction.
 *
 * Loading states (isActivating, isGoingLive, isDisabling) are managed
 * internally so the parent only needs to pass async handler functions.
 */
import { useState } from 'react';

/** Text labels for a single service - pass a different object per service. */
export interface ServiceBannerConfig {
  /** Service display name shown in the banner header. */
  name: string;
  /** One-line description shown under the inactive toggle. */
  inactiveNote: string;
  /** One-line description shown in the sandbox state. */
  sandboxNote: string;
}

export interface ServiceActivationBannerProps {
  config: ServiceBannerConfig;
  /**
   * Current service activation mode.
   * Pass 'loading' while /api/me is being re-fetched after a state change
   * to show a skeleton instead of a stale banner.
   */
  mode: 'loading' | 'inactive' | 'sandbox' | 'live';
  /** Called when the admin flips the toggle ON. Should await the API call + reloadMe(). */
  onActivate: () => Promise<void>;
  /**
   * Called when the admin clicks Go Live (sandbox to live).
   * Omit for services that do not have a sandbox phase.
   */
  onGoLive?: () => Promise<void>;
  /** Called when the admin confirms service deactivation. Should await the API call + reloadMe(). */
  onDisable: () => Promise<void>;
}

/**
 * Decorative ON toggle indicator - RTL-safe via dir="ltr".
 * Input: color - Tailwind background color class for the track.
 * Output: non-interactive toggle thumb positioned to the right.
 */
function OnToggle({ color }: { color: string }) {
  return (
    <div
      dir="ltr"
      className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full ${color} border-2 border-transparent pointer-events-none`}
    >
      <span className="inline-block h-5 w-5 rounded-full bg-white shadow translate-x-7" />
    </div>
  );
}

/**
 * Spinning SVG used inside toggle buttons and Go Live button during loading.
 * Input: className - optional size classes (defaults to h-3 w-3).
 * Output: accessible animated spinner icon.
 */
function Spinner({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/**
 * Reusable service activation lifecycle banner.
 * Input: config labels, current mode, and async action handlers.
 * Output: contextual banner card with toggle, status, and action buttons.
 */
export default function ServiceActivationBanner({
  config,
  mode,
  onActivate,
  onGoLive,
  onDisable,
}: ServiceActivationBannerProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [isGoingLive, setIsGoingLive] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  /**
   * Wraps the parent onActivate handler with local loading state.
   * Parent is responsible for API call and reloadMe; parent handles error toasts.
   */
  const handleActivate = async () => {
    setIsActivating(true);
    try {
      await onActivate();
    } catch {
      // Parent handles error toasts.
    } finally {
      setIsActivating(false);
    }
  };

  /**
   * Wraps the parent onGoLive handler with local loading state.
   * Parent is responsible for API call and reloadMe; parent handles error toasts.
   */
  const handleGoLive = async () => {
    setIsGoingLive(true);
    try {
      await onGoLive?.();
    } catch {
      // Parent handles error toasts.
    } finally {
      setIsGoingLive(false);
    }
  };

  /**
   * Wraps the parent onDisable handler with local loading state.
   * Clears the confirmation prompt after the action completes.
   * Parent is responsible for API call and reloadMe; parent handles error toasts.
   */
  const handleDisable = async () => {
    setIsDisabling(true);
    try {
      await onDisable();
    } catch {
      // Parent handles error toasts.
    } finally {
      setIsDisabling(false);
      setIsConfirming(false);
    }
  };

  // Loading skeleton - shown while /api/me is being re-fetched after a state change.
  if (mode === 'loading') {
    return (
      <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm p-5 animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-slate-200 rounded" />
            <div className="h-3 w-72 bg-slate-100 rounded" />
          </div>
          <div className="h-7 w-14 bg-slate-200 rounded-full shrink-0" />
        </div>
      </div>
    );
  }

  // Inactive banner - shows an interactive OFF toggle to activate the service.
  if (mode === 'inactive') {
    return (
      <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{config.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">{config.inactiveNote}</p>
        </div>
        {/* Interactive toggle - dir="ltr" ensures correct thumb position in RTL pages */}
        <button
          onClick={() => void handleActivate()}
          disabled={isActivating}
          dir="ltr"
          className="relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-slate-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed"
          role="switch"
          aria-checked={false}
          aria-label={`הפעל ${config.name}`}
        >
          {isActivating ? (
            <span className="translate-x-0.5 h-5 w-5 rounded-full bg-white shadow flex items-center justify-center">
              <Spinner />
            </span>
          ) : (
            <span className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 translate-x-0.5" />
          )}
        </button>
      </div>
    );
  }

  // Shared disable confirmation section - reused in both sandbox and live states.
  const disableSection = (
    <div className="flex items-center gap-2 shrink-0">
      {isConfirming ? (
        <>
          <span className="text-xs text-slate-600">בטוח? הכיבוי ישהה את כל ההצעות.</span>
          <button
            onClick={() => void handleDisable()}
            disabled={isDisabling}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            {isDisabling ? 'מושבת...' : 'כן, השבת'}
          </button>
          <button
            onClick={() => setIsConfirming(false)}
            disabled={isDisabling}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            ביטול
          </button>
        </>
      ) : (
        <button
          onClick={() => setIsConfirming(true)}
          className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          השבת שירות
        </button>
      )}
    </div>
  );

  // Sandbox banner - service is on but not yet live; admin can go live or disable.
  if (mode === 'sandbox') {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-amber-900">{config.name} - מצב sandbox</p>
            {/* Decorative ON toggle - dir="ltr" ensures correct thumb position in RTL pages */}
            <OnToggle color="bg-primary" />
          </div>
          <p className="mt-0.5 text-xs text-amber-700">{config.sandboxNote}</p>
        </div>
        {isConfirming ? (
          disableSection
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            {onGoLive && (
              <button
                onClick={() => void handleGoLive()}
                disabled={isGoingLive}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isGoingLive ? (
                  <>
                    <Spinner />
                    <span>מעדכן...</span>
                  </>
                ) : (
                  'Go Live'
                )}
              </button>
            )}
            <button
              onClick={() => setIsConfirming(true)}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              השבת שירות
            </button>
          </div>
        )}
      </div>
    );
  }

  // Live banner - service is fully active; admin can disable.
  return (
    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Decorative ON toggle - dir="ltr" ensures correct thumb position in RTL pages */}
        <OnToggle color="bg-emerald-500" />
        <p className="text-sm font-medium text-emerald-700">{config.name} פעיל</p>
      </div>
      {disableSection}
    </div>
  );
}
