/**
 * OfferImageGallery: multi-image grid for the offer create/edit pages.
 *
 * - Up to OFFER_IMAGES_MAX tiles. First tile is the cover (sent as imageUrls[0]
 *   to the backend and used as the thumbnail in catalog cards).
 * - Each tile supports remove (button) and reorder (HTML5 drag-and-drop).
 * - An "add" tile appears as the final cell when there is room.
 * - New files are validated client-side (size ≤ 5MB, MIME type starts with
 *   "image/"); invalid files are rejected silently — server still re-validates.
 * - Object URLs created for new-file previews are revoked on unmount and when
 *   the corresponding item is removed/replaced, so no memory leaks.
 *
 * The component is a controlled input: parent owns the gallery state and
 * passes `value` + `onChange`. Parent serialises into FormData on submit.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';
import FieldTooltip from '../FieldTooltip';
import ImageCropModal from '../ImageCropModal';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * One gallery item is either an existing image (URL already on Cloudinary) or
 * a new file the user just picked. Parent serialises new ones as `images[]`
 * (multipart) and existing ones as `keptImageUrls` (JSON) on submit.
 */
export type GalleryItem =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; file: File; previewUrl: string };

interface OfferImageGalleryProps {
  /** Ordered gallery. First entry is the cover. */
  value: GalleryItem[];
  /** Called with the next ordered array whenever the user adds/removes/reorders. */
  onChange: (next: GalleryItem[]) => void;
  /** Cap on total images (default OFFER_IMAGES_MAX = 6 to match backend). */
  maxImages?: number;
  /** Disable add/remove/drag — used while saving. */
  disabled?: boolean;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

// ─── Component ───────────────────────────────────────────────────────────────

export default function OfferImageGallery({
  value,
  onChange,
  maxImages = 6,
  disabled = false,
}: OfferImageGalleryProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  /**
   * Queue of files waiting for the user to crop them. Each entry holds the
   * original filename + an object URL the crop modal renders. The modal
   * processes the head of the queue; on confirm or cancel we revoke the
   * object URL and shift to the next file. Multi-file uploads run through
   * this queue one-by-one so every image gets a chance to be cropped.
   */
  const [cropQueue, setCropQueue] = useState<{ src: string; name: string }[]>([]);

  /**
   * Revokes object URLs for `new` items when the component unmounts so the
   * browser does not hold preview blobs in memory forever.
   */
  useEffect(() => {
    return () => {
      value.forEach((it) => {
        if (it.kind === 'new') URL.revokeObjectURL(it.previewUrl);
      });
      // Drain any object URLs that were queued for cropping but never
      // confirmed or cancelled (e.g. the user navigated away mid-queue).
      cropQueue.forEach((q) => URL.revokeObjectURL(q.src));
    };
    // We intentionally do NOT depend on `value` — revocation runs only on
    // final unmount. Per-item revocation happens in handleRemove.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handles a file picker selection. Validates each file (image MIME + ≤5MB)
   * and pushes the valid ones onto the crop queue so the user can adjust each
   * crop before the file lands in the gallery. We pre-compute the remaining
   * slot count so the queue can never exceed the maxImages cap.
   */
  const handleFilesPicked = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const remaining = maxImages - value.length;
      if (remaining <= 0) return;
      const queued: { src: string; name: string }[] = [];
      for (let i = 0; i < files.length && queued.length < remaining; i += 1) {
        const f = files[i];
        if (!f.type.startsWith('image/')) continue;
        if (f.size > MAX_FILE_BYTES) continue;
        queued.push({ src: URL.createObjectURL(f), name: f.name });
      }
      if (queued.length > 0) setCropQueue((prev) => [...prev, ...queued]);
    },
    [maxImages, value.length],
  );

  /**
   * Advance the crop queue: revoke the head's object URL and drop it off the
   * front. Used by both confirm + cancel paths so the cleanup is uniform.
   */
  const advanceCropQueue = useCallback(() => {
    setCropQueue((prev) => {
      if (prev.length === 0) return prev;
      URL.revokeObjectURL(prev[0].src);
      return prev.slice(1);
    });
  }, []);

  /**
   * Crop confirm handler: turns the cropped blob into a real File (preserving
   * the original filename so the backend Cloudinary public_id stays readable),
   * appends it to the gallery, then advances to the next queued file.
   */
  const handleCropConfirm = useCallback((blob: Blob) => {
    setCropQueue((prev) => {
      if (prev.length === 0) return prev;
      const head = prev[0];
      const file = new File([blob], head.name, { type: blob.type || 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      onChange([...value, { kind: 'new', file, previewUrl }]);
      URL.revokeObjectURL(head.src);
      return prev.slice(1);
    });
  }, [onChange, value]);

  /** Removes the tile at `index` and revokes its preview URL if it is a new file. */
  const handleRemove = useCallback(
    (index: number) => {
      const item = value[index];
      if (item.kind === 'new') URL.revokeObjectURL(item.previewUrl);
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange],
  );

  /**
   * Reorders the gallery by moving the dragged item to the position of
   * `targetIndex`. Used on drop after HTML5 drag-and-drop.
   */
  const reorder = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0) return;
      const next = value.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onChange(next);
    },
    [value, onChange],
  );

