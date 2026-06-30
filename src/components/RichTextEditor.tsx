/**
 * RichTextEditor: TipTap-based rich text editor with a formatting toolbar.
 * Outputs HTML string via onChange on every content change.
 * Supports: bold, italic, underline, headings (H1-H3), bullet/ordered lists,
 * text color (palette + color picker), font family, font size, text alignment.
 *
 * Props:
 *   value       - current HTML string (controlled component).
 *   onChange    - called with new HTML string on every change.
 *   placeholder - placeholder text shown when editor is empty.
 *   disabled    - disables editing when true.
 *   className   - optional extra classes for the outer wrapper.
 */
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// FontSize custom extension - TipTap has no built-in font-size extension.
// Adds fontSize attribute to TextStyle marks and setFontSize/unsetFontSize commands.
// ---------------------------------------------------------------------------
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.fontSize || null,
          renderHTML: (attrs: Record<string, unknown>) =>
            attrs.fontSize ? { style: `font-size: ${attrs.fontSize as string}` } : {},
        },
      },
    }];
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCommands(): Record<string, any> {
    return {
      setFontSize:
        (fontSize: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ chain }: { chain: () => any }) =>
          chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

// ---------------------------------------------------------------------------
// Constants - available font sizes, font families, and preset color swatches.
// ---------------------------------------------------------------------------
const FONT_SIZES = ['12px', '14px', '16px', '18px', '24px', '32px'];

const FONT_FAMILIES = [
  { label: 'ברירת מחדל', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier', value: '"Courier New", monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
];

const COLORS = [
  '#000000',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#ffffff',
];

// ---------------------------------------------------------------------------
// ToolbarButton - a small icon button in the editor toolbar.
// Input: onClick, active (highlighted when format is applied), title, children.
// Output: accessible button with active state styling.
// ---------------------------------------------------------------------------
function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-white'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// RichTextEditor main component
// ---------------------------------------------------------------------------
export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'הזן תיאור...',
  disabled = false,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  // Ref to the hidden native color input for the custom color picker button.
  const colorInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      // StarterKit v3 bundles Link + Underline; disable them here so our
      // explicitly-configured Underline + Link (below) are the single source and
      // we don't register duplicate extension names (which TipTap warns about and
      // can leave the schema in an inconsistent state).
      StarterKit.configure({ link: false, underline: false }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: e }) => {
      // Normalize empty editor output to empty string rather than '<p></p>'.
      const html = e.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync external value changes (e.g. when edit drawer pre-fills existing content).
  // Avoids re-setting content when editor itself triggered the change.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={cn('border border-slate-200 rounded-lg overflow-hidden dark:border-slate-700', className)}>
      {/* Toolbar - hidden when editor is in disabled (read-only) mode */}
      {!disabled && (
        <div
          className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
          dir="ltr"
        >
          {/* --- Inline formatting --- */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="מודגש"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="נטוי"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="קו תחתי"
          >
            <u>U</u>
          </ToolbarButton>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-0.5" />

          {/* --- Headings --- */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="כותרת 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="כותרת 2"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="כותרת 3"
          >
            H3
          </ToolbarButton>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-0.5" />

          {/* --- Lists --- */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="רשימה">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
              <circle cx="2" cy="4" r="1.4"/><rect x="5" y="3" width="9" height="2" rx="1"/>
              <circle cx="2" cy="8" r="1.4"/><rect x="5" y="7" width="9" height="2" rx="1"/>
              <circle cx="2" cy="12" r="1.4"/><rect x="5" y="11" width="9" height="2" rx="1"/>
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="רשימה ממוספרת">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
              <text x="0.5" y="5.5" fontSize="5.5" fontFamily="sans-serif">1.</text>
              <rect x="5" y="3" width="9" height="2" rx="1"/>
              <text x="0.5" y="9.5" fontSize="5.5" fontFamily="sans-serif">2.</text>
              <rect x="5" y="7" width="9" height="2" rx="1"/>
              <text x="0.5" y="13.5" fontSize="5.5" fontFamily="sans-serif">3.</text>
              <rect x="5" y="11" width="9" height="2" rx="1"/>
            </svg>
          </ToolbarButton>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-0.5" />

          {/* --- Text alignment --- */}
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="יישור שמאל">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
              <rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="6" width="10" height="2" rx="1"/>
              <rect x="1" y="10" width="14" height="2" rx="1"/><rect x="1" y="14" width="8" height="2" rx="1"/>
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="מרכז">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
              <rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3" y="6" width="10" height="2" rx="1"/>
              <rect x="1" y="10" width="14" height="2" rx="1"/><rect x="4" y="14" width="8" height="2" rx="1"/>
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="יישור ימין">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
              <rect x="1" y="2" width="14" height="2" rx="1"/><rect x="5" y="6" width="10" height="2" rx="1"/>
              <rect x="1" y="10" width="14" height="2" rx="1"/><rect x="7" y="14" width="8" height="2" rx="1"/>
            </svg>
          </ToolbarButton>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-0.5" />

          {/* --- Color swatches - preset palette --- */}
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(color).run(); }}
              title={color}
              aria-label={`צבע ${color}`}
              className={cn(
                'h-4 w-4 rounded-full border hover:scale-125 transition-transform',
                color === '#ffffff' ? 'border-slate-300' : 'border-transparent',
              )}
              style={{ backgroundColor: color }}
            />
          ))}

          {/* Native color picker - opens browser color input for custom color selection */}
          <div className="relative" title="צבע מותאם אישית">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); colorInputRef.current?.click(); }}
              className="h-7 w-7 flex flex-col items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="בחר צבע מותאם אישית"
            >
              <span
                className="text-sm font-bold leading-none"
                style={{ color: (editor.getAttributes('textStyle').color as string) || '#000' }}
              >
                A
              </span>
              <span
                className="w-3.5 h-0.5 rounded-full mt-0.5"
                style={{ backgroundColor: (editor.getAttributes('textStyle').color as string) || '#000' }}
              />
            </button>
            {/* Hidden native input - positioned off-screen; triggered programmatically */}
            <input
              ref={colorInputRef}
              type="color"
              className="absolute opacity-0 w-0 h-0 pointer-events-none"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-0.5" />

          {/* --- Font family selector --- */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                editor.chain().focus().setFontFamily(e.target.value).run();
              } else {
                editor.chain().focus().unsetFontFamily().run();
              }
            }}
            className="h-7 text-xs border border-slate-200 rounded px-1 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            title="גופן"
            aria-label="בחר גופן"
            dir="ltr"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* --- Font size selector --- */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (editor.chain().focus() as any).setFontSize(e.target.value).run();
              }
            }}
            className="h-7 text-xs border border-slate-200 rounded px-1 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            title="גודל גופן"
            aria-label="גודל גופן"
            dir="ltr"
          >
            <option value="">גודל</option>
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {/* Editor content area. Heading + list visibility is provided by explicit
          `.ProseMirror` rules in index.css (Tailwind preflight otherwise
          neutralizes heading sizes and list markers, making the H1-H3 / list
          toolbar buttons look like they do nothing). Those rules mirror the
          rendered RichTextDisplay output. */}
      <EditorContent
        editor={editor}
        className={cn(
          'min-h-[120px] px-3 py-2 text-sm',
          '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px]',
          disabled && 'opacity-60 pointer-events-none',
        )}
      />
    </div>
  );
}
