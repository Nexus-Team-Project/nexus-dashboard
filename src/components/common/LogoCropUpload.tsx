/**
 * LogoCropUpload - pick an image file, crop it to a square (reusing
 * ImageCropModal with aspect=1), and hand back the cropped Blob + a local
 * preview URL. Validates type (PNG/JPG/WebP) and size (<= 5MB).
 *
 * Render-prop: `children(open)` lets the caller place its own trigger button.
 */
import { useRef, useState, type ReactNode } from 'react';
import ImageCropModal from '../ImageCropModal';

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

interface LogoCropUploadProps {
  /** Called with the square-cropped Blob + an object-URL preview to display. */
  onCropped: (blob: Blob, previewUrl: string) => void;
  /** Validation error: 'invalid_type' | 'too_large'. */
  onError?: (code: 'invalid_type' | 'too_large') => void;
  children: (open: () => void) => ReactNode;
}

export default function LogoCropUpload({ onCropped, onError, children }: LogoCropUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  const open = (): void => inputRef.current?.click();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    if (!ALLOWED.includes(file.type)) { onError?.('invalid_type'); return; }
    if (file.size > MAX_BYTES) { onError?.('too_large'); return; }
    setSrc(URL.createObjectURL(file));
  };

  const closeCrop = (): void => {
    if (src) URL.revokeObjectURL(src);
    setSrc(null);
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
      {src && (
        <ImageCropModal
          src={src}
          aspect={1}
          allowFullImage
          onCrop={(blob) => {
            const preview = URL.createObjectURL(blob);
            closeCrop();
            onCropped(blob, preview);
          }}
          onCancel={closeCrop}
        />
      )}
    </>
  );
}
