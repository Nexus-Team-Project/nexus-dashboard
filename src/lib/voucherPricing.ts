/**
 * Shared voucher price-range helpers.
 *
 * A voucher offer is a parent with one or more variants, each with its own
 * member_price (the selling price). The catalog surfaces show the SPAN of those
 * prices (lowest - highest) on the collapsed card/modal so a single card never
 * hides the cheaper/dearer variants. face_value is never the selling price.
 *
 * Used by BenefitsPartnerships (admin catalog), ProductCatalog (adopted catalog),
 * and OfferModal so every surface renders an identical price range.
 */
import type { CatalogItem } from './api';

/** Just the variants field is needed - keeps the helpers usable with any item shape. */
type WithVariants = Pick<CatalogItem, 'variants'>;

/**
 * Span of member prices across an offer's variants.
 * Input: an item carrying variants. Output: { count, min, max } over variants
 * that have a numeric member_price, or null when none are priced.
 */
export function variantMemberPriceRange(
  item: WithVariants,
): { count: number; min: number; max: number } | null {
  const variants = item.variants ?? [];
  const prices = variants.map((v) => v.member_price).filter((n): n is number => typeof n === 'number');
  if (prices.length === 0) return null;
  return { count: variants.length, min: Math.min(...prices), max: Math.max(...prices) };
}

/**
 * Formats a voucher's member-facing price for a collapsed card/modal.
 * Multi-variant offers with differing prices render an isolated "min - max"
 * range (LRI/PDI wrapped so the hyphenated pair never reorders in RTL); a single
 * variant or equal prices render the single fallback price.
 * Input: the item + the single price to show when there is no range.
 * Output: a display string (already bidi-isolated where needed).
 */
export function formatVoucherCardPrice(item: WithVariants, singlePrice: number): string {
  const range = variantMemberPriceRange(item);
  if (range && range.count > 1 && range.min !== range.max) {
    // U+2066 LRI ... U+2069 PDI keeps the "min - max" pair left-to-right in RTL.
    return `${String.fromCharCode(0x2066)}₪${range.min} - ₪${range.max}${String.fromCharCode(0x2069)}`;
  }
  return `₪${singlePrice}`;
}