  const canAddMore = value.length < maxImages && !disabled;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <header className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">{t('of_sectionImages')}</h2>
          <FieldTooltip fieldKey="images" />
        </div>
        <span className="text-xs text-slate-500" dir="ltr">
          {value.length} / {maxImages}
        </span>
      </header>

      <p className="text-xs text-slate-500 mb-4">{t('of_dragHint')}</p>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        role="list"
        aria-label={t('of_sectionImages')}
      >
        {value.map((item, index) => {
          const src = item.kind === 'existing' ? item.url : item.previewUrl;
          const isCover = index === 0;
          const isDragging = dragIndex === index;
          const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
          return (
            <div
              key={item.kind === 'existing' ? `e-${item.url}` : `n-${item.previewUrl}`}
              role="listitem"
              draggable={!disabled}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(index);
              }}
              onDragLeave={() => setOverIndex((prev) => (prev === index ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) reorder(dragIndex, index);
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={cn(
                'group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 transition',
                isDragging && 'opacity-40',
                isOver && 'ring-2 ring-primary',
                !disabled && 'cursor-move',
              )}
            >
              <img src={src} alt="" className="w-full h-full object-cover pointer-events-none" />
              {isCover && (
                <span className="absolute top-2 start-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-white shadow-sm">
                  {t('of_coverBadge')}
                </span>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  aria-label={t('of_removeImage')}
                  className="absolute top-2 end-2 w-7 h-7 rounded-full bg-white/90 text-slate-700 hover:bg-white hover:text-red-600 transition flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path
                      fillRule="evenodd"
                      d="M8.75 1.5a1.25 1.25 0 0 0-1.18.84L7.11 3.5H4.25a.75.75 0 0 0 0 1.5h.32l.7 10.51A2.25 2.25 0 0 0 7.51 17.5h4.98a2.25 2.25 0 0 0 2.25-1.99L15.43 5h.32a.75.75 0 0 0 0-1.5h-2.86l-.46-1.16A1.25 1.25 0 0 0 11.25 1.5h-2.5Zm-.5 6a.75.75 0 0 1 1.5 0v6a.75.75 0 0 1-1.5 0v-6Zm3.5-.75a.75.75 0 0 0-.75.75v6a.75.75 0 0 0 1.5 0v-6a.75.75 0 0 0-.75-.75Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          );
        })}

        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-primary text-slate-500 hover:text-primary transition flex flex-col items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="text-xs font-medium">{t('of_addImage')}</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          handleFilesPicked(e.target.files);
          // Reset so the same file can be selected again after removal.
          e.target.value = '';
        }}
      />

      {/* Crop queue: only renders when there is a file waiting. Confirm pushes
          the cropped blob into the gallery; cancel skips that file. Either path
          shifts the queue head so the next file's modal opens immediately. */}
      {cropQueue.length > 0 && (
        <ImageCropModal
          src={cropQueue[0].src}
          onCrop={handleCropConfirm}
          onCancel={advanceCropQueue}
        />
      )}
    </section>
  );
}
