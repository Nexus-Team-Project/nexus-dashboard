/**
 * Brand-color helpers shared by the onboarding wizard and the settings card.
 *
 * The brand color is the accent wallet members see the first time they sign in
 * to a tenant's benefits. It is stored on the tenant as a 6-digit hex string.
 * When unset, the wallet derives a deterministic color from the tenant id, so a
 * tenant that never picks a color still looks distinct.
 */

/** Wallet fallback accent - kept in sync with nexus-wallet DEFAULT_TENANT_COLOR. */
export const DEFAULT_BRAND_COLOR = '#635bff';

/** A small curated palette offered as one-tap presets. */
export const BRAND_COLOR_PRESETS: readonly string[] = [
  '#635bff', // indigo (default)
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#0f172a', // slate
];

/** True when `value` is a valid 6-digit hex color with a leading '#'. */
export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

/**
 * Normalize loose user input into a "#rrggbb" hex, or null when it cannot be a
 * complete color yet. Accepts input with or without the leading '#', and any
 * case; the result is always lowercased with a leading '#'.
 */
export function normalizeHex(input: string): string | null {
  const trimmed = input.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(trimmed)) return null;
  return `#${trimmed.toLowerCase()}`;
}
