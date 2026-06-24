/**
 * OfferImageCarousel: read-only image carousel used in the member-facing
 * OfferModal hero. Shows ordered offer images with prev/next arrows + dot
 * indicators, and forwards clicks on the active image to an optional
 * fullscreen-lightbox handler.
 *
 * Behaviour:
 *   - 0 images   → caller is expected to render a fallback; this component
 *                  returns null so it never paints a blank box.
 *   - 1 image    → no controls, just the image.
 *   - 2+ images  → arrows on the sides, dots at the bottom, keyboard
 *                  left/right while the carousel is focused, RTL-safe arrows.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

interface OfferImageCarouselProps {
  /** Ordered image URLs. Index 0 is the cover. Empty = renders nothing. */
  images: string[];
  /** Accessible alt text — same for every slide (matches offer title). */
  alt: string;
  /** Optional lightbox opener. Called with the index of the visible image so the
   *  caller can open a different (e.g. full-resolution) URL for that slide. */
  onImageClick?: (index: number) => void;
  /** Tailwind classes applied to the root wrapper; allows the caller to set height. */
  className?: string;
}

export default function OfferImageCarousel({
  images,
  alt,
  onImageClick,
  className = '',
}: OfferImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  /**
   * Keep the active index inside the array bounds when the caller swaps the
   * image list (e.g. after editing). Prevents an "off the end" blank slide.
   */
  useEffect(() => {
    if (index > images.length - 1) setIndex(0);
  }, [images.length, index]);

  /**
   * Move one slide in either direction, wrapping around so the carousel is
   * always responsive even at the boundaries.
   */
  const goTo = useCallback((delta: number) => {
    setIndex((prev) => (prev + delta + images.length) % images.length);
  }, [images.length]);

  /** Keyboard navigation: ← / → step through slides while the root has focus. */
  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (images.length < 2) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(1); }
  }, [goTo, images.length]);

  if (images.length === 0) return null;
  const current = images[index] ?? images[0];
  const showControls = images.length > 1;

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={handleKey}
      className={`relative w-full h-full select-none outline-none ${className}`}
      role="group"
      aria-label={alt}
    >
      <img
        src={current}
        alt={alt}
        className={`w-full h-full object-cover ${onImageClick ? 'cursor-zoom-in' : ''}`}
        onClick={() => onImageClick?.(index)}
      />

      {showControls && (
        <>
          {/* Prev / Next — physical positions (right/left) so RTL flips
              naturally with rtl:rotate-180 on the chevron, not on layout. */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goTo(-1); }}
            className="absolute top-1/2 -translate-y-1/2 left-2 w-9 h-9 rounded-full bg-black/45 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            aria-label="Previous image"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M12.78 4.22a.75.75 0 0 1 0 1.06L8.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goTo(1); }}
            className="absolute top-1/2 -translate-y-1/2 right-2 w-9 h-9 rounded-full bg-black/45 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            aria-label="Next image"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M7.22 14.78a.75.75 0 0 1 0-1.06L10.94 10 7.22 6.28a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Dot indicators — current slide is wider for a clear active state. */}
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5"
            role="tablist"
            dir="ltr"
          >
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to image ${i + 1}`}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                className={
                  i === index
                    ? 'h-1.5 w-5 rounded-full bg-white transition-all'
                    : 'h-1.5 w-1.5 rounded-full bg-white/50 hover:bg-white/80 transition-all'
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
