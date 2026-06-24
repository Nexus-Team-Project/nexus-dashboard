/**
 * ImageCropModal: shows a crop UI for an image picked by the user.
 * Opens after file selection (or when re-cropping an existing gallery tile);
 * the user drags to pick a crop region. On confirm, calls onCrop with the
 * cropped image as a Blob.
 *
 * Performance: large source images (multi-megapixel photos) make
 * react-image-crop's overlay drag janky because the browser repaints the full
 * backing bitmap on every pointer move. To keep the interaction instant we
 * downscale the source to a capped dimension (MAX_EDIT_DIM) on a canvas BEFORE
 * handing it to the editor, and crop from that downscaled copy. Catalog images
 * render small, so the capped size is more than enough quality. Downscaling
 * also produces a same-origin blob for remote (Cloudinary) images, so canvas
 * extraction never taints.
 *
 * Props:
 *   src       - object URL of the picked file, or a remote http(s) image URL.
 *   onCrop    - called with the cropped Blob when the user confirms.
 *   onCancel  - called when the user dismisses without cropping.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useLanguage } from '../i18n/LanguageContext';
import type { ImageCrop } from '../lib/cloudinaryImage';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ImageCropModalProps {
  /** Object URL of the image to crop, or a remote http(s) URL (re-crop case). */
  src: string;
  /**
   * Called with the cropped Blob when the user confirms (blob mode). Used by
   * flows that need a real cropped file (e.g. logos). Provide EITHER this or
   * `onCropMeta`. When `onCropMeta` is set, this is ignored.
   */
  onCrop?: (blob: Blob) => void;
  /**
   * Called with the crop as normalized fractions of the ORIGINAL image when the
   * user confirms (metadata mode). Used by the offer gallery, which keeps the
   * pristine original and applies the crop at display time. Takes precedence
   * over `onCrop` when both are provided.
   */
  onCropMeta?: (crop: ImageCrop) => void;
  /** Called when the user closes the modal without confirming. */
  onCancel: () => void;
  /** Lock the crop to this width/height ratio (e.g. 1 for a square logo).
   *  Omitted = free-form crop that keeps the image's natural ratio. */
  aspect?: number;
  /** Show a "use full image" button that returns the whole image (no crop). */
  allowFullImage?: boolean;
  /** Seed the initial selection (metadata mode re-crop) from an existing crop. */
  initialCrop?: ImageCrop | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Longest-edge cap (px) for the working image used inside the editor. */
const MAX_EDIT_DIM = 1600;

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Loads an image element from a URL.
 *
 * Input:  src - the image URL; crossOrigin - request anonymous CORS so the
 *         resulting element can be drawn to a canvas without tainting it.
 * Output: Promise resolving to the loaded HTMLImageElement, rejecting on error.
 */
function loadImage(src: string, crossOrigin: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

/**
 * Produces a working image source for the editor, downscaled so its longest
 * edge is at most MAX_EDIT_DIM. Remote images are re-encoded to a same-origin
 * blob so later canvas extraction is not tainted.
 *
 * Input:  src - original image URL (blob:, data:, or http(s)).
 * Output: { url, isObjectUrl }. `isObjectUrl` flags a created object URL the
 *         caller must revoke. On any failure, falls back to the original src.
 */
interface EditableSrc {
  url: string;
  isObjectUrl: boolean;
  /** Natural dimensions of the ORIGINAL image (0 when they could not be read). */
  naturalWidth: number;
  naturalHeight: number;
}

async function buildEditableSrc(src: string): Promise<EditableSrc> {
  const isRemote = /^https?:/i.test(src);
  try {
    const img = await loadImage(src, isRemote);
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const longest = Math.max(naturalWidth, naturalHeight);
    // Local images already under the cap can be used as-is (no taint risk).
    if (!isRemote && longest <= MAX_EDIT_DIM) {
      return { url: src, isObjectUrl: false, naturalWidth, naturalHeight };
    }

    const scale = longest > MAX_EDIT_DIM ? MAX_EDIT_DIM / longest : 1;
    const w = Math.max(1, Math.round(naturalWidth * scale));
    const h = Math.max(1, Math.round(naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95),
    );
    if (!blob) throw new Error('Canvas toBlob failed');
    return { url: URL.createObjectURL(blob), isObjectUrl: true, naturalWidth, naturalHeight };
  } catch {
    // Fallback: hand the original src to the editor unchanged (dims unknown).
    return { url: src, isObjectUrl: false, naturalWidth: 0, naturalHeight: 0 };
  }
}

/**
 * Extracts the cropped region from the image element using a Canvas.
 * Scales pixel coordinates from display size back to natural image size.
 *
 * Input:  imgEl     - the rendered <img> element (provides natural dimensions).
 *         pixelCrop - the selected region in display pixels (from react-image-crop).
 * Output: Promise resolving to a JPEG Blob of the cropped area (quality 0.92).
 */
async function getCroppedBlob(imgEl: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = imgEl.naturalWidth / imgEl.width;
  const scaleY = imgEl.naturalHeight / imgEl.height;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(
    imgEl,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/jpeg',
      0.92,
    );
  });
}

