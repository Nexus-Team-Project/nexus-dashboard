/**
 * CreateOfferImagePanel: renders the right-column panel in the CreateOffer form.
 * Contains the image upload card, the inline error alert, and the submit/cancel
 * action buttons. Extracted to keep CreateOffer.tsx under the 350-line limit.
 *
 * The parent (CreateOffer) owns all state and passes it via props, remaining
 * the single source of truth for the form payload.
 *
 * Image upload flow:
 *   1. User clicks the upload area - a hidden <input type="file"> opens.
 *   2. handleImagePick validates type/size, then opens ImageCropModal with an
 *      object URL for the raw file.
 *   3. When the user confirms the crop, handleCropConfirm converts the Blob to a
 *      File and updates the parent's imageFile + imagePreview state.
 *   4. On cancel or after confirm, the temporary object URL is revoked.
 */
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import ImageCropModal from '../components/ImageCropModal';

// ─── Props ────────────────────────────────────────────────────────────────────

/**
 * Props for the image upload panel.
 */
interface ImagePanelProps {
  /** Currently selected image File, or null if none chosen. */
  imageFile: File | null;
  /** Setter for imageFile. */
  setImageFile: (f: File | null) => void;
  /** Object URL for the local preview, or null. */
  imagePreview: string | null;
  /** Setter for imagePreview. */
  setImagePreview: (url: string | null) => void;
  /** Inline error message to display above the action buttons, or null. */
  error: string | null;
  /** Setter for error - used to surface image validation errors. */
  setError: (msg: string | null) => void;
  /** Whether the parent form is currently submitting. */
  isSubmitting: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Image upload card, error alert, and submit/cancel panel for the CreateOffer form.
 *
 * Input: controlled props for image state, error state, and submitting flag.
 * Output: renders a card with file upload UI (drag-to-upload area or preview),
 *         an optional error alert, and Submit + Cancel buttons.
 */
const CreateOfferImagePanel = ({
  imageFile,
  setImageFile,
  imagePreview,
  setImagePreview,
  error,
  setError,
  isSubmitting,
}: ImagePanelProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  /** Ref for the hidden file input triggered by the upload button/area. */
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * Object URL of the raw picked file, used as the source for ImageCropModal.
   * Null when the modal is closed. Revoked after the crop is confirmed or cancelled
   * to avoid memory leaks.
   */
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  /**
   * Validates the selected image file (type + size), then opens the crop modal.
   * The parent's imageFile/imagePreview are NOT updated here - they are updated
   * only after the user confirms the crop in handleCropConfirm.
   *
   * Input:  change event from the hidden file input.
   * Output: sets cropSrc to open the crop modal, or sets error if invalid.
   */
  const handleImagePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('co_errInvalidImage'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('co_errImageSize'));
      return;
    }
    setError(null);
    setCropSrc(URL.createObjectURL(file));
    // Reset the input so the same file can be re-selected after cancel.
    e.target.value = '';
  };

  /**
   * Called when the user confirms a crop selection in ImageCropModal.
   * Converts the Blob to a named File, updates parent state, and revokes
   * the temporary object URL created during pick.
   *
   * Input:  blob - the cropped image as a JPEG Blob from ImageCropModal.
   * Output: updates imageFile + imagePreview; closes the modal.
   */
  const handleCropConfirm = (blob: Blob) => {
    const croppedFile = new File([blob], 'offer-image.jpg', { type: 'image/jpeg' });
    setImageFile(croppedFile);
    setImagePreview(URL.createObjectURL(blob));
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  /**
   * Called when the user dismisses ImageCropModal without confirming.
   * Revokes the temporary object URL and closes the modal without changing state.
   *
   * Input:  none.
   * Output: revokes cropSrc object URL; closes the modal.
   */
  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  /**
   * Removes the selected image and clears the object URL to avoid memory leaks.
   * Input: none.
   * Output: resets imageFile, imagePreview, and the hidden file input value.
   */
  const handleImageRemove = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Image upload card */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card-dark">
        <h2 className="mb-1 text-base font-semibold text-slate-800 dark:text-white">
          {t('co_sectionImage')}
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          {t('co_imageHint')}
        </p>

        {/* Hidden file input triggered by click - onChange opens the crop modal. */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label={t('co_sectionImage')}
          onChange={handleImagePick}
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
                {t('co_btnReplace')}
              </button>
              <button
                type="button"
                onClick={handleImageRemove}
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {t('co_btnRemoveImage')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isSubmitting}
            className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t('co_clickToUpload')}
          >
            <span className="material-symbols-rounded !text-3xl">add_photo_alternate</span>
            <span className="text-sm font-medium">{t('co_clickToUpload')}</span>
            <span className="text-xs">{t('co_imageFormats')}</span>
          </button>
        )}
      </section>

      {/* Inline error alert */}
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
              {t('co_btnPublishing')}
            </span>
          ) : (
            t('co_btnPublish')
          )}
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => navigate('/benefits-partnerships')}
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {t('co_btnCancel')}
        </button>
      </div>
      {/* Crop modal - rendered outside the card so it can be full-screen */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onCrop={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

export default CreateOfferImagePanel;
