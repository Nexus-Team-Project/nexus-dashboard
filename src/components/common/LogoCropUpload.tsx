/**
 * LogoCropUpload - pick an image file and choose a FREE crop (no forced aspect)
 * via ImageCropModal in metadata mode. Hands back the PRISTINE File + the crop
 * fractions + a local preview URL; the crop is stored as metadata and applied at
 * display time, so it can later be adjusted or reverted without re-uploading.
 * Validates type (PNG/JPG/WebP) and size (<= 5MB).
 *
 * Render-prop: `children(open)` lets the caller place its own trigger button.
 */
import { useRef, useState, type ReactNode } from 'react';
import ImageCropModal from '../ImageCropModal';
import type { ImageCrop } from '../../lib/cloudinaryImage';

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Bake an EXACT cropped preview (object URL) from the pristine file + crop
 * fractions, so the preview before Save matches what will be shown after upload.
 * This is display-only; the upload still sends the pristine file + crop metadata.
 * Falls back to a full-image object URL if the canvas draw fails.
 */
async function cropToPreviewUrl(file: File, crop: ImageCrop): Promise<string> {
  const tmp = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = tmp;
    });
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(crop.width * nw));
    canvas.height = Math.max(1, Math.round(crop.height * nh));
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, crop.x * nw, crop.y * nh, crop.width * nw, crop.height * nh, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (blob) { URL.revokeObjectURL(tmp); return URL.createObjectURL(blob); }
    }
  } catch {
    // fall through to the full-image fallback
  }
  URL.revokeObjectURL(tmp);
  return URL.createObjectURL(file);
}

interface LogoCropUploadProps {
  /** Called with the pristine File, the chosen crop (fractions), and an object-URL preview. */
  onCropped: (file: File, crop: ImageCrop, previewUrl: string) => void;
  /** Validation error: 'invalid_type' | 'too_large'. */
  onError?: (code: 'invalid_type' | 'too_large') => void;
  children: (open: () => void) => ReactNode;
}

export default function LogoCropUpload({ onCropped, onError, children }: LogoCropUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const open = (): void => inputRef.current?.click();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!f) return;
    if (!ALLOWED.includes(f.type)) { onError?.('invalid_type'); return; }
    if (f.size > MAX_BYTES) { onError?.('too_large'); return; }
    setFile(f);
    setSrc(URL.createObjectURL(f));
  };

  const closeCrop = (): void => {
    if (src) URL.revokeObjectURL(src);
    setSrc(null);
    setFile(null);
  };

  return (
    <>
      {children(open)}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      {src && file && (
        <ImageCropModal
          src={src}
          allowFullImage
          onCropMeta={(crop) => {
            const pristine = file;
            void (async () => {
              // Bake an exact cropped preview; upload still sends the pristine file + crop.
              const preview = await cropToPreviewUrl(pristine, crop);
              closeCrop();
              onCropped(pristine, crop, preview);
            })();
          }}
          onCancel={closeCrop}
        />
      )}
    </>
  );
}
