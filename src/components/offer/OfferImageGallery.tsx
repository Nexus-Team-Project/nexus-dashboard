/**
 * OfferImageGallery: multi-image grid for the offer create/edit pages.
 *
 * - Up to OFFER_IMAGES_MAX tiles. First tile is the cover (sent as imageUrls[0]
 *   to the backend and used as the thumbnail in catalog cards).
 * - Each tile supports re-crop (pencil), remove (trash), and reorder (HTML5
 *   drag-and-drop). The "add" tile also accepts drag-and-drop of OS files.
 * - New files are validated client-side (size <= 5MB, MIME type starts with
 *   "image/"); invalid files are rejected silently - the server re-validates.
 * - Cropping never alters the stored file. The PRISTINE original is uploaded
 *   and kept; the crop is captured as normalized fractions (ImageCrop) and
 *   applied at display time via Cloudinary transform URLs. Re-cropping an
 *   existing image only updates its crop metadata (no re-upload).
 * - Object URLs created for new-file previews are revoked on unmount and when
 *   the corresponding item is removed, so no memory leaks.
 *
 * The component is a controlled input: parent owns the gallery state and passes
 * `value` + `onChange`. Parent serialises into FormData on submit (original
 * files as images[], kept URLs as keptImageUrls, crops as new/keptImageCrops).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { cn } from '../../lib/utils';
import { buildOfferImageUrl, cropFallbackStyle, type ImageCrop } from '../../lib/cloudinaryImage';
import FieldTooltip from '../FieldTooltip';
import ImageCropModal from '../ImageCropModal';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * One gallery item is either an existing image (original URL already on
 * Cloudinary) or a new file the user just picked (the pristine original). Each
 * carries an optional crop (normalized fractions of the original); null = the
 * whole image. Parent serialises new files as `images[]` (multipart), existing
 * ones as `keptImageUrls`, and crops as `newImageCrops` / `keptImageCrops`.
 */
export type GalleryItem =
  | { kind: 'existing'; url: string; crop: ImageCrop | null }
  | { kind: 'new'; file: File; previewUrl: string; crop: ImageCrop | null };

interface OfferImageGalleryProps {
  /** Ordered gallery. First entry is the cover. */
  value: GalleryItem[];
  /** Called with the next ordered array whenever the user adds/removes/reorders/crops. */
  onChange: (next: GalleryItem[]) => void;
  /** Cap on total images (default OFFER_IMAGES_MAX = 6 to match backend). */
  maxImages?: number;
  /** Disable add/remove/crop/drag — used while saving. */
  disabled?: boolean;
  /**
   * Optional default/placeholder image shown faded inside the empty "add" tile,
   * so the field previews the fallback the card will use when no image is set
   * (e.g. the tenant-level default offer image). Only shown when the gallery is
   * empty; omit it to keep the plain add tile (non-voucher offers).
   */
  fallbackPreviewUrl?: string;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

// ─── Component ───────────────────────────────────────────────────────────────

export default function OfferImageGallery({
  value,
  onChange,
  maxImages = 6,
  disabled = false,
  fallbackPreviewUrl,
}: OfferImageGalleryProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  /**
   * Queue of files waiting for the user to set an initial crop. Each entry holds
   * the ORIGINAL File plus an object URL the crop modal renders (and which then
   * becomes the tile preview on confirm). The modal processes the head; confirm
   * appends the original file + chosen crop and shifts the queue; cancel revokes
   * the URL and drops the file. Multi-file uploads run through this one-by-one.
   */
  const [cropQueue, setCropQueue] = useState<{ src: string; file: File }[]>([]);
  /**
   * Tile currently being re-cropped via the pencil button: its index, the image
   * source the modal renders, and the current crop to seed the selection. `null`
   * when no edit is active. Confirm updates only the crop metadata in place
   * (no re-upload), preserving order + cover status.
   */
  const [editTarget, setEditTarget] = useState<{ index: number; src: string; crop: ImageCrop | null } | null>(null);
  /**
   * Tracks OS file drag-over of the "add" tile. `dropDepth` counts nested
   * dragenter/dragleave events so the highlight does not flicker as the cursor
   * crosses child elements; `isFileDragOver` drives the visual hover state.
   */
  const dropDepth = useRef(0);
  const [isFileDragOver, setIsFileDragOver] = useState(false);

  /**
   * Revokes object URLs for `new` items when the component unmounts so the
   * browser does not hold preview blobs in memory forever.
   */
  useEffect(() => {
    return () => {
      value.forEach((it) => {
        if (it.kind === 'new') URL.revokeObjectURL(it.previewUrl);
      });
      // Drain any object URLs that were queued for cropping but never confirmed
      // or cancelled (e.g. the user navigated away mid-queue).
      cropQueue.forEach((q) => URL.revokeObjectURL(q.src));
    };
    // We intentionally do NOT depend on `value` — revocation runs only on final
    // unmount. Per-item revocation happens in handleRemove.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handles a file picker / drop selection. Validates each file (image MIME +
   * <=5MB) and pushes the valid ones onto the crop queue so the user can set an
   * initial crop before the file lands in the gallery. The remaining-slot count
   * is pre-computed so the queue can never exceed the maxImages cap.
   */
  const handleFilesPicked = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const remaining = maxImages - value.length;
      if (remaining <= 0) return;
      const queued: { src: string; file: File }[] = [];
      for (let i = 0; i < files.length && queued.length < remaining; i += 1) {
        const f = files[i];
        if (!f.type.startsWith('image/')) continue;
        if (f.size > MAX_FILE_BYTES) continue;
        queued.push({ src: URL.createObjectURL(f), file: f });
      }
      if (queued.length > 0) setCropQueue((prev) => [...prev, ...queued]);
    },
    [maxImages, value.length],
  );

