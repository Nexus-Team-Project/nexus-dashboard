/**
 * Robust extraction of a human-readable message from a backend error payload.
 *
 * Backend errors arrive in several shapes: a plain `{ error: "message" }` string,
 * a Zod `flatten()` (`{ formErrors: [], fieldErrors: { variants: [...] } }`), or a
 * Zod `format()` (deeply nested `{ _errors: [], variants: { 0: { face_value: { _errors: [...] } } } }`).
 * Naively doing `new Error(payload.error)` on an object renders "[object Object]"
 * in the UI. This walks any of those shapes and returns the actual string
 * message(s), so callers never surface a raw object.
 */

/** Max distinct messages to join, so a huge validation tree stays readable. */
const MAX_MESSAGES = 5;
/** Recursion guard against pathological/cyclic structures. */
const MAX_DEPTH = 8;

/** Collects every non-empty string leaf from an arbitrary value (objects/arrays). */
function collectStrings(value: unknown, out: string[], depth = 0): void {
  if (depth > MAX_DEPTH || value == null || out.length >= 50) return;
  if (typeof value === 'string') {
    const s = value.trim();
    if (s) out.push(s);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out, depth + 1);
    return;
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) collectStrings(v, out, depth + 1);
  }
}

/**
 * Returns a clean string message for an error value (a backend `error` field, a
 * thrown `Error`, or any validation object). Falls back to `fallback` when no
 * usable string is found.
 */
export function extractApiError(value: unknown, fallback = 'Something went wrong'): string {
  if (value == null) return fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (value instanceof Error) {
    return value.message && value.message !== '[object Object]' ? value.message : fallback;
  }
  const found: string[] = [];
  collectStrings(value, found);
  const unique = [...new Set(found)];
  if (unique.length === 0) return fallback;
  return unique.slice(0, MAX_MESSAGES).join('; ');
}