/**
 * Extracts a crop from the ORIGINAL full-resolution image (not the downscaled
 * editor copy), so the saved file keeps the source quality. The crop is given
 * as fractions of the image (0..1), which are resolution-independent, so they
 * map cleanly from the editor's downscaled display onto the original.
 *
 * Input:  src       - original image URL (blob:, data:, or http(s)).
 *         f         - crop rectangle as fractions { x, y, w, h } in [0,1].
 * Output: Promise resolving to a JPEG Blob at the original resolution.
 *         Rejects if the original cannot be loaded or the canvas is tainted
 *         (remote image without CORS) - the caller falls back to the editor copy.
 */
async function extractFromOriginal(
  src: string,
  f: { x: number; y: number; w: number; h: number },
): Promise<Blob> {
  const isRemote = /^https?:/i.test(src);
  const img = await loadImage(src, isRemote);
  const natW = img.naturalWidth;
  const natH = img.naturalHeight;
  // Clamp so rounding never reads outside the image bounds.
  const sx = Math.max(0, Math.min(natW, Math.round(f.x * natW)));
  const sy = Math.max(0, Math.min(natH, Math.round(f.y * natH)));
  const sw = Math.max(1, Math.min(natW - sx, Math.round(f.w * natW)));
  const sh = Math.max(1, Math.min(natH - sy, Math.round(f.h * natH)));
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/jpeg',
      0.92,
    );
  });
}

/**
 * Returns a centered free-form initial crop covering 80% of image width.
 * Preserves the natural aspect ratio of the image so the default selection
 * looks proportional regardless of image shape.
 *
 * Input:  mediaWidth, mediaHeight - natural image dimensions in pixels.
 * Output: Crop object ready to pass to react-image-crop's `crop` prop.
 */
