/**
 * ImageCropModal: shows a crop UI for an image picked by the user.
 * Opens after file selection; user drags to pick crop region.
 * On confirm, calls onCrop with the cropped image as a Blob.
 *
 * Props:
 *   src       - object URL of the picked file (from URL.createObjectURL).
 *   onCrop    - called with the cropped Blob when user confirms.
 *   onCancel  - called when user dismisses without cropping.
 */
import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useLanguage } from '../i18n/LanguageContext';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ImageCropModalProps {
  /** Object URL of the image to crop (from URL.createObjectURL). */
  src: string;
  /** Called with the cropped Blob when the user confirms the selection. */
  onCrop: (blob: Blob) => void;
  /** Called when the user closes the modal without confirming. */
  onCancel: () => void;
  /** Lock the crop to this width/height ratio (e.g. 1 for a square logo).
   *  Omitted = free-form crop that keeps the image's natural ratio. */
  aspect?: number;
  /** Show a "use full image" button that skips cropping and returns the whole
   *  image as-is. Useful for logos that are already correctly framed. */
  allowFullImage?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

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
export default function ImageCropModal({ src, onCrop, onCancel, aspect, allowFullImage }: ImageCropModalProps) {
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

  /**
   * Initialises the default crop selection once the image has loaded and its
   * natural dimensions are available.
   *
   * Input:  synthetic load event from the <img> element.
   * Output: sets the initial crop state.
   */
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setCrop(defaultCrop(naturalWidth, naturalHeight, aspect));
  }, [aspect]);

  /**
   * Runs canvas extraction on the completed crop selection and calls onCrop.
   * Logs and silently recovers if extraction fails (user can retry).
   *
   * Input:  none (reads completedCrop and imgRef from closure).
   * Output: calls onCrop with the Blob, or logs an error on failure.
   */
  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      onCrop(blob);
    } catch (err) {
      console.error('Crop extraction failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  /** Skip cropping: return the whole image as-is (full display area). */
  const handleUseFull = async () => {
    if (!imgRef.current) return;
    setIsProcessing(true);
    try {
      const img = imgRef.current;
      const full: PixelCrop = { unit: 'px', x: 0, y: 0, width: img.width, height: img.height };
      const blob = await getCroppedBlob(img, full);
      onCrop(blob);
    } catch (err) {
      console.error('Full-image extraction failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    /* Backdrop - clicking outside does not dismiss; user must use Cancel to avoid
       accidental dismissal on mobile when adjusting crop handles near the edge. */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="חתוך תמונה"
    >
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="text-right">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            חתוך את התמונה
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            גרור לבחירת האזור הרצוי
          </p>
        </div>

        {/* Crop editor - scrollable so tall images don't overflow the viewport */}
        <div className="flex max-h-[60vh] justify-center overflow-auto">
          <ReactCrop
            crop={crop}
            onChange={(_px, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={50}
            minHeight={50}
          >
            <img
              ref={imgRef}
              src={src}
              alt="תצוגה מקדימה לחיתוך"
              onLoad={onImageLoad}
              className="max-h-[55vh] max-w-full object-contain"
            />
          </ReactCrop>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-2">
          {allowFullImage && (
            <button
              type="button"
              onClick={() => void handleUseFull()}
              disabled={isProcessing}
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
            ביטול
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!completedCrop || isProcessing}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? 'מעבד...' : 'אשר חיתוך'}
          </button>
        </div>
      </div>
    </div>
  );
}