  /**
   * Cancel/skip a queued file: revoke its object URL and drop it off the front
   * (the file is NOT added). Confirm uses its own shift that keeps the URL.
   */
  const advanceCropQueue = useCallback(() => {
    setCropQueue((prev) => {
      if (prev.length === 0) return prev;
      URL.revokeObjectURL(prev[0].src);
      return prev.slice(1);
    });
  }, []);

  /**
   * Crop confirm for a queued file (metadata mode). Appends the ORIGINAL file
   * with the chosen crop; the queued object URL becomes the tile preview (so it
   * is NOT revoked here), then advances to the next queued file.
   */
  const handleCropConfirm = useCallback((crop: ImageCrop) => {
    setCropQueue((prev) => {
      if (prev.length === 0) return prev;
      const head = prev[0];
      onChange([...value, { kind: 'new', file: head.file, previewUrl: head.src, crop }]);
      return prev.slice(1);
    });
  }, [onChange, value]);

  /** Opens the crop modal for a tile so the user can adjust its crop. */
  const handleEditStart = useCallback(
    (index: number) => {
      const item = value[index];
      const src = item.kind === 'existing' ? item.url : item.previewUrl;
      setEditTarget({ index, src, crop: item.crop });
    },
    [value],
  );

  /**
   * Re-crop confirm (metadata mode). Updates ONLY the tile's crop in place - no
   * re-upload, no new blob. The original file/URL is untouched; on submit the
   * new crop rides along in keptImageCrops/newImageCrops.
   */
  const handleEditConfirm = useCallback(
    (crop: ImageCrop) => {
      setEditTarget((target) => {
        if (!target) return null;
        const prev = value[target.index];
        if (!prev) return null;
        const next = value.slice();
        next[target.index] = { ...prev, crop };
        onChange(next);
        return null;
      });
    },
    [value, onChange],
  );