function defaultCrop(mediaWidth: number, mediaHeight: number, aspect?: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, aspect ?? mediaWidth / mediaHeight, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Full-screen overlay modal with a react-image-crop editor.
 * The user can drag the selection handles to adjust the crop area before
 * confirming. Confirmation triggers canvas extraction and calls onCrop.
 *
 * Input:  src, onCrop, onCancel via props.
 * Output: renders a modal overlay; calls onCrop(blob) or onCancel() on dismiss.
 */
export default function ImageCropModal({ src, onCrop, onCropMeta, onCancel, aspect, allowFullImage, initialCrop }: ImageCropModalProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  /** Current percentage-based crop selection (drives the reactive UI). */
  const [crop, setCrop] = useState<Crop>();
  /** Pixel-based completed crop - populated once the user finishes dragging. */
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  /** Reference to the rendered <img> element for canvas extraction. */
  const imgRef = useRef<HTMLImageElement>(null);
  /** True while canvas extraction is in progress to prevent double-submit. */
  const [isProcessing, setIsProcessing] = useState(false);
  /** Downscaled working image source; null while it is being prepared. */
  const [editableSrc, setEditableSrc] = useState<string | null>(null);
  /** Natural size of the ORIGINAL image, recorded on `metadata` crops. */
  const originalSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  /**
   * Prepares the downscaled working image whenever `src` changes. Tracks the
   * created object URL so it can be revoked on cleanup / when src changes, and
   * an `active` flag so a stale async result never overwrites a newer one.
   */
  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    setEditableSrc(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    void buildEditableSrc(src).then(({ url, isObjectUrl, naturalWidth, naturalHeight }) => {
      if (!active) {
        if (isObjectUrl) URL.revokeObjectURL(url);
        return;
      }
      if (isObjectUrl) createdUrl = url;
      originalSizeRef.current = { width: naturalWidth, height: naturalHeight };
      setEditableSrc(url);
    });
    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [src]);

  /**
   * Initialises the crop selection once the working image has loaded. When an
   * `initialCrop` is provided (re-crop), seed from it and prime the completed
   * crop so confirm is enabled immediately; otherwise use the default 80% box.
   *
   * Input:  synthetic load event from the <img> element.
   * Output: sets the initial crop + completed-crop state.
   */
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    if (initialCrop) {
      setCrop({
        unit: '%',
        x: initialCrop.x * 100,
        y: initialCrop.y * 100,
        width: initialCrop.width * 100,
        height: initialCrop.height * 100,
      });
      setCompletedCrop({
        unit: 'px',
        x: initialCrop.x * el.width,
        y: initialCrop.y * el.height,
        width: initialCrop.width * el.width,
        height: initialCrop.height * el.height,
      });
      return;
    }
    setCrop(defaultCrop(el.naturalWidth, el.naturalHeight, aspect));
  }, [aspect, initialCrop]);

  /**
   * Confirms the current selection.
   * - Metadata mode (onCropMeta): returns the crop as normalized fractions of
   *   the ORIGINAL image (plus aspect + natural dims). No pixels are touched;
   *   the original file/URL is kept and the crop is applied at display time.
   * - Blob mode (onCrop): extracts the crop from the original at full resolution
   *   (falling back to the downscaled editor copy if a remote image taints the
   *   canvas), so callers needing a real file (logos) keep working.
   */
  const handleConfirm = async () => {
    const el = imgRef.current;
    if (!el || !completedCrop || !el.width || !el.height) return;
    // Convert the display-pixel crop into resolution-independent fractions.
    const fractions = {
      x: completedCrop.x / el.width,
      y: completedCrop.y / el.height,
      w: completedCrop.width / el.width,
      h: completedCrop.height / el.height,
    };
    if (onCropMeta) {
      onCropMeta(buildCropMeta(fractions));
      return;
    }
    setIsProcessing(true);
    try {
      const blob = await extractFromOriginal(src, fractions);
      onCrop?.(blob);
    } catch {
      // Fallback: extract from the downscaled copy on screen.
      try {
        const blob = await getCroppedBlob(el, completedCrop);
        onCrop?.(blob);
      } catch (err) {
        console.error('Crop extraction failed:', err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /** Use the whole image (no crop) - metadata mode returns a full-frame crop. */
  const handleUseFull = async () => {
    const el = imgRef.current;
    if (!el) return;
    if (onCropMeta) {
      onCropMeta(buildCropMeta({ x: 0, y: 0, w: 1, h: 1 }));
      return;
    }
    setIsProcessing(true);
    try {
      const blob = await extractFromOriginal(src, { x: 0, y: 0, w: 1, h: 1 });
      onCrop?.(blob);
    } catch {
      try {
        const full: PixelCrop = { unit: 'px', x: 0, y: 0, width: el.width, height: el.height };
        const blob = await getCroppedBlob(el, full);
        onCrop?.(blob);
      } catch (err) {
        console.error('Full-image extraction failed:', err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Assembles the ImageCrop metadata from crop fractions, attaching the locked
   * aspect (when one was set) and the original natural dimensions (for the CSS
   * fallback). Pure - reads only its args + the original-size ref.
   */
  const buildCropMeta = (f: { x: number; y: number; w: number; h: number }): ImageCrop => {
    const { width, height } = originalSizeRef.current;
    return {
      x: f.x,
      y: f.y,
      width: f.w,
      height: f.h,
      ...(aspect !== undefined && { aspect }),
      ...(width > 0 && height > 0 && { naturalWidth: width, naturalHeight: height }),
    };
  };

  // Remote working images keep crossOrigin so extraction stays untainted; the
  // downscaled blob/data URLs are same-origin and need nothing.
  const editorCrossOrigin = editableSrc && /^https?:/i.test(editableSrc) ? 'anonymous' : undefined;

  return (
    /* Backdrop - clicking outside does not dismiss; user must use Cancel to avoid
       accidental dismissal on mobile when adjusting crop handles near the edge. */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isHe ? 'חתוך תמונה' : 'Crop image'}
    >
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className={isHe ? 'text-right' : 'text-left'}>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {isHe ? 'חתוך את התמונה' : 'Crop the image'}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {isHe ? 'גרור לבחירת האזור הרצוי' : 'Drag to select the area you want'}
          </p>
        </div>

        {/* Crop editor. The working image is downscaled and always fits the
            viewport (object-contain + max-h), so the whole image is croppable
            without scroll fighting the drag gesture. touch-none routes touch
            drags to the crop selection instead of scrolling the page. */}
        <div className="flex min-h-[200px] items-center justify-center">
          {editableSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_px, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              minWidth={50}
              minHeight={50}
              className="max-w-full touch-none"
            >
              <img
                ref={imgRef}
                src={editableSrc}
                crossOrigin={editorCrossOrigin}
                alt={isHe ? 'תצוגה מקדימה לחיתוך' : 'Crop preview'}
                onLoad={onImageLoad}
                className="block max-h-[60vh] w-auto max-w-full object-contain"
              />
            </ReactCrop>
          ) : (
            <div className="h-48 w-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-2">
          {allowFullImage && (
            <button
              type="button"
              onClick={() => void handleUseFull()}
              disabled={isProcessing || !editableSrc}
              className="me-auto rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isHe ? 'השתמש בתמונה המלאה' : 'Use full image'}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isHe ? 'ביטול' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!completedCrop || isProcessing}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (isHe ? 'מעבד...' : 'Processing...') : isHe ? 'אשר חיתוך' : 'Apply crop'}
          </button>
        </div>
      </div>
    </div>
  );
}
