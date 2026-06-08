/**
 * Client-side helpers for rendering wallet mirror columns and answers.
 * The dashboard fetches the registry once (walletProfileFieldsApi.list) and uses
 * these helpers to localize stored answer tokens in the admin's language.
 */
import type { WalletProfileFieldDef } from '../../lib/api';

type Lang = 'he' | 'en';

/** Map sourceFieldKey -> def for O(1) lookup from a column's sourceFieldKey. */
export function buildMirrorDefMap(defs: WalletProfileFieldDef[]): Map<string, WalletProfileFieldDef> {
  return new Map(defs.map((d) => [d.sourceFieldKey, d]));
}

/** Localize one option token; falls back to the raw token when unknown. */
function optionLabel(def: WalletProfileFieldDef, token: string, lang: Lang): string {
  const opt = def.options?.find((o) => o.value === token);
  if (!opt) return token;
  return lang === 'he' ? opt.labelHe : opt.labelEn;
}

/**
 * Localize a stored mirror token for display. single_label resolves one option
 * label; multi_label resolves each (returns string[]); date/free_text pass
 * through. Returns a string for single/date/text and string[] for multi.
 */
export function localizeMirrorValue(def: WalletProfileFieldDef, token: unknown, lang: Lang): string | string[] {
  if (def.columnType === 'multi_label') {
    const arr = Array.isArray(token) ? token : token == null ? [] : [String(token)];
    return arr.map((v) => optionLabel(def, String(v), lang));
  }
  if (def.columnType === 'single_label' && typeof token === 'string') {
    return optionLabel(def, token, lang);
  }
  return token == null ? '' : String(token);
}

/** The localized column-header label for a mirror field. */
export function mirrorFieldLabel(def: WalletProfileFieldDef, lang: Lang): string {
  return lang === 'he' ? def.labelHe : def.labelEn;
}