  /** True when an OS drag carries files (vs. an in-page tile-reorder drag). */
  const dragHasFiles = (e: React.DragEvent): boolean =>
    Array.from(e.dataTransfer?.types ?? []).includes('Files');

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
          const isExisting = item.kind === 'existing';
          // Existing (Cloudinary) tiles render the crop exactly via a transform
          // URL; local new-file previews use a best-effort CSS object-position.
          const displaySrc = isExisting
            ? buildOfferImageUrl(item.url, item.crop, 'card')
            : item.previewUrl;
          const imgStyle: React.CSSProperties = isExisting
            ? { width: '100%', height: '100%', objectFit: 'cover' }
            : cropFallbackStyle(item.crop);
          const isCover = index === 0;
          const isDragging = dragIndex === index;
          const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
          return (
            <div
              key={isExisting ? `e-${item.url}` : `n-${item.previewUrl}`}
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
              <img src={displaySrc} alt="" className="pointer-events-none" style={imgStyle} />
              {isCover && (
                <span className="absolute top-2 start-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-white shadow-sm">
                  {t('of_coverBadge')}
                </span>
              )}
              {!disabled && (
                <div className="absolute top-2 end-2 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleEditStart(index)}
                    aria-label={t('of_editImage')}
                    title={t('of_editImage')}
                    className="w-7 h-7 rounded-full bg-white/90 text-slate-700 hover:bg-white hover:text-primary transition flex items-center justify-center"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.95 8.95a2 2 0 0 1-.878.506l-3.07.82a.5.5 0 0 1-.612-.612l.82-3.07a2 2 0 0 1 .506-.878l8.95-8.95Zm1.768 1.06a.5.5 0 0 0-.708 0l-1.06 1.061 1.414 1.414 1.06-1.06a.5.5 0 0 0 0-.708l-.706-.707ZM12.94 8.18 11.525 6.77l-6.01 6.01a.5.5 0 0 0-.127.22l-.41 1.534 1.535-.41a.5.5 0 0 0 .219-.127l6.01-6.01Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    aria-label={t('of_removeImage')}
                    title={t('of_removeImage')}
                    className="w-7 h-7 rounded-full bg-white/90 text-slate-700 hover:bg-white hover:text-red-600 transition flex items-center justify-center"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path
                        fillRule="evenodd"
                        d="M8.75 1.5a1.25 1.25 0 0 0-1.18.84L7.11 3.5H4.25a.75.75 0 0 0 0 1.5h.32l.7 10.51A2.25 2.25 0 0 0 7.51 17.5h4.98a2.25 2.25 0 0 0 2.25-1.99L15.43 5h.32a.75.75 0 0 0 0-1.5h-2.86l-.46-1.16A1.25 1.25 0 0 0 11.25 1.5h-2.5Zm-.5 6a.75.75 0 0 1 1.5 0v6a.75.75 0 0 1-1.5 0v-6Zm3.5-.75a.75.75 0 0 0-.75.75v6a.75.75 0 0 0 1.5 0v-6a.75.75 0 0 0-.75-.75Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => {
              if (!dragHasFiles(e)) return;
              e.preventDefault();
              dropDepth.current += 1;
              setIsFileDragOver(true);
            }}
            onDragOver={(e) => {
              if (!dragHasFiles(e)) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDragLeave={(e) => {
              if (!dragHasFiles(e)) return;
              dropDepth.current = Math.max(0, dropDepth.current - 1);
              if (dropDepth.current === 0) setIsFileDragOver(false);
            }}
            onDrop={(e) => {
              if (!dragHasFiles(e)) return;
              e.preventDefault();
              dropDepth.current = 0;
              setIsFileDragOver(false);
              handleFilesPicked(e.dataTransfer.files);
            }}
            className={cn(
              'relative overflow-hidden aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition',
              isFileDragOver
                ? 'border-primary bg-primary/5 text-primary scale-[1.02] shadow-sm'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-primary text-slate-500 hover:text-primary',
            )}
          >
            {/* When the gallery is empty, preview the default fallback image faded
                behind the add prompt so the user sees what the card will use. */}
            {value.length === 0 && fallbackPreviewUrl && !isFileDragOver && (
              <img
                src={fallbackPreviewUrl}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
              />
            )}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="relative z-10 w-7 h-7 pointer-events-none"
            >
              {isFileDragOver ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V4.5m0 0L7.5 9M12 4.5 16.5 9M4.5 19.5h15" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              )}
            </svg>
            <span className="relative z-10 text-xs font-medium pointer-events-none">
              {isFileDragOver ? t('of_dropHere') : t('of_addImage')}
            </span>
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

      {/* Crop modal (metadata mode - returns crop fractions, never a blob). An
          explicit re-crop (pencil) takes priority over the new-file queue; the
          two never overlap because editing is a discrete user action. Edit
          confirm updates the tile's crop in place; queue confirm appends the
          original file + crop and advances to the next picked file. */}
      {editTarget ? (
        <ImageCropModal
          src={editTarget.src}
          onCropMeta={handleEditConfirm}
          onCancel={() => setEditTarget(null)}
          allowFullImage
          initialCrop={editTarget.crop}
        />
      ) : cropQueue.length > 0 ? (
        <ImageCropModal
          src={cropQueue[0].src}
          onCropMeta={handleCropConfirm}
          onCancel={advanceCropQueue}
          allowFullImage
        />
      ) : null}
    </section>
  );
}
