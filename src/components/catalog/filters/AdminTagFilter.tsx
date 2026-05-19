/**
 * Admin filter: tag chip row.
 *
 * Tags are derived from the visible catalog page (same approach the
 * member filter uses). Members and admins both only see chips for
 * tags present on the current 25-item slice; widening the search or
 * lowering the category narrowing surfaces more tags. Backend uses
 * ANY-of semantics ($in) on the tags array field.
 */
import { useMemo } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import type { CatalogItem } from '../../../lib/api';
import { ChipButton } from './ChipButton';

/** Cap on how many tag chips render in the panel. */
const MAX_TAG_CHIPS = 24;

interface AdminTagFilterProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Visible offers on the current page. Used to derive the chip set. */
  items: CatalogItem[];
}

/** Tag filter section. Renders nothing when no tags exist in `items`. */
export function AdminTagFilter({ value, onChange, items }: AdminTagFilterProps) {
  const { t } = useLanguage();

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => (i.tags ?? []).forEach((tag) => tag && set.add(tag)));
    return Array.from(set).sort().slice(0, MAX_TAG_CHIPS);
  }, [items]);

  if (allTags.length === 0) return null;

  const toggle = (tag: string) => {
    onChange(value.includes(tag) ? value.filter((v) => v !== tag) : [...value, tag]);
  };

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('bp_filterTagsLabel')}
      </legend>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <ChipButton
            key={tag}
            isActive={value.includes(tag)}
            onClick={() => toggle(tag)}
            label={`#${tag}`}
          />
        ))}
      </div>
    </fieldset>
  );
}
