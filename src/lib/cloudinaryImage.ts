/**
 * Offer image rendering helper.
 *
 * Offers store the PRISTINE original image on Cloudinary plus per-image crop
 * metadata (normalized fractions of the original). The crop is the canonical
 * region shown to users everywhere; we derive a correctly-cropped, correctly-
 * sized delivery URL on the fly via Cloudinary transformation URLs - the
 * original is never re-uploaded and stays editable forever.
 *
 * Two display modes (render contexts):
 *   - 'full' (click/expand/lightbox): the crop at its saved full size (no
 *     downscale, only an upper safety bound).
 *   - 'card' / 'hero' (small inline views): the SAME crop, downscaled to fit the
 *     box ("show what it can").
 *
 * For non-Cloudinary URLs (or local blob previews) we fall back to the original
 * URL plus a CSS style derived from the fractions so it still visually crops.
 *
 * Security: this helper only reads the public delivery URL + crop fractions.
 * No secret (api key/secret, CLOUDINARY_URL) is ever involved client-side.
 */

// ─── Shared crop contract (mirrors backend supply.models.ts) ───────────────────

/**
 * A normalized crop rectangle relative to the ORIGINAL image, in fractions of
 * the image width/height (each 0..1). Optional natural dimensions let the CSS
 * fallback compute an exact crop box without a Cloudinary round-trip.
 */
export interface ImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
  aspect?: number;
  naturalWidth?: number;
  naturalHeight?: number;
}

/** One crop entry keyed to its original image URL. crop=null => full image. */
export interface ImageCropEntry {
  url: string;
  crop: ImageCrop | null;
}

// ─── Render contexts ───────────────────────────────────────────────────────────

/** Named render targets; consumers ask for a context, never raw pixels. */
export type RenderContext = 'card' | 'hero' | 'full';

/**
 * Target box (px) for the downscaled small-view contexts. The crop is filled
 * into this box (c_fill). Kept in one place so every surface stays consistent.
 */
const CONTEXT_SIZE: Record<'card' | 'hero', { width: number; height: number }> = {
  card: { width: 640, height: 480 },
  hero: { width: 1280, height: 854 },
};

/** Upper bound for the full (click/expand) view so payloads never get absurd. */
const FULL_MAX_WIDTH = 2000;

// ─── Default placeholder ─────────────────────────────────────────────────────────

/** Public Cloudinary cloud name (NOT a secret); falls back to the dev cloud. */
const CLOUDINARY_CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined) ?? 'dyqjvjdlq';

/**
 * The tenant-level default offer placeholder image, shown when an offer/voucher
 * has no cover image of its own (same asset used in the create-page banner and
 * matching backend `defaultOfferImageUrl()`). Version-less, so re-uploading the
 * asset swaps it with no code change.
 */
export function defaultOfferImageUrl(): string {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/nexus/defaults/offer-placeholder.png`;
}

// ─── Crop lookup ───────────────────────────────────────────────────────────────

/**
 * Looks up the crop for a given image URL within an offer's crop metadata.
 *
 * Input:  imageCrops - the offer's crop entries (may be undefined); url.
 * Output: the matching ImageCrop, or null when none / full image.
 */
export function getImageCrop(
  imageCrops: ImageCropEntry[] | undefined,
  url: string,
): ImageCrop | null {
  if (!imageCrops) return null;
  return imageCrops.find((e) => e.url === url)?.crop ?? null;
}

// ─── Cloudinary URL building ─────────────────────────────────────────────────────

/** True for a Cloudinary delivery URL we know how to transform. */
function isCloudinaryUrl(url: string): boolean {
  return /res\.cloudinary\.com\/.+\/upload\//.test(url);
}

/**
 * Formats a fraction for a Cloudinary transform value: 4 decimals, trailing
 * zeros trimmed (Cloudinary treats 0..1 decimals as fractions of the original).
 */
function frac(n: number): string {
  return Number(n.toFixed(4)).toString();
}

/** Builds the size step for a context (applied after any crop step). */
function sizeStep(context: RenderContext): string {
  if (context === 'full') return `c_limit,w_${FULL_MAX_WIDTH},q_auto,f_auto`;
  const { width, height } = CONTEXT_SIZE[context];
  return `c_fill,w_${width},h_${height},q_auto,f_auto`;
}

/**
 * Builds a delivery URL for an offer image at the given render context, applying
 * the crop when present. For a non-Cloudinary URL the original is returned
 * unchanged (pair it with `cropFallbackStyle` for a best-effort visual crop).
 *
 * Input:  originalUrl - the stored (pristine) image URL.
 *         crop        - normalized crop, or null for the whole image.
 *         context     - 'full' (native crop) or 'card'/'hero' (downscaled).
 * Output: a delivery URL string.
 */
export function buildOfferImageUrl(
  originalUrl: string,
  crop: ImageCrop | null,
  context: RenderContext,
): string {
  if (!originalUrl || !isCloudinaryUrl(originalUrl)) return originalUrl;

  const steps: string[] = [];
  if (crop) {
    steps.push(`c_crop,x_${frac(crop.x)},y_${frac(crop.y)},w_${frac(crop.width)},h_${frac(crop.height)}`);
  }
  steps.push(sizeStep(context));

  // Insert the transform chain right after `/upload/` (before any version).
  return originalUrl.replace(/\/upload\//, `/upload/${steps.join('/')}/`);
}

// ─── Non-Cloudinary / local fallback ─────────────────────────────────────────────

/**
 * Best-effort CSS style that visually biases an image toward its crop region
 * using object-fit: cover + object-position (distortion-free, no wrapper
 * needed). Used for local blob previews and non-Cloudinary URLs where we cannot
 * build a Cloudinary transform URL. It pans toward the crop's centre rather than
 * zooming into it, so it is an approximation; the authoritative display surfaces
 * use `buildOfferImageUrl` (exact) for Cloudinary-hosted images. A null crop
 * returns plain object-cover.
 *
 * Input:  crop - normalized crop (natural dimensions are not required here).
 * Output: a React-compatible style object for the <img> element.
 */
export function cropFallbackStyle(crop: ImageCrop | null): React.CSSProperties {
  const base: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
  if (!crop) return base;
  // Standard background-position math: map the crop's top-left within the
  // remaining (1 - size) range to a 0..100% object-position.
  const denomX = 1 - crop.width;
  const denomY = 1 - crop.height;
  const posX = denomX > 0 ? (crop.x / denomX) * 100 : 50;
  const posY = denomY > 0 ? (crop.y / denomY) * 100 : 50;
  return { ...base, objectPosition: `${posX}% ${posY}%` };
}
