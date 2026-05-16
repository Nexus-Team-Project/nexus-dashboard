/**
 * EditOfferDrawerHelpers - small sub-components used by EditOfferDrawer.
 * Extracted to keep EditOfferDrawer.tsx within the 350-line limit.
 *
 * Exports:
 *   ImageSection - image preview / upload zone with file input.
 *   TagsInput    - chip-style tag list with inline add field.
 */
import { useRef, useState } from 'react';

// ─── ImageSection ─────────────────────────────────────────────────────────────

/**
 * Renders an image preview area with a "Replace image" button.
 * When no preview URL is available a dashed upload zone is shown instead.
 *
 * Input:
 *   previewUrl - current object URL or remote image URL (undefined = no image).
 *   onSelect   - called with the File the user picked.
 * Output: JSX section.
 */
export function ImageSection({
  previewUrl,
  onSelect,
}: {
  previewUrl: string | undefined;
  onSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    // Reset so the same file can be re-selected if needed.
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">תמונה</span>
      {previewUrl ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
          <img src={previewUrl} alt="תצוגה מקדימה" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            החלף תמונה
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-28 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors text-slate-400 dark:text-slate-500"
        >
          <span className="material-icons text-3xl">add_photo_alternate</span>
          <span className="text-sm">לחץ להעלאת תמונה</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// ─── TagsInput ────────────────────────────────────────────────────────────────

/**
 * Chip-style tag input - shows current tags with remove buttons and an
 * inline text input for adding new ones. Press Enter or comma to add a tag.
 *
 * Input:
 *   tags     - current list of tag strings.
 *   onChange - called with the updated list after add or remove.
 * Output: JSX section.
 */
export function TagsInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const trimmed = draft.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setDraft('');
  };

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">תגיות</span>
      <div className="flex flex-wrap gap-1.5 min-h-[2.25rem] p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary/40">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-full border border-slate-200 dark:border-slate-600"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`הסר תג ${tag}`}
              className="hover:text-red-500 transition-colors"
            >
              <span className="material-icons text-[10px]">close</span>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
          }}
          placeholder="הוסף תג..."
          className="flex-1 min-w-[6rem] text-sm bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
        />
        {draft.trim() && (
          <button
            type="button"
            onClick={addTag}
            className="text-xs text-primary font-medium hover:underline"
          >
            הוסף
          </button>
        )}
      </div>
    </div>
  );
}
