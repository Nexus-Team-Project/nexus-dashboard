/**
 * Stable hash -> color for tenant initials tiles (when a tenant has no logo).
 * The same name always yields the same color. Saturation/lightness are fixed so
 * white initials always read well on top.
 */

const SAT = 62;
const LIGHT = 52;

/** djb2-style string hash -> non-negative int (deterministic, no randomness). */
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** HSL -> #rrggbb. */
function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const to = (v: number): string => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * A stable, distinct color for a tenant name (used as the initials-tile bg).
 * @param seed the tenant name (or id).
 */
export function tenantColor(seed: string): string {
  return hslToHex(hashSeed(seed || '?') % 360, SAT, LIGHT);
}
