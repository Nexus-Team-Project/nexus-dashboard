/**
 * Small inline SVG icons for the inventory modals' row actions (edit / delete /
 * undo). Inline SVG because `material-symbols-outlined` is not loaded in this app
 * (see CLAUDE.md). Each is a presentational glyph; the calling <button> supplies
 * the accessible label (aria-label + title).
 */

const base = 'h-4 w-4';

/** Pencil (edit). */
export function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={base} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
    </svg>
  );
}

/** Trash (delete). */
export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={base} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M18.16 5.79l-.811 13.883A2.25 2.25 0 0115.106 21.75H8.894a2.25 2.25 0 01-2.244-2.077L5.84 5.79m12.32 0a48.108 48.108 0 00-3.478-.397m-12 .562a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.165-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.036-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

/** Counter-clockwise arrow (undo / revert a staged change). */
export function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={base} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  );
}
