/**
 * ImageLightbox: full-screen image viewer rendered as a React portal.
 *
 * Renders over the entire viewport with a dark backdrop.
 * Closes on Escape key, backdrop click, or close button.
 * Body scroll is locked while the lightbox is open.
 *
 * Props:
 *   src     - image URL to display.
 *   alt     - alt text for accessibility.
 *   onClose - called when user dismisses.
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ImageLightboxProps {
  /** Full URL of the image to display at maximum size. */
  src: string;
  /** Accessible alt text for the image. */
  alt: string;
  /** Callback invoked when the user closes the lightbox. */
  onClose: () => void;
}

/**
 * Renders a full-viewport lightbox as a portal directly into document.body.
 *
 * Input: src URL, alt text, onClose handler.
 * Output: portal overlay with backdrop, close button, and max-size image.
 */
export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  // Close on Escape key press
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      {/* Close button - positioned top-right over the backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors"
        aria-label="סגור"
      >
        <span className="material-symbols-outlined text-2xl" aria-hidden="true">close</span>
      </button>

      {/* Image - stopPropagation prevents backdrop click from firing when clicking image */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        style={{ maxHeight: '90vh', maxWidth: '90vw' }}
      />
    </div>,
    document.body,
  );
}
