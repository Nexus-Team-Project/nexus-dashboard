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
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ImageLightboxProps {
  /** Full URL of the image to display at maximum size. */
  src: string;
  /** Accessible alt text for the image. */
  alt: string;
  /** Callback invoked when the user closes the lightbox. */
  onClose: () => void;
  /** Optional close button label. Defaults to 'סגור / Close'. */
  closeLabel?: string;
}

/**
 * Renders a full-viewport lightbox as a portal directly into document.body.
 *
 * Input: src URL, alt text, onClose handler, optional closeLabel.
 * Output: portal overlay with backdrop, close button, and max-size image.
 *
 * Manages focus trap: focuses close button on mount, restores previous focus on unmount.
 * Restores body overflow state on unmount.
 */
export default function ImageLightbox({ src, alt, onClose, closeLabel }: ImageLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while lightbox is open; restore previous overflow state on unmount
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Focus trap: focus close button on mount, restore previous focus on unmount
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      prev?.focus();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      {/* Close button - positioned top-right over the backdrop; receives focus on mount */}
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors"
        aria-label={closeLabel ?? 'סגור / Close'}
      >
        <span className="material-symbols-outlined text-2xl" aria-hidden="true">close</span>
      </button>

      {/* Image - stopPropagation prevents backdrop click from firing when clicking image */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
      />
    </div>,
    document.body,
  );
}
