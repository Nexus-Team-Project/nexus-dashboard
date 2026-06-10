/**
 * ImageLightbox: full-screen image viewer rendered as a React portal.
 *
 * Two modes:
 *   - Single image: pass `src` (legacy callers).
 *   - Gallery: pass `images` (and optional `initialIndex`). Prev/next arrows,
 *     dot pagination, ArrowLeft/ArrowRight keyboard navigation. Wraps at ends.
 *
 * Renders over the entire viewport with a dark backdrop. Closes on Escape,
 * backdrop click, or close button. Body scroll is locked while open.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ImageLightboxProps {
  /** Single image URL. Ignored when `images` is provided. */
  src?: string;
  /** Gallery of image URLs. When provided, lightbox renders prev/next controls. */
  images?: string[];
  /** Starting index for gallery mode. Defaults to 0. Clamped to range. */
  initialIndex?: number;
  /** Accessible alt text for the image. */
  alt: string;
  /** Callback invoked when the user closes the lightbox. */
  onClose: () => void;
  /** Optional close button label. Defaults to 'Close'. */
  closeLabel?: string;
}

/**
 * Renders a full-viewport lightbox as a portal directly into document.body.
 *
 * Input: either `src` (single) or `images` (gallery) + optional `initialIndex`,
 *        plus `alt` text and `onClose` handler.
 * Output: portal overlay with backdrop, close button, image, and (in gallery
 *         mode) prev/next arrows + dot pagination.
 *
 * Focus trap: focuses close button on mount, restores previous focus on unmount.
 * Restores body overflow on unmount.
 */
export default function ImageLightbox({
  src,
  images,
  initialIndex = 0,
  alt,
  onClose,
  closeLabel,
}: ImageLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Build the canonical gallery list once. Single-image mode wraps `src` in a
  // 1-element array so the rest of the component has one code path.
  const gallery = useMemo<string[]>(() => {
    if (images && images.length > 0) return images;
    if (src) return [src];
    return [];
  }, [images, src]);

  const [index, setIndex] = useState<number>(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(gallery.length - 1, 0)),
  );

  const isGallery = gallery.length > 1;

  // Keyboard: Escape closes, ArrowLeft/ArrowRight navigate in gallery mode.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (!isGallery) return;
      if (e.key === 'ArrowRight') {
        setIndex((i) => (i + 1) % gallery.length);
      } else if (e.key === 'ArrowLeft') {
        setIndex((i) => (i - 1 + gallery.length) % gallery.length);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, isGallery, gallery.length]);

  // Body-scroll lock + restore.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Focus trap.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      prev?.focus();
    };
  }, []);

  if (gallery.length === 0) return null;

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((i) => (i - 1 + gallery.length) % gallery.length);
  };
  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((i) => (i + 1) % gallery.length);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      {/* Close button - positioned top-right; receives focus on mount. */}
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-10"
        aria-label={closeLabel ?? 'Close'}
      >
        <span className="material-symbols-outlined text-2xl" aria-hidden="true">close</span>
      </button>

      {/* Prev arrow (gallery only). */}
      {isGallery && (
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-10"
          aria-label="Previous image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Next arrow (gallery only). */}
      {isGallery && (
        <button
          type="button"
          onClick={goNext}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-10"
          aria-label="Next image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Image - stopPropagation prevents backdrop click from firing on image. */}
      <img
        src={gallery[index]}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
      />

      {/* Dot pagination (gallery only). */}
      {isGallery && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 rounded-full px-3 py-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {gallery.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); setIndex(i); }}
              aria-label={`Go to image ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className={
                i === index
                  ? 'w-2.5 h-2.5 rounded-full bg-white'
                  : 'w-2.5 h-2.5 rounded-full bg-white/40 hover:bg-white/70 transition-colors'
              }
            />
          ))}
        </div>
      )}

      {/* Counter (gallery only). */}
      {isGallery && (
        <div
          className="absolute top-4 left-4 text-white text-sm bg-black/40 rounded-full px-3 py-1 select-none"
          onClick={(e) => e.stopPropagation()}
          dir="ltr"
        >
          {index + 1} / {gallery.length}
        </div>
      )}
    </div>,
    document.body,
  );
}
