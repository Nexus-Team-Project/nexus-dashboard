/**
 * CreateOffer page: allows tenant admins, supply managers, and platform admins
 * to publish a new offer to the NEXUS platform catalog.
 *
 * Images are uploaded to Cloudinary via the backend (raw_cost is the supplier
 * cost; nexus_price = raw_cost + 30% margin is computed server-side and must
 * never be surfaced to end members).
 *
 * Route: /supply/create
 * Guards: isTenantAdmin || isPlatformAdmin (enforced in App.tsx route).
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createOfferApi, OFFER_CATEGORIES, EXECUTION_TYPE_LABELS } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Visibility options for a platform offer. */
type OfferVisibility = 'ecosystem' | 'tenant_only';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Form page for creating a new supply catalog offer.
 * Requires the caller (App.tsx route guard) to ensure only users with
 * canManageSupply or isPlatformAdmin can reach this route.
 *
 * Input: none - reads auth context internally.
 * Output: calls createOfferApi with a multipart FormData payload, then
 *         navigates to /benefits-partnerships on success.
 */
const CreateOffer = () => {
  const navigate = useNavigate();
  const { me } = useAuth();

  /** Platform admins always publish to the full ecosystem; the visibility
   *  toggle is hidden for them to prevent accidental scoping. */
  const isPlatformAdmin = me?.isPlatformAdmin === true || me?.authorization?.isPlatformAdmin === true;

  /** Ref for the hidden file input - triggered by clicking the image upload area. */
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(OFFER_CATEGORIES[0].value);
  const [rawCost, setRawCost] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [visibility, setVisibility] = useState<OfferVisibility>('ecosystem');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  /** Selected execution type - how the offer is delivered to the member. */
  const [executionType, setExecutionType] = useState('voucher');
  /** Optional stock limit; empty string means unlimited. */
  const [stockLimit, setStockLimit] = useState('');

  // ─── UI state ────────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  /**
   * Validates the selected image file (type + size) and creates a local preview URL.
   * Input: change event from the hidden file input element.
   * Output: updates imageFile and imagePreview state, or sets an error message.
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  /**
   * Removes the selected image and clears the preview URL (revokes the object URL
   * to avoid memory leaks).
   * Input: none.
   * Output: resets imageFile, imagePreview, and the hidden file input value.
   */
  const handleImageRemove = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  /**
   * Validates form fields, builds a multipart FormData payload, and calls the
   * backend to create the offer. On success, navigates to /benefits-partnerships.
   * Input: React form submit event.
   * Output: navigates on success; sets error state on failure.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    const cost = Number(rawCost);
    if (!rawCost || isNaN(cost) || cost <= 0) {
      setError('A valid cost (greater than 0) is required.');
      return;
    }

    const mp = marketPrice ? Number(marketPrice) : null;
    if (marketPrice && (isNaN(mp as number) || (mp as number) <= 0)) {
      setError('Market price must be a positive number if provided.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      fd.append('category', category);
      fd.append('raw_cost', rawCost);
      if (marketPrice && Number(marketPrice) > 0) {
        fd.append('market_price', marketPrice);
      }
      // Platform admins are always ecosystem; tenant supply managers can toggle.
      fd.append('visibility', isPlatformAdmin ? 'ecosystem' : visibility);
      fd.append('executionType', executionType);
      if (stockLimit && Number(stockLimit) > 0) fd.append('stockLimit', stockLimit);
      if (imageFile) fd.append('image', imageFile);

      await createOfferApi(fd);
      navigate('/benefits-partnerships');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to publish offer.';
      setError(`${message} Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Offer</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Publish a new offer to the NEXUS benefits catalog.
        </p>
      </div>

      <form onSubmit={(e) => { void handleSubmit(e); }} noValidate>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Left column: main fields ────────────────────────────────────── */}
          <div className="space-y-5 lg:col-span-2">
            {/* Offer details card */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
              <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-white">
                Offer Details
              </h2>

              {/* Title */}
              <div className="mb-4">
                <label
                  htmlFor="offer-title"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Title <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="offer-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 20% off at Coffee Chain"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label
                  htmlFor="offer-description"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Description
                </label>
                <textarea
                  id="offer-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the offer, terms, or redemption instructions..."
                  rows={4}
                  disabled={isSubmitting}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* Category */}
              <div className="mb-4">
                <label
                  htmlFor="offer-category"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Category
                </label>
                <select
                  id="offer-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {OFFER_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Execution type - how the offer is delivered to the member */}
              <div>
                <label
                  htmlFor="offer-execution-type"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Offer Type <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <select
                  id="offer-execution-type"
                  value={executionType}
                  onChange={(e) => setExecutionType(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {Object.entries(EXECUTION_TYPE_LABELS).map(([value, { label, icon }]) => (
                    <option key={value} value={value}>
                      {icon} {label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Choose how members receive and use this offer.
                </p>
              </div>
            </section>

            {/* Pricing card */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
              <h2 className="mb-1 text-base font-semibold text-slate-800 dark:text-white">
                Pricing
              </h2>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                Enter your supplier cost. NEXUS adds a 30% margin automatically.
                The resulting price is never shown directly to members.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Your cost */}
                <div>
                  <label
                    htmlFor="offer-raw-cost"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Your cost (&#8362;) <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="offer-raw-cost"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={rawCost}
                    onChange={(e) => setRawCost(e.target.value)}
                    placeholder="0.00"
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* Market price (optional) */}
                <div>
                  <label
                    htmlFor="offer-market-price"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Market price (&#8362;){' '}
                    <span className="font-normal text-slate-400">optional</span>
                  </label>
                  <input
                    id="offer-market-price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={marketPrice}
                    onChange={(e) => setMarketPrice(e.target.value)}
                    placeholder="0.00"
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Shown to members as a reference price.
                  </p>
                </div>
              </div>

              {/* Stock limit - optional cap on total redemptions */}
              <div className="mt-4">
                <label
                  htmlFor="offer-stock-limit"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Stock Limit{' '}
                  <span className="font-normal text-xs text-slate-400">
                    optional - leave blank for unlimited
                  </span>
                </label>
                <input
                  id="offer-stock-limit"
                  type="number"
                  min="1"
                  step="1"
                  value={stockLimit}
                  onChange={(e) => setStockLimit(e.target.value)}
                  placeholder="e.g. 50 (leave blank = unlimited)"
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </section>

            {/* Visibility card - hidden for platform admins */}
            {!isPlatformAdmin && (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
                <h2 className="mb-1 text-base font-semibold text-slate-800 dark:text-white">
                  Visibility
                </h2>
                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                  Choose who can see and adopt this offer.
                </p>

                <fieldset>
                  <legend className="sr-only">Offer visibility</legend>
                  <div className="space-y-3">
                    {/* Ecosystem option */}
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="radio"
                        name="visibility"
                        value="ecosystem"
                        checked={visibility === 'ecosystem'}
                        onChange={() => setVisibility('ecosystem')}
                        disabled={isSubmitting}
                        className="mt-0.5 accent-primary"
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          All tenants
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Any tenant in the NEXUS ecosystem can adopt this offer.
                        </span>
                      </span>
                    </label>

                    {/* Tenant-only option */}
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="radio"
                        name="visibility"
                        value="tenant_only"
                        checked={visibility === 'tenant_only'}
                        onChange={() => setVisibility('tenant_only')}
                        disabled={isSubmitting}
                        className="mt-0.5 accent-primary"
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          My tenant only
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Only your own organization can see and use this offer.
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>
              </section>
            )}

            {/* Platform admin visibility note */}
            {isPlatformAdmin && (
              <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-300">
                <span className="material-symbols-rounded !text-[18px]">public</span>
                <span>Platform offers are visible to all tenants in the ecosystem.</span>
              </div>
            )}
          </div>

          {/* ── Right column: image + submit ─────────────────────────────────── */}
          <div className="space-y-5">
            {/* Image upload card */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
              <h2 className="mb-1 text-base font-semibold text-slate-800 dark:text-white">
                Offer Image
              </h2>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                A square or landscape image works best. Max 5 MB.
              </p>

              {/* Hidden file input */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Upload offer image"
                onChange={handleImageChange}
                disabled={isSubmitting}
              />

              {imagePreview ? (
                <div className="space-y-3">
                  {/* Image preview */}
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                    <img
                      src={imagePreview}
                      alt="Offer preview"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                  <p className="truncate text-xs text-slate-500">{imageFile?.name}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={isSubmitting}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      disabled={isSubmitting}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Click to upload image"
                >
                  <span className="material-symbols-rounded !text-3xl">add_photo_alternate</span>
                  <span className="text-sm font-medium">Click to upload</span>
                  <span className="text-xs">PNG, JPG, WEBP up to 5 MB</span>
                </button>
              )}
            </section>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400"
              >
                {error}
              </div>
            )}

            {/* Submit / Cancel actions */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Publishing...
                  </span>
                ) : (
                  'Publish Offer'
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => navigate('/benefits-partnerships')}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateOffer;
