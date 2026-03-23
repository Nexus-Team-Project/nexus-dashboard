import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export interface RecentPage {
  path: string;
  timestamp: number;
  pinned?: boolean;
}

const STORAGE_KEY = 'nexus-recent-pages';
const MAX_RECENT = 20;

// Pages to ignore (home, auth, etc.)
const IGNORED_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/loader', '/company-setup', '/add-team-members'];

// Map of routes to their icons and label translation keys
export const PAGE_META: Record<string, { icon: string; labelKey: string }> = {
  '/users': { icon: 'people_alt', labelKey: 'users' },
  '/transactions': { icon: 'receipt_long', labelKey: 'transactions' },
  '/product-catalog': { icon: 'inventory_2', labelKey: 'productCatalog' },
  '/balances': { icon: 'account_balance_wallet', labelKey: 'balances' },
  '/benefits-partnerships': { icon: 'local_offer', labelKey: 'benefitsPartnerships' },
  '/points-gifts': { icon: 'card_giftcard', labelKey: 'gifts' },
  '/payments': { icon: 'payment', labelKey: 'payments' },
  '/charges': { icon: 'request_quote', labelKey: 'charges' },
  '/content': { icon: 'article', labelKey: 'content' },
  '/reports': { icon: 'assessment', labelKey: 'reports' },
  '/marketing': { icon: 'campaign', labelKey: 'marketing' },
  '/marketing/sms': { icon: 'sms', labelKey: 'smsCampaign' },
  '/marketing/email': { icon: 'mail', labelKey: 'emailCampaigns' },
  '/marketing/push': { icon: 'notifications_active', labelKey: 'pushCampaigns' },
  '/settings': { icon: 'settings', labelKey: 'settings' },
  '/settings/roles-permissions': { icon: 'admin_panel_settings', labelKey: 'rolesPermissions' },
  '/api-docs': { icon: 'description', labelKey: 'apiDocumentation' },
  '/inbox': { icon: 'inbox', labelKey: 'inbox' },
  '/organizations': { icon: 'corporate_fare', labelKey: 'organizations' },
};

function loadRecent(): RecentPage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveRecent(pages: RecentPage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

export function useRecentPages() {
  const location = useLocation();
  const [recentPages, setRecentPages] = useState<RecentPage[]>(loadRecent);

  // Track page visits
  useEffect(() => {
    const path = location.pathname;

    // Skip ignored paths and paths without meta
    if (IGNORED_PATHS.includes(path) || !PAGE_META[path]) return;

    setRecentPages((prev) => {
      const existing = prev.find((p) => p.path === path);
      let updated: RecentPage[];

      if (existing) {
        // Update timestamp, keep pin state
        updated = prev.map((p) =>
          p.path === path ? { ...p, timestamp: Date.now() } : p
        );
      } else {
        // Add new entry
        updated = [{ path, timestamp: Date.now() }, ...prev];
      }

      // Keep only MAX_RECENT entries (pinned ones are never removed)
      const pinned = updated.filter((p) => p.pinned);
      const unpinned = updated.filter((p) => !p.pinned);
      unpinned.sort((a, b) => b.timestamp - a.timestamp);
      updated = [...pinned, ...unpinned.slice(0, MAX_RECENT - pinned.length)];

      saveRecent(updated);
      return updated;
    });
  }, [location.pathname]);

  const togglePin = useCallback((path: string) => {
    setRecentPages((prev) => {
      const updated = prev.map((p) =>
        p.path === path ? { ...p, pinned: !p.pinned } : p
      );
      saveRecent(updated);
      return updated;
    });
  }, []);

  // Get sorted list: pinned first (by timestamp), then recent (by timestamp)
  const getSorted = useCallback(() => {
    const pinned = recentPages.filter((p) => p.pinned).sort((a, b) => b.timestamp - a.timestamp);
    const unpinned = recentPages.filter((p) => !p.pinned).sort((a, b) => b.timestamp - a.timestamp);
    return [...pinned, ...unpinned];
  }, [recentPages]);

  return {
    recentPages: getSorted(),
    togglePin,
    pinnedCount: recentPages.filter((p) => p.pinned).length,
  };
}
