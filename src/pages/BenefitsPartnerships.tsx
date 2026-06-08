/**
 * BenefitsPartnerships page - displays the platform catalog of offers/benefits.
 * Wires to real backend data via getPlatformOffers while preserving the existing
 * card/table UI structure. Adoption state is driven by the live API.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPlatformOffers,
  adoptOffer,
  excludeOffer,
  goLiveCatalog,
  activateBenefitsCatalog,
  deactivateBenefitsCatalog,
  deleteOffer,
  approveOfferApi,
  EXECUTION_TYPE_LABELS,
  type CatalogItem,
} from '../lib/api';
import { useCatalogList } from '../hooks/useCatalogList';
import Pagination from '../components/Pagination';
import DenyOfferModal from '../components/DenyOfferModal';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { stripHtml } from '../lib/stripHtml';
import ServiceActivationBanner from '../components/ServiceActivationBanner';
import BenefitsCatalogTeaser from '../components/BenefitsCatalogTeaser';
import ImageLightbox from '../components/ImageLightbox';
import DeleteOfferConfirmModal from '../components/DeleteOfferConfirmModal';
import RichTextDisplay from '../components/RichTextDisplay';
import CatalogTopBar from '../components/catalog/CatalogTopBar';
import CatalogFilterPanel from '../components/catalog/CatalogFilterPanel';
import FieldTooltip from '../components/FieldTooltip';
import { countActiveCatalogFilters } from '../components/catalog/catalogFilters';
import VoucherPricePopover from '../components/catalog/VoucherPricePopover';
import OfferTypeBadge from '../components/catalog/OfferTypeBadge';

interface Benefit {
  id: string;
  isActive: boolean;
  businessId: string;
  businessName: string;
  businessLogo: string;
  backgroundImage?: string;
  /** Full ordered gallery URLs from NexusOffer.imageUrls. Used by the lightbox. */
  galleryImages?: string[];
  implementationMethod: 'voucher' | 'coupon' | 'registration' | 'product' | 'card' | 'service' | 'nexus';
  benefitType: 'percentage' | 'gift' | 'amount';
  usageTerms: string[];
  endDate: string;
  implementationLink: string;
  implementationInstructions: string;
  terms: string;
  description: string;
  category: string;
  categories: string[];
  ribbon?: string;
  // Voucher specific
  voucherAmounts?: number[];
  discountPercentage?: number;
  discountDistribution?: number;
  // Coupon specific
  couponCode?: string;
  // Product specific
  shippingConditions?: string;
  // Display
  featured: boolean;
  image?: string;
  title: string;
  discount: string;
  // Stock tracking
  stockLimit: number | null;
  stockAvailable: number | null;
  isSoldOut: boolean;
  // Optional display tags.
  tags?: string[];
}

/**
 * Active tab in the new Transactions/Users-style top bar.
 * Replaces the previous `displayMode` state. The benefits/businesses split
 * (formerly ViewMode) has been removed.
 */
type CatalogTab = 'cards' | 'table';

// ─── Catalog item mapping helpers ────────────────────────────────────────────

/**
 * Maps an API executionType string to the local Benefit implementationMethod.
 * Falls back to 'nexus' for unknown or undefined values.
 * Input: executionType string from the catalog API.
 * Output: one of the Benefit['implementationMethod'] union members.
 */
function toImplementationMethod(executionType?: string): Benefit['implementationMethod'] {
  const map: Record<string, Benefit['implementationMethod']> = {
    voucher: 'voucher',
    coupon: 'coupon',
    gift_card: 'card',
    product: 'product',
    service: 'service',
  };
  return map[executionType ?? ''] ?? 'nexus';
}

/**
 * Maps an API executionType string to the local Benefit benefitType.
 * Coupons are percentage-based; gift cards are gift type; everything else is amount.
 * Input: executionType string from the catalog API.
 * Output: one of the Benefit['benefitType'] union members.
 */
function toBenefitType(executionType?: string): Benefit['benefitType'] {
  if (executionType === 'coupon') return 'percentage';
  if (executionType === 'gift_card') return 'gift';
  return 'amount';
}

const BenefitsPartnerships = () => {
  const navigate = useNavigate();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  // Cards vs Table tab. Replaces the prior displayMode state.
  const [activeTab, setActiveTab] = useState<CatalogTab>('cards');
  const [benefitActiveStates, setBenefitActiveStates] = useState<Record<string, boolean>>({});

  // ─── Real catalog API state ───────────────────────────────────────────────

  /** Auth context provides catalogMode (inactive|sandbox|live) for the tenant and reloadMe for in-place refresh. */
  const { me, reloadMe } = useAuth();
  /** Language for localized toast messages. */
  const { t, language } = useLanguage();
  const catalogMode = me?.authorization.catalogMode ?? 'inactive';

  /**
   * Owns filters + page + items + total + loading state for the catalog.
   * Debounces search (250ms), guards against race conditions, resets page
   * to 1 when any filter changes. See hooks/useCatalogList.ts for the contract.
   */
  const {
    filters,
    setFilters,
    resetFilters,
    page,
    setPage,
    items: catalogItems,
    total: catalogTotal,
    pages: catalogPages,
    isLoading: isLoadingCatalog,
    refresh: loadCatalog,
  } = useCatalogList({ fetcher: getPlatformOffers });

  // Mirror server adoption state into the toggle state map whenever the
  // current page changes. (Optimistic toggles in handleToggleAdopt update
  // this map directly.)
  useEffect(() => {
    const next: Record<string, boolean> = {};
    catalogItems.forEach((item) => { next[item.offerId] = item.isAdopted; });
    setBenefitActiveStates((prev) => ({ ...prev, ...next }));
  }, [catalogItems]);

  /** offerId of a benefit whose adoption toggle is currently being saved. */
  const [adoptingId, setAdoptingId] = useState<string | null>(null);

  /**
   * State for the voucher price slider popover.
   * Holds the offerId, voucher bounds, current member price, and the anchor
   * button element. Null when the popover is closed.
   */
  const [pricePopover, setPricePopover] = useState<null | {
    offerId: string;
    faceValue: number;
    nexusCost: number;
    currentMemberPrice: number;
    anchor: HTMLElement;
  }>(null);

  /**
   * Per-offer optimistic price overrides keyed by offerId. Applied at render
   * time so the table reflects the new price immediately while the next
   * refresh re-syncs from the server.
   */
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});

  /** True while /api/me is being re-fetched after a service state change. Shows loading skeleton. */
  const [isRefreshing, setIsRefreshing] = useState(false);
  /** True while the activation API call is in-flight (drives teaser button spinner). */
  const [isActivating, setIsActivating] = useState(false);

  /**
   * Lightbox state. When non-null carries the full ordered gallery for the
   * offer the user clicked on, plus the index to open at. Null when closed.
   * An offer with one image still passes through here so the lightbox UX is
   * uniform; the lightbox itself hides nav controls for single-image cases.
   */
  const [lightboxGallery, setLightboxGallery] = useState<
    { images: string[]; initialIndex: number } | null
  >(null);


  /** CatalogItem pending deletion confirmation, or null when no deletion is in progress. */
  const [deletingOffer, setDeletingOffer] = useState<CatalogItem | null>(null);

  /** CatalogItem pending denial in DenyOfferModal, or null when the modal is closed. */
  const [denyTarget, setDenyTarget] = useState<CatalogItem | null>(null);

  /** True when the authenticated user is a NEXUS platform admin. */
  const isPlatformAdmin = me?.authorization?.isPlatformAdmin === true;
  /** True while the delete API call is in-flight. Prevents double-submit and closes the modal. */
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Toggles adopt/unadopt for a catalog offer via the backend API.
   * Uses optimistic updates: flips UI immediately and reverts on error.
   * Input: offerId - the offer to toggle; currentlyAdopted - its current server state.
   * Output: void; reverts on failure to keep UI consistent with server state.
   */
  const handleToggleAdopt = async (offerId: string, currentlyAdopted: boolean) => {
    if (!currentlyAdopted) {
      const target = catalogItems.find(i => i.offerId === offerId);

      // Block adoption of offers pending platform review.
      if (target?.approval_status === 'pending_approval') {
        toast.error(
          language === 'he'
            ? 'לא ניתן לאמץ הצעה זו – היא ממתינה לאישור מנהל NEXUS'
            : 'Cannot adopt this offer – it is pending NEXUS admin approval'
        );
        return;
      }

      // Block adoption until the tenant has completed business setup.
      if (!me?.authorization.businessSetupComplete) {
        toast.error(
          language === 'he'
            ? 'יש להשלים את הגדרת העסק לפני אימוץ הצעות'
            : 'Complete your business setup before adopting offers'
        );
        return;
      }
    }
    // Optimistic UI: flip the local toggle map immediately. The cards/table
    // read from benefitActiveStates so the badge updates without waiting for
    // the server. On error we revert + force a re-fetch to make sure the
    // visible state matches the server.
    setBenefitActiveStates((prev) => ({ ...prev, [offerId]: !currentlyAdopted }));
    setAdoptingId(offerId);
    try {
      if (currentlyAdopted) {
        await excludeOffer(offerId);
      } else {
        await adoptOffer(offerId);
      }
      // Refresh the current page so isAdopted on the item matches the server.
      await loadCatalog();
    } catch {
      setBenefitActiveStates((prev) => ({ ...prev, [offerId]: currentlyAdopted }));
      // Best-effort re-sync.
      await loadCatalog();
    } finally {
      setAdoptingId(null);
    }
  };

  /**
   * Activates the Benefits Catalog service and refreshes /api/me in-place.
   * Shows loading skeleton during the refresh; no page reload needed.
   */
  const handleActivateCatalog = async () => {
    setIsActivating(true);
    try {
      await activateBenefitsCatalog();
      setIsRefreshing(true);
      await reloadMe();
    } catch (err) {
      console.error('[handleActivateCatalog] Failed to activate catalog:', err);
      toast.error('שגיאה בהפעלת השירות. נסה שוב.');
    } finally {
      setIsActivating(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Transitions the tenant catalog from sandbox to live and refreshes /api/me.
   * No page reload needed.
   */
  const handleGoLiveCatalog = async () => {
    try {
      await goLiveCatalog();
      setIsRefreshing(true);
      await reloadMe();
    } catch (err) {
      console.error('[handleGoLiveCatalog] Failed to go live:', err);
      toast.error('שגיאה במעבר ל-live. נסה שוב.');
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Deactivates the Benefits Catalog service and refreshes /api/me in-place.
   * No page reload needed.
   */
  const handleDeactivateCatalog = async () => {
    try {
      const result = await deactivateBenefitsCatalog();
      toast.success(`שירות הושבת. ${result.offersDeactivated} הצעות הושהו.`);
      setIsRefreshing(true);
      await reloadMe();
    } catch (err) {
      console.error('[handleDeactivateCatalog] Failed to deactivate catalog:', err);
      toast.error('שגיאה בהשבתת השירות. נסה שוב.');
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Returns true when the current user may edit offer fields.
   * Platform admins can edit any offer; supply managers only edit their own.
   * Input: CatalogItem to check ownership of.
   * Output: boolean.
   */
  const canEditOffer = (item: CatalogItem): boolean => {
    if (me?.authorization.isPlatformAdmin === true) return true;
    const myTenantId = me?.context?.tenantId;
    return !!myTenantId && item.createdByTenantId === myTenantId;
  };

  /**
   * Whether the caller can edit the per-tenant voucher member price on this row.
   * True when the caller's tenant has adopted the offer OR created it. The backend
   * returns `tenantMemberPrice` only when an active TenantOfferConfig exists for
   * the caller's tenant, so its presence is the cleanest adoption signal.
   * Adopting tenants get this even when they cannot edit the offer itself.
   * Input: catalog item.
   * Output: boolean.
   */
  const canEditTenantPrice = (item: CatalogItem): boolean => {
    if (item.tenantMemberPrice !== undefined) return true;
    const myTenantId = me?.context?.tenantId;
    return !!myTenantId && item.createdByTenantId === myTenantId;
  };


  /**
   * Permanently deletes an offer and its Cloudinary image.
   * Uses the deletingOffer state for the target offer.
   * Input: none (reads deletingOffer state).
   * Output: closes modal and refreshes the catalog on success; shows toast on failure.
   */
  const handleDeleteOffer = async () => {
    if (!deletingOffer) return;
    setIsDeleting(true);
    try {
      await deleteOffer(deletingOffer.offerId);
      setDeletingOffer(null);
      await loadCatalog();
      toast.success('ההצעה נמחקה בהצלחה');
    } catch {
      toast.error('מחיקה נכשלה. נסה שוב.');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Approves a pending ecosystem voucher offer (platform admin only).
   * Transitions the offer from 'pending_approval' to 'active' status.
   * Input: offerId - the offer to approve.
   * Output: void; reloads catalog on success; shows toast on failure.
   */
  const handleApproveOffer = async (offerId: string) => {
    try {
      await approveOfferApi(offerId);
      toast.success(language === 'he' ? 'ההצעה אושרה בהצלחה' : 'Offer approved successfully');
      await loadCatalog();
    } catch {
      toast.error(language === 'he' ? 'שגיאה באישור ההצעה' : 'Failed to approve offer');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  // Initialize active states from data
  useEffect(() => {
    const benefitStates: Record<string, boolean> = {};
    benefits.forEach(benefit => {
      benefitStates[benefit.id] = benefit.isActive;
    });
    setBenefitActiveStates(benefitStates);
  }, []);

  const categories = [
    { id: 'all', label: 'כל הקטגוריות', icon: 'apps' },
    { id: 'food_beverage', label: 'אוכל ומשקאות', icon: 'restaurant' },
    { id: 'fashion', label: 'אופנה', icon: 'checkroom' },
    { id: 'health_wellness', label: 'בריאות ורווחה', icon: 'spa' },
    { id: 'entertainment', label: 'בידור', icon: 'theater_comedy' },
    { id: 'travel', label: 'טיסות ונופש', icon: 'flight' },
    { id: 'technology', label: 'טכנולוגיה', icon: 'devices' },
    { id: 'education', label: 'חינוך', icon: 'school' },
    { id: 'financial', label: 'פיננסי', icon: 'account_balance' },
    { id: 'home_living', label: 'בית ומגורים', icon: 'home' },
    { id: 'other', label: 'אחר', icon: 'category' },
  ];

  // Mock benefits data
  const benefits: Benefit[] = [
    {
      id: '1',
      isActive: true,
      businessId: 'b1',
      businessName: 'Wolt',
      businessLogo: '🍔',
      backgroundImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
      implementationMethod: 'voucher',
      benefitType: 'percentage',
      usageTerms: ['כולל כפל מבצעים', 'חנויות פיזיות', 'אתרי סחר'],
      endDate: '31/12/2024',
      implementationLink: 'https://wolt.com/promo',
      implementationInstructions: 'הזן את הקוד בקופה',
      terms: 'ההנחה תקפה עד 100 ₪ להזמנה',
      description: 'הנחה על כל הזמנה מעל 50 ₪',
      categories: ['food'],
      voucherAmounts: [200, 300, 500],
      discountPercentage: 25,
      discountDistribution: 80,
      featured: true,
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
      title: 'הנחה על ארוחות',
      discount: '25% הנחה',
      category: 'food',
      stockLimit: null,
      stockAvailable: null,
      isSoldOut: false,
    },
    {
      id: '2',
      isActive: true,
      businessId: 'b2',
      businessName: 'Amazon',
      businessLogo: '📦',
      backgroundImage: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&h=600&fit=crop',
      implementationMethod: 'coupon',
      benefitType: 'gift',
      usageTerms: ['אתרי סחר', 'ללא הגבלת זמן'],
      endDate: '31/12/2025',
      implementationLink: 'https://amazon.com',
      implementationInstructions: 'השתמש בקוד באתר',
      terms: 'תקף לכל ההזמנות ללא מינימום',
      description: 'משלוח חינם ללא הגבלה למשך שנה',
      categories: ['shopping'],
      couponCode: 'NEXUS2024FREE',
      featured: true,
      image: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&h=600&fit=crop',
      title: 'משלוח חינם',
      discount: 'משלוח חינם',
      category: 'shopping',
      stockLimit: null,
      stockAvailable: null,
      isSoldOut: false,
    },
    {
      id: '3',
      isActive: false,
      businessId: 'b1',
      businessName: 'Wolt',
      businessLogo: '🍔',
      implementationMethod: 'product',
      benefitType: 'amount',
      usageTerms: ['חנויות פיזיות'],
      endDate: '30/06/2024',
      implementationLink: 'https://wolt.com',
      implementationInstructions: 'הזמן דרך האפליקציה',
      terms: 'למנויים חדשים בלבד',
      description: 'ארוחה במתנה',
      categories: ['food'],
      shippingConditions: 'משלוח חינם',
      featured: false,
      title: 'ארוחה חינם',
      discount: 'ארוחה במתנה',
      category: 'food',
      stockLimit: null,
      stockAvailable: null,
      isSoldOut: false,
    },
  ];

  /**
   * Maps a CatalogItem from the backend API into the local Benefit shape so it
   * can populate the existing card and table JSX without structural changes.
   * market_price is used as the display price when available; executionType drives
   * the implementationMethod and benefitType fields; stockLimit provides usageTerms hints.
   */
  const catalogAsBenefits: Benefit[] = catalogItems.map(item => ({
    id: item.offerId,
    isActive: item.isAdopted,
    businessId: item.createdByTenantId,
    businessName: item.title,
    businessLogo: '',
    backgroundImage: item.imageUrl,
    galleryImages: (item.imageUrls && item.imageUrls.length > 0)
      ? item.imageUrls
      : (item.imageUrl ? [item.imageUrl] : []),
    implementationMethod: toImplementationMethod(item.executionType),
    benefitType: toBenefitType(item.executionType),
    usageTerms: item.stockLimit !== null
      ? [item.isSoldOut ? 'מכירה נגמרה' : `${item.stockAvailable ?? item.stockLimit} נותרו`]
      : [],
    endDate: item.validUntil ? new Date(item.validUntil).toLocaleDateString('he-IL') : '',
    implementationLink: item.implementationLink ?? '',
    implementationInstructions: item.implementationInstructions ?? '',
    terms: item.terms ?? '',
    description: item.description,
    category: item.category,
    categories: [item.category],
    featured: false,
    image: item.imageUrl,
    title: item.title,
    discount: (() => {
      // Price resolution for the cards view. Must mirror the table view's
      // editable popover: optimistic override (from priceOverrides) wins,
      // then the per-tenant override (tenantMemberPrice) from the backend,
      // then voucher uses member_price, non-voucher prefers market_price.
      const override = priceOverrides[item.offerId];
      if (override != null) return `₪${override}`;
      if (item.tenantMemberPrice != null) return `₪${item.tenantMemberPrice}`;
      if (item.executionType === 'voucher') {
        if (item.member_price != null) return `₪${item.member_price}`;
        return '';
      }
      if (item.market_price != null) return `₪${item.market_price}`;
      if (item.member_price != null) return `₪${item.member_price}`;
      return '';
    })(),
    stockLimit: item.stockLimit,
    stockAvailable: item.stockAvailable,
    isSoldOut: item.isSoldOut,
    tags: item.tags ?? [],
  }));

  // Server-side filtering means catalogAsBenefits IS the filtered set. Featured
  // / regular split is kept for the card layout (mock data is no longer mixed in).
  const filteredBenefits = catalogAsBenefits;
  const activeFilterCount = countActiveCatalogFilters(filters);

  /**
   * Grid breakpoints for the cards view. When the filter aside is open it
   * eats ~380px of the content column on lg+ screens, so a 3-column grid at
   * lg becomes too tight (~200px per card). Shift the third-column breakpoint
   * up to xl whenever the aside is open. Keeps cards readable in both states.
   */
  const cardsGridCols = isFilterPanelOpen
    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  // Localized category options for the filter panel (drops the 'all' entry —
  // CatalogFilterPanel renders its own All chip per field group).
  const filterCategoryOptions = categories
    .filter((c) => c.id !== 'all')
    .map((c) => ({ value: c.id, label: c.label }));

  const featuredBenefits = filteredBenefits.filter((b) => b.featured);
  const regularBenefits = filteredBenefits.filter((b) => !b.featured);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food_beverage:   'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      fashion:         'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
      health_wellness: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
      entertainment:   'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      travel:          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      technology:      'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
      education:       'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      financial:       'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      home_living:     'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
      other:           'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
      // Legacy IDs for mock businesses table
      food:            'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      shopping:        'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
      wellness:        'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
      tech:            'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    };
    return colors[category] ?? 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400';
  };

  const handleBenefitClick = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setShowBenefitModal(true);
  };

  // When the catalog service is inactive, show the teaser page instead of the full catalog UI.
  // Platform admins always see the full catalog regardless of activation state.
  if (catalogMode === 'inactive' && !isPlatformAdmin) {
    return (
      <>
        <BenefitsCatalogTeaser
          onActivate={handleActivateCatalog}
          isActivating={isActivating}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {/* Service activation lifecycle banner — tenant admins only; platform admins manage the platform, not tenant services */}
        {!isPlatformAdmin && (
          <ServiceActivationBanner
            config={{
              name: 'שירות קטלוג ההטבות',
              inactiveNote: language === 'he' ? 'הפעל כדי לאפשר לחברים לצפות ולרכוש הטבות. ניתן לבטל בכל עת.' : 'Activate to let members browse and redeem benefits. You can disable at any time.',
              sandboxNote: t('bp_catalogSandboxNote'),
            }}
            mode={isRefreshing ? 'loading' : catalogMode}
            onActivate={handleActivateCatalog}
            onGoLive={handleGoLiveCatalog}
            onDisable={handleDeactivateCatalog}
            goLiveDisabled={me?.authorization.businessSetupComplete !== true}
          />
        )}

        {/* Hero Section */}
        <section className="relative py-10 md:py-28 flex flex-col items-center text-center overflow-hidden">
          {/* Floating Logos - hidden on mobile to avoid overlapping the heading. */}
          <div className="hidden md:block absolute inset-0 pointer-events-auto">
            {/* Brand 1 - Samsung */}
            <div className="group absolute top-10 left-10 md:left-20 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center p-4 animate-[float_6s_ease-in-out_infinite] cursor-pointer hover:scale-110 transition-transform">
              <img src="/brands/samsung.png" alt="Samsung" className="w-full h-full object-contain" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                Samsung
              </div>
            </div>

            {/* Brand 2 - Mango */}
            <div className="group absolute bottom-20 left-4 md:left-40 w-12 h-12 md:w-20 md:h-20 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center p-4 animate-[float_6s_ease-in-out_infinite] [animation-delay:-2s] cursor-pointer hover:scale-110 transition-transform">
              <img src="/brands/mango.png" alt="Mango" className="w-full h-full object-contain" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                Mango
              </div>
            </div>

            {/* Brand 3 - Carrefour */}
            <div className="group absolute top-1/2 left-0 w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center p-3 animate-[float_6s_ease-in-out_infinite] [animation-delay:-4s] cursor-pointer hover:scale-110 transition-transform">
              <img src="/brands/carrefour.png" alt="Carrefour" className="w-full h-full object-contain" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                Carrefour
              </div>
            </div>

            {/* Brand 4 - Foot Locker */}
            <div className="group absolute top-12 right-10 md:right-20 w-16 h-16 md:w-24 md:h-24 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center p-4 animate-[float_6s_ease-in-out_infinite] [animation-delay:-1s] cursor-pointer hover:scale-110 transition-transform">
              <img src="/brands/foot-locker.png" alt="Foot Locker" className="w-full h-full object-contain" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                Foot Locker
              </div>
            </div>

            {/* Brand 5 - Magnolia */}
            <div className="group absolute bottom-24 right-4 md:right-40 w-14 h-14 md:w-22 md:h-22 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center p-5 animate-[float_6s_ease-in-out_infinite] [animation-delay:-3.5s] cursor-pointer hover:scale-110 transition-transform">
              <img src="/brands/magnolia.png" alt="Magnolia" className="w-full h-full object-contain" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                Magnolia
              </div>
            </div>

            {/* Brand 6 - Golf */}
            <div className="group absolute top-1/2 right-0 w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center p-3 animate-[float_6s_ease-in-out_infinite] [animation-delay:-5s] cursor-pointer hover:scale-110 transition-transform">
              <img src="/brands/golf.png" alt="Golf" className="w-full h-full object-contain" />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                Golf
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-6xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6 leading-tight tracking-tight px-2">
              הטבות ושיתופי פעולה עם המותגים האהובים עליכם
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed px-2">
              גלו הנחות בלעדיות, קאשבק ותגמולים מיוחדים כשאתם קונים דרך Nexus
            </p>
            {/* Search bar removed - search now lives in the top bar / filter panel. */}
          </div>
        </section>

        {/* Layout: content + inline filter aside. Mirrors Transactions/Users
            but docks the panel on the side opposite the reading direction:
            English (LTR) -> panel on LEFT, Hebrew (RTL) -> panel on RIGHT.
            `lg:flex-row-reverse` puts DOM child #2 (the aside) at the visual
            start of the main axis, which flips automatically with the page
            direction. The page does not dim; cards/table simply reflow. */}
        <div className="flex flex-col lg:flex-row-reverse gap-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex-1 min-w-0">

        {/* Top bar - Transactions/Users-style tabs + toolbar.
            Replaces the prior category-button row + benefits/businesses toggle +
            display-mode icons + results count + Create-Offer block. */}
        <section className="pb-6">
          <CatalogTopBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchValue={filters.search}
            onSearchChange={(v) => setFilters({ ...filters, search: v })}
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setIsFilterPanelOpen(true)}
            resultsCount={catalogTotal}
            showCreateOffer={isPlatformAdmin || catalogMode !== 'inactive'}
            onCreateOffer={() => navigate('/supply/create')}
          />
        </section>

        {/* Admin Table View - shown when the Table tab is active. */}
        {activeTab === 'table' && (
          <section className="py-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                {/* Benefits table — 13 read-only columns mirroring the offer form fields.
                    Edits happen via the row Edit button (gated by canEditOffer). */}
                <table className="w-full min-w-max">
                    {/* 13 read-only columns. Shared header cell class kept inline below
                        for clarity (every column uses the same look now that there is no
                        per-column violet/green tint or read-only/editable subtitle). */}
                    <thead className="bg-violet-50 dark:bg-slate-800 border-b-2 border-violet-200/60 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-bold text-primary/70 dark:text-slate-400 uppercase tracking-wider sticky right-0 bg-violet-50 dark:bg-slate-800 z-10">
                          <span className="inline-flex items-center">
                            {language === 'he' ? 'סטטוס' : 'Status'}
                            <FieldTooltip fieldKey="bpcStatus" placement="bottom" />
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-primary/70 dark:text-slate-400 uppercase tracking-wider">
                          <span className="inline-flex items-center">
                            {language === 'he' ? 'תמונה' : 'Image'}
                            <FieldTooltip fieldKey="bpcImage" placement="bottom" />
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-primary/70 dark:text-slate-400 uppercase tracking-wider">
                          <span className="inline-flex items-center">
                            {language === 'he' ? 'כותרת' : 'Title'}
                            <FieldTooltip fieldKey="title" placement="bottom" />
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-primary/70 dark:text-slate-400 uppercase tracking-wider">
                          <span className="inline-flex items-center">
                            {language === 'he' ? 'תיאור' : 'Description'}
                            <FieldTooltip fieldKey="description" placement="bottom" />
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-primary/70 dark:text-slate-400 uppercase tracking-wider">
                          <span className="inline-flex items-center">
                            {language === 'he' ? 'קטגוריה' : 'Category'}
                            <FieldTooltip fieldKey="category" placement="bottom" />
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-primary/70 dark:text-slate-400 uppercase tracking-wider">
                          <span className="inline-flex items-center">
                            {language === 'he' ? 'אופן מימוש' : 'Offer Type'}
                            <FieldTooltip fieldKey="executionType" placement="bottom" />
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-primary/70 dark:text-slate-400 uppercase tracking-wider">
                          <span className="inline-flex items-center">
                            {language === 'he' ? 'נראות' : 'Visibility'}
                            <FieldTooltip fieldKey="visibility" placement="bottom" />
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-primary/70 dark:text-slate-400 uppercase tracking-wider">
                          <span className="inline-flex items-center">
                            {language === 'he' ? 'מחיר' : 'Price'}
                            <FieldTooltip fieldKey="bpcPrice" placement="bottom" />
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-primary/70 dark:text-slate-400 uppercase tracking-wider">
                          <span className="inline-flex items-center">
                            {language === 'he' ? 'מלאי' : 'Stock'}
                            <FieldTooltip fieldKey="stockLimit" placement="bottom" />
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-primary/70 dark:text-slate-400 uppercase tracking-wider">
                          <span className="inline-flex items-center">
                            {language === 'he' ? 'בתוקף מ-' : 'Valid From'}
                            <FieldTooltip fieldKey="validFrom" placement="bottom" />
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-primary/70 dark:text-slate-400 uppercase tracking-wider">
                          <span className="inline-flex items-center">
                            {language === 'he' ? 'בתוקף עד' : 'Valid Until'}
                            <FieldTooltip fieldKey="validUntil" placement="bottom" />
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-primary/70 dark:text-slate-400 uppercase tracking-wider">
                          <span className="inline-flex items-center">
                            {language === 'he' ? 'תגיות' : 'Tags'}
                            <FieldTooltip fieldKey="tags" placement="bottom" />
                          </span>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-primary/70 dark:text-slate-400 uppercase tracking-wider">
                          <span className="inline-flex items-center">
                            {language === 'he' ? 'פעולות' : 'Actions'}
                            <FieldTooltip fieldKey="bpcActions" placement="bottom" />
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(() => {
                        /* Cell helpers local to this render. The IIFE keeps them
                           private to the table without polluting the component scope. */
                        const np = t('bp_notProvided');
                        const formatPrice = (n: number | null | undefined): string =>
                          n == null ? np : `₪${n}`;
                        const formatDate = (d: Date | string | null | undefined): string => {
                          if (d == null || d === '') return np;
                          return new Date(d).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US');
                        };
                        /* O(1) lookup from offerId back to the full CatalogItem, which
                           carries fields the local Benefit shape does not (visibility,
                           approval_status, validFrom, member_price, market_price...). */
                        const itemMap = new Map(catalogItems.map(c => [c.offerId, c]));
                        return filteredBenefits.map((benefit) => {
                          const item = itemMap.get(benefit.id);
                          if (!item) return null;
                          const editable = canEditOffer(item);
                          const canEditPrice = canEditTenantPrice(item);
                          const categoryLabel = categories.find((c) => c.id === item.category)?.label ?? item.category;
                          const isVoucher = item.executionType === 'voucher';
                          const executionLabel = EXECUTION_TYPE_LABELS[item.executionType]
                            ? (language === 'he'
                                ? EXECUTION_TYPE_LABELS[item.executionType].labelHe
                                : EXECUTION_TYPE_LABELS[item.executionType].label)
                            : item.executionType;
                          // Read-only price for the table cell. The editable
                          // voucher button branch handles its own override
                          // resolution; this branch fires for non-vouchers and
                          // for vouchers the caller cannot edit. In both cases
                          // a per-tenant override (tenantMemberPrice) must win
                          // over the offer-level price.
                          const priceValue = item.tenantMemberPrice != null
                            ? item.tenantMemberPrice
                            : isVoucher
                              ? (item.member_price ?? null)
                              : (item.market_price ?? null);
                          const descPlain = stripHtml(item.description);
                          const tagsList = item.tags ?? [];
                          const visibility = item.visibility;
                          return (
                            <tr key={benefit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">

                              {/* 1. Status — toggle (tenant) or approve/deny (platform admin pending) or badge. */}
                              <td className="px-4 py-4 sticky right-0 bg-white dark:bg-slate-900 z-10 align-top">
                                {isPlatformAdmin ? (
                                  item.approval_status === 'pending_approval' ? (
                                    <div className="flex flex-col gap-1.5">
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); void handleApproveOffer(item.offerId); }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                                      >
                                        {t('co_allowOffer')}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setDenyTarget(item); }}
                                        className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                                      >
                                        {t('co_denyOffer')}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={cn(
                                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                      item.approval_status === 'denied'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : item.approval_status === 'active'
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    )}>
                                      {item.approval_status === 'denied'
                                        ? t('co_denied')
                                        : item.approval_status === 'active'
                                          ? (language === 'he' ? 'פעיל' : 'Active')
                                          : (language === 'he' ? 'לא פעיל' : 'Inactive')}
                                    </span>
                                  )
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleToggleAdopt(benefit.id, benefitActiveStates[benefit.id] ?? false);
                                    }}
                                    disabled={adoptingId === benefit.id}
                                    aria-label={benefitActiveStates[benefit.id] ? 'Unadopt offer' : 'Adopt offer'}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all hover:ring-2 hover:ring-cyan-400 hover:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed ${
                                      benefitActiveStates[benefit.id] ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        benefitActiveStates[benefit.id] ? '-translate-x-1' : '-translate-x-5'
                                      }`}
                                    />
                                  </button>
                                )}
                              </td>

                              {/* 2. Image — cover thumbnail; click for full-screen lightbox. */}
                              <td className="px-4 py-4 align-top">
                                {item.imageUrl ? (
                                  <div className="relative inline-block">
                                    <img
                                      src={item.imageUrl}
                                      alt={item.title}
                                      className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-700 cursor-zoom-in"
                                      onClick={() => {
                                        // Open the lightbox on the cover, but
                                        // hand it the full ordered gallery so
                                        // the user can flip through every image.
                                        const images = (item.imageUrls && item.imageUrls.length > 0)
                                          ? item.imageUrls
                                          : (item.imageUrl ? [item.imageUrl] : []);
                                        if (images.length === 0) return;
                                        setLightboxGallery({ images, initialIndex: 0 });
                                      }}
                                    />
                                    {/* Subtle multi-image badge: shows "+N" in the
                                        corner when the offer has more than one image
                                        so admins know clicking opens a gallery. */}
                                    {item.imageUrls && item.imageUrls.length > 1 && (
                                      <span
                                        aria-label={`${item.imageUrls.length} images`}
                                        className="pointer-events-none absolute -top-1 -end-1 rounded-full bg-slate-900/85 text-white text-[10px] leading-none px-1.5 py-0.5 font-medium"
                                        dir="ltr"
                                      >
                                        +{item.imageUrls.length - 1}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    aria-label={t('bp_imageMissingAlt')}
                                    className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center"
                                  >
                                    <span className="material-icons text-base text-slate-400">image</span>
                                  </div>
                                )}
                              </td>

                              {/* 3. Title. */}
                              <td className="px-4 py-4 align-top">
                                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-[200px]">
                                  {item.title}
                                </span>
                              </td>

                              {/* 4. Description — HTML stripped to plain text for table display. */}
                              <td className="px-4 py-4 align-top">
                                <span className={cn(
                                  'block text-sm line-clamp-2 max-w-[300px]',
                                  descPlain ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 italic',
                                )}>
                                  {descPlain || np}
                                </span>
                              </td>

                              {/* 5. Category — colored chip. */}
                              <td className="px-4 py-4 align-top">
                                <span className={cn(
                                  'inline-flex items-center text-xs px-2.5 py-1 rounded-full whitespace-nowrap',
                                  getCategoryColor(item.category),
                                )}>
                                  {categoryLabel}
                                </span>
                              </td>

                              {/* 6. Offer Type — localized label from EXECUTION_TYPE_LABELS. */}
                              <td className="px-4 py-4 align-top">
                                <span className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                  {executionLabel}
                                </span>
                              </td>

                              {/* 7. Visibility — green chip for ecosystem, slate for tenant-only. */}
                              <td className="px-4 py-4 align-top">
                                <span className={cn(
                                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
                                  visibility === 'tenant_only'
                                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                )}>
                                  {visibility === 'tenant_only'
                                    ? t('bp_visibilityTenant')
                                    : t('bp_visibilityEcosystem')}
                                </span>
                              </td>

                              {/* 8. Price - member_price for vouchers, market_price otherwise.
                                  Voucher rows the caller can edit open the slider popover. */}
                              <td className="px-4 py-4 align-top">
                                {isVoucher && canEditPrice && item.face_value !== undefined && item.nexus_cost !== undefined ? (
                                  (() => {
                                    const effectivePrice =
                                      priceOverrides[item.offerId] ??
                                      item.tenantMemberPrice ??
                                      item.member_price ??
                                      (item.nexus_cost as number);
                                    return (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPricePopover({
                                            offerId: item.offerId,
                                            faceValue: item.face_value as number,
                                            nexusCost: item.nexus_cost as number,
                                            currentMemberPrice: effectivePrice,
                                            anchor: e.currentTarget,
                                          });
                                        }}
                                        title={t('vp_clickToEdit')}
                                        aria-label={t('vp_clickToEdit')}
                                        className="group inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-semibold tabular-nums text-slate-900 hover:border-primary/30 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                                      >
                                        <svg
                                          className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth={1.75}
                                          viewBox="0 0 24 24"
                                          aria-hidden="true"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                                        </svg>
                                        <span>{`₪${effectivePrice}`}</span>
                                      </button>
                                    );
                                  })()
                                ) : (
                                  <span className={cn(
                                    'text-sm font-semibold tabular-nums whitespace-nowrap',
                                    priceValue == null
                                      ? 'text-slate-400 italic font-normal'
                                      : 'text-slate-900 dark:text-slate-100',
                                  )}>
                                    {formatPrice(priceValue)}
                                  </span>
                                )}
                              </td>

                              {/* 9. Stock — Unlimited / available/limit / Sold out. */}
                              <td className="px-4 py-4 align-top">
                                {item.stockLimit == null ? (
                                  <span className="text-sm text-slate-500 italic whitespace-nowrap">
                                    {t('bp_unlimitedStock')}
                                  </span>
                                ) : item.isSoldOut ? (
                                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400 whitespace-nowrap">
                                    {t('bp_soldOut')}
                                  </span>
                                ) : (
                                  <span className="text-sm text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                                    {item.stockAvailable} / {item.stockLimit}
                                  </span>
                                )}
                              </td>

                              {/* 10. Valid From. */}
                              <td className="px-4 py-4 align-top">
                                <span className={cn(
                                  'text-sm whitespace-nowrap',
                                  item.validFrom ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 italic',
                                )}>
                                  {formatDate(item.validFrom)}
                                </span>
                              </td>

                              {/* 11. Valid Until. */}
                              <td className="px-4 py-4 align-top">
                                <span className={cn(
                                  'text-sm whitespace-nowrap',
                                  item.validUntil ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 italic',
                                )}>
                                  {formatDate(item.validUntil)}
                                </span>
                              </td>

                              {/* 12. Tags — first 3 chips + "+N" overflow badge. */}
                              <td className="px-4 py-4 align-top">
                                {tagsList.length === 0 ? (
                                  <span className="text-sm text-slate-400 italic">{np}</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {tagsList.slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {tagsList.length > 3 && (
                                      <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        +{tagsList.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* 13. Actions — Edit + Delete, gated by canEditOffer. */}
                              <td className="px-4 py-4 align-top text-center">
                                {editable ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); navigate(`/benefits-partnerships/edit-offer/${item.offerId}`); }}
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                      aria-label={language === 'he' ? 'ערוך הצעה' : 'Edit offer'}
                                    >
                                      <span className="material-icons text-[14px]">edit</span>
                                      {language === 'he' ? 'ערוך' : 'Edit'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setDeletingOffer(item); }}
                                      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 w-7 h-7 transition-colors dark:border-red-900/40 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-900/20"
                                      aria-label={language === 'he' ? 'מחק הצעה' : 'Delete offer'}
                                    >
                                      <span className="material-icons text-[14px]">delete</span>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>

                {/* Businesses-table branch removed in the redesign. */}
              </div>

              {/* Empty state - shown when the filtered set is empty in Table view. */}
              {filteredBenefits.length === 0 && (
                <div className="py-20 text-center">
                  <span className="material-icons text-slate-300 dark:text-slate-600 text-6xl mb-4">
                    search_off
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {t('bp_emptyFiltered')}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">נסה לשנות את החיפוש או הסינון</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Benefits View - cards grid; shown when the Cards tab is active. */}
        {activeTab === 'cards' && (
          <section className="py-12 space-y-8">
            {/* Skeleton while initial catalog load is in-flight */}
            {isLoadingCatalog && (
              <div className={cn('grid gap-4', cardsGridCols)}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white h-48" />
                ))}
              </div>
            )}

            {/* Empty state - shown when loaded but no offers match the current filters. */}
            {!isLoadingCatalog && filteredBenefits.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-slate-500 text-sm font-medium">
                  {catalogMode === 'inactive'
                    ? 'הפעל את שירות קטלוג ההטבות כדי לצפות בהצעות'
                    : 'אין הצעות זמינות עדיין. צור הצעה ראשונה.'}
                </p>
              </div>
            )}

            {/* Featured Benefits */}
            {!isLoadingCatalog && featuredBenefits.length > 0 && (
              <div className={cn('grid gap-6', cardsGridCols)}>
                {featuredBenefits.map((benefit) => {
                  // Look up the original CatalogItem to access execution type and stock fields.
                  const catalogItem = catalogItems.find(c => c.offerId === benefit.id);
                  return (
                    <div
                      key={benefit.id}
                      className="group bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col cursor-pointer"
                      onClick={() => handleBenefitClick(benefit)}
                    >
                      {/* Image */}
                      <div className="h-64 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                        {benefit.backgroundImage ? (
                          <>
                            <img
                              src={benefit.backgroundImage}
                              alt={benefit.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 cursor-zoom-in"
                              onClick={(e) => {
                                e.stopPropagation();
                                const images = (benefit.galleryImages && benefit.galleryImages.length > 0)
                                  ? benefit.galleryImages
                                  : (benefit.backgroundImage ? [benefit.backgroundImage] : []);
                                if (images.length === 0) return;
                                setLightboxGallery({ images, initialIndex: 0 });
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            {/* Multi-image indicator: small badge in the corner
                                so users know there's a gallery to flip through. */}
                            {benefit.galleryImages && benefit.galleryImages.length > 1 && (
                              <span
                                aria-label={`${benefit.galleryImages.length} images`}
                                className="pointer-events-none absolute top-2 end-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white"
                                dir="ltr"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                                {benefit.galleryImages.length}
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl">
                            {benefit.businessLogo}
                          </div>
                        )}
                        {/* Pending-approval overlay */}
                        {catalogItem?.approval_status === 'pending_approval' && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 px-3 py-1 text-xs font-semibold text-amber-900 shadow">
                              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h3.25a.75.75 0 000-1.5h-2.5V5z" clipRule="evenodd" /></svg>
                              {language === 'he' ? 'ממתין לאישור' : 'Pending Approval'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-8 flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          {benefit.businessLogo ? (
                            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 text-xl shrink-0">
                              {benefit.businessLogo}
                            </div>
                          ) : null}
                          <h3 className="font-semibold text-lg text-slate-900 dark:text-white leading-snug">{benefit.businessName}</h3>
                        </div>
                        <div className="mb-4">
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                            {benefit.discount}
                          </div>
                          {/* Execution type badge - bilingual, type-coloured. */}
                          {catalogItem?.executionType && (
                            <div className="mt-1">
                              <OfferTypeBadge executionType={catalogItem.executionType} />
                            </div>
                          )}
                          {/* Stock indicator */}
                          {benefit.stockLimit !== null && benefit.stockLimit !== undefined && (
                            <span className={cn('text-xs', benefit.isSoldOut ? 'text-red-600 font-medium' : 'text-slate-500')}>
                              {benefit.isSoldOut
                                ? 'נגמר המלאי'
                                : `נותרו ${benefit.stockAvailable ?? 0}`}
                            </span>
                          )}
                        </div>
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                          <RichTextDisplay html={benefit.description} compact className="text-sm text-slate-400" />
                          {/* Implementation link */}
                          {benefit.implementationLink && (() => {
                            const displayUrl = benefit.implementationLink.replace(/^https?:\/\//, '');
                            return (
                              <a
                                href={benefit.implementationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`פתח קישור מימוש בחלון חדש`}
                                title={benefit.implementationLink}
                                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                dir="ltr"
                              >
                                <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 1.5H1.5v9h9V7M7 1.5h3.5m0 0v3.5M7 5l3.5-3.5"/></svg>
                                {displayUrl.length > 40 ? `${displayUrl.slice(0, 40)}…` : displayUrl}
                              </a>
                            );
                          })()}
                        </div>
                        {/* Edit and Delete buttons - only for editable offers */}
                        {catalogItem && canEditOffer(catalogItem) && (
                          <div className="px-8 pb-4 flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); navigate(`/benefits-partnerships/edit-offer/${catalogItem.offerId}`); }}
                              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1"
                            >
                              עריכה
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDeletingOffer(catalogItem); }}
                              className="border border-red-200 bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1"
                            >
                              מחק
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Regular Benefits */}
            {!isLoadingCatalog && regularBenefits.length > 0 && (
              <div className={cn('grid gap-6', cardsGridCols)}>
                {regularBenefits.map((benefit) => {
                  // Look up the original CatalogItem to access execution type and stock fields.
                  const catalogItem = catalogItems.find(c => c.offerId === benefit.id);
                  return (
                    <div
                      key={benefit.id}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer overflow-hidden"
                      onClick={() => handleBenefitClick(benefit)}
                    >
                      {/* Card image with optional pending-approval overlay */}
                      <div className="relative">
                        {benefit.backgroundImage ? (
                          <img
                            src={benefit.backgroundImage}
                            alt={benefit.title}
                            className="w-full h-32 object-cover cursor-zoom-in"
                            onClick={(e) => {
                              e.stopPropagation();
                              const images = (benefit.galleryImages && benefit.galleryImages.length > 0)
                                ? benefit.galleryImages
                                : (benefit.backgroundImage ? [benefit.backgroundImage] : []);
                              if (images.length === 0) return;
                              setLightboxGallery({ images, initialIndex: 0 });
                            }}
                            onError={(e) => {
                              // Hide broken image and reveal the placeholder sibling
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              const placeholder = e.currentTarget.nextElementSibling as HTMLElement | null;
                              if (placeholder) placeholder.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        {/* Multi-image indicator on regular cards. */}
                        {benefit.galleryImages && benefit.galleryImages.length > 1 && (
                          <span
                            aria-label={`${benefit.galleryImages.length} images`}
                            className="pointer-events-none absolute top-2 end-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white"
                            dir="ltr"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            {benefit.galleryImages.length}
                          </span>
                        )}
                        {/* Placeholder shown when no backgroundImage or when the img fails to load */}
                        <div
                          className={cn('w-full h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center', benefit.backgroundImage && 'hidden')}
                        >
                          <span className="material-icons text-4xl text-slate-300 dark:text-slate-600" aria-hidden="true">image</span>
                        </div>
                        {/* Pending-approval overlay */}
                        {catalogItem?.approval_status === 'pending_approval' && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 px-3 py-1 text-xs font-semibold text-amber-900 shadow">
                              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h3.25a.75.75 0 000-1.5h-2.5V5z" clipRule="evenodd" /></svg>
                              {language === 'he' ? 'ממתין לאישור' : 'Pending Approval'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-6">
                          {benefit.businessLogo ? (
                            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 text-xl shrink-0">
                              {benefit.businessLogo}
                            </div>
                          ) : null}
                          <h3 className="font-semibold text-slate-900 dark:text-white leading-snug">{benefit.businessName}</h3>
                        </div>
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                          {/* Price */}
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {benefit.discount}
                          </p>

                          {/* Execution type badge - bilingual, type-coloured. */}
                          {catalogItem?.executionType && (
                            <div>
                              <OfferTypeBadge executionType={catalogItem.executionType} />
                            </div>
                          )}

                          {/* Stock indicator */}
                          {benefit.stockLimit !== null && benefit.stockLimit !== undefined && (
                            <p className={cn('text-xs', benefit.isSoldOut ? 'text-red-600 font-medium' : 'text-slate-500')}>
                              {benefit.isSoldOut ? 'נגמר המלאי' : `נותרו ${benefit.stockAvailable ?? 0}`}
                            </p>
                          )}

                          {/* Implementation link */}
                          {benefit.implementationLink && (() => {
                            const displayUrl = benefit.implementationLink.replace(/^https?:\/\//, '');
                            return (
                              <a
                                href={benefit.implementationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="פתח קישור מימוש בחלון חדש"
                                title={benefit.implementationLink}
                                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline w-fit"
                                dir="ltr"
                              >
                                <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 1.5H1.5v9h9V7M7 1.5h3.5m0 0v3.5M7 5l3.5-3.5"/></svg>
                                {displayUrl.length > 35 ? `${displayUrl.slice(0, 35)}…` : displayUrl}
                              </a>
                            );
                          })()}

                          {/* Tags */}
                          {benefit.tags && benefit.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {benefit.tags.map((tag) => (
                                <span key={tag} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Edit and Delete buttons - only for editable offers */}
                          {catalogItem && canEditOffer(catalogItem) && (
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); navigate(`/benefits-partnerships/edit-offer/${catalogItem.offerId}`); }}
                                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1"
                              >
                                עריכה
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setDeletingOffer(catalogItem); }}
                                className="border border-red-200 bg-white hover:bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1"
                              >
                                מחק
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Pagination - rendered below either cards or table when there are
            multiple pages of results. Hidden when everything fits on page 1. */}
        {catalogPages > 1 && (
          <section className="py-6 flex justify-center">
            <Pagination page={page} pages={catalogPages} onPageChange={setPage} />
          </section>
        )}

          </div>{/* /flex-1 content column */}

          {/* Filter aside - docks beside the content column. Hidden on mobile
              (lg:) until opened; full-width on small screens when shown. */}
          <CatalogFilterPanel
            isOpen={isFilterPanelOpen}
            onClose={() => setIsFilterPanelOpen(false)}
            filters={filters}
            onChange={setFilters}
            onClear={resetFilters}
            categoryOptions={filterCategoryOptions}
            resultsCount={catalogTotal}
            items={catalogItems}
          />
        </div>{/* /flex container */}
      </main>

      {/* Benefit Details Modal */}
      {showBenefitModal && selectedBenefit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                {selectedBenefit.businessLogo ? (
                  <div className="text-4xl">{selectedBenefit.businessLogo}</div>
                ) : null}
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedBenefit.businessName}
                </h2>
              </div>
              <button
                onClick={() => setShowBenefitModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <span className="material-icons text-slate-500">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Discount */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 text-center border border-emerald-100 dark:border-emerald-900/30">
                <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  {selectedBenefit.discount}
                </div>
                <RichTextDisplay html={selectedBenefit.description} className="text-slate-700 dark:text-slate-300" />
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-icons text-slate-400">category</span>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">קטגוריות</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedBenefit.categories.map((cat, idx) => (
                        <span key={idx} className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(cat)}`}>
                          {categories.find((c) => c.id === cat)?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedBenefit.endDate ? (
                  <div className="flex items-start gap-3">
                    <span className="material-icons text-slate-400">schedule</span>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">תוקף</div>
                      <div className="font-semibold text-slate-900 dark:text-white">עד {selectedBenefit.endDate}</div>
                    </div>
                  </div>
                ) : null}

                {selectedBenefit.terms ? (
                  <div className="flex items-start gap-3">
                    <span className="material-icons text-slate-400">description</span>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">תנאים</div>
                      <div className="text-slate-700 dark:text-slate-300">{selectedBenefit.terms}</div>
                    </div>
                  </div>
                ) : null}

                {selectedBenefit.implementationInstructions ? (
                  <div className="flex items-start gap-3">
                    <span className="material-icons text-slate-400">link</span>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">אופן מימוש</div>
                      <div className="text-slate-700 dark:text-slate-300">{selectedBenefit.implementationInstructions}</div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Tags */}
              {selectedBenefit.tags && selectedBenefit.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="material-icons text-slate-400">sell</span>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">תגיות</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedBenefit.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* How to Use */}
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="material-icons text-violet-600 dark:text-violet-400 text-xl">info</span>
                  <div className="text-sm text-violet-700 dark:text-violet-300">
                    <p className="font-semibold mb-1">איך משתמשים בהטבה?</p>
                    <a href={selectedBenefit.implementationLink} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                      לחץ כאן למימוש ההטבה
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 p-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowBenefitModal(false)}
                className="flex-1 px-6 py-3 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-full transition-all"
              >
                סגור
              </button>
              {selectedBenefit.implementationLink ? (
                <a
                  href={selectedBenefit.implementationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-icons text-base">open_in_new</span>
                  עבור לאתר
                </a>
              ) : (
                <button
                  disabled
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-bold rounded-full cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="material-icons text-base">open_in_new</span>
                  עבור לאתר
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-screen image lightbox - portal-rendered over the viewport.
          Gallery mode shows prev/next + dot pagination when imageUrls > 1. */}
      {lightboxGallery && (
        <ImageLightbox
          images={lightboxGallery.images}
          initialIndex={lightboxGallery.initialIndex}
          alt={t('bp_imageMissingAlt')}
          onClose={() => setLightboxGallery(null)}
        />
      )}

      {/* Delete offer confirmation modal */}
      {deletingOffer && (
        <DeleteOfferConfirmModal
          offerTitle={deletingOffer.title}
          isDeleting={isDeleting}
          onConfirm={() => void handleDeleteOffer()}
          onCancel={() => { if (!isDeleting) setDeletingOffer(null); }}
        />
      )}

      {/* Deny offer modal — platform admin only, shown for pending_approval ecosystem vouchers */}
      {denyTarget && (
        <DenyOfferModal
          offer={denyTarget}
          onClose={() => setDenyTarget(null)}
          onDenied={async () => {
            await loadCatalog();
            setDenyTarget(null);
          }}
        />
      )}

      {/* Voucher price slider popover - opens from a voucher row's price cell. */}
      {pricePopover && (
        <VoucherPricePopover
          offerId={pricePopover.offerId}
          faceValue={pricePopover.faceValue}
          nexusCost={pricePopover.nexusCost}
          currentMemberPrice={pricePopover.currentMemberPrice}
          anchor={pricePopover.anchor}
          onSaved={(newPrice) => {
            setPriceOverrides((prev) => ({ ...prev, [pricePopover.offerId]: newPrice }));
            void loadCatalog();
          }}
          onClose={() => setPricePopover(null)}
        />
      )}

      {/* Filter aside is now mounted inline beside the content (see the
          flex container above). No portal mount here. */}
    </div>
  );
};

export default BenefitsPartnerships;
