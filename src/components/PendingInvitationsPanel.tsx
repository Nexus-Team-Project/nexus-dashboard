/**
 * Shows recoverable pending tenant invitations for the current logged-in user.
 * This covers cases where the original invite token was lost during signup.
 */
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { tenantMemberInvitationsApi, type TenantMemberInvitationPreview, type TenantRole } from '../lib/api';
import { getTenantRoleLabel } from '../lib/tenantRoles';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

const COPY = {
  he: {
    title: 'הזמנות ממתינות',
    body: 'אפשר להצטרף לארגונים נוספים שהזמינו אותך.',
    accept: 'אישור הזמנה',
    accepted: 'ההזמנה אושרה',
    failed: 'לא הצלחנו לאשר את ההזמנה',
  },
  en: {
    title: 'Pending invitations',
    body: 'You can join other tenants that invited this email.',
    accept: 'Accept invite',
    accepted: 'Invitation accepted',
    failed: 'Could not accept invitation',
  },
} as const;

/**
 * Renders a pending invitation recovery list.
 * Input: no props; it reads authenticated user context and pending invites.
 * Output: null when there are no pending invitations, otherwise an accept list.
 */
export default function PendingInvitationsPanel() {
  const { reloadMe } = useAuth();
  const { language } = useLanguage();
  const copy = COPY[language];
  const [invitations, setInvitations] = useState<TenantMemberInvitationPreview[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  /** True while the initial invite list is being fetched. */
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /**
     * Loads pending invitations that match the current verified email.
     * Input: none.
     * Output: local invitation list or an empty list on failure.
     */
    const loadInvitations = async () => {
      try {
        const result = await tenantMemberInvitationsApi.mine().catch(() => ({ invitations: [] }));
        setInvitations(result.invitations);
      } finally {
        setIsLoading(false);
      }
    };

    void loadInvitations();
  }, []);

  /**
   * Accepts one selected pending invitation.
   * Input: invitation id chosen by the current user.
   * Output: invitation disappears from the list and `/api/me` is refreshed.
   */
  const acceptInvitation = async (invitationId: string) => {
    setAcceptingId(invitationId);
    try {
      await tenantMemberInvitationsApi.acceptMine(invitationId);
      setInvitations((items) => items.filter((item) => item.invitationId !== invitationId));
      await reloadMe();
      toast.success(copy.accepted);
    } catch {
      toast.error(copy.failed);
    } finally {
      setAcceptingId(null);
    }
  };

  // While loading, show a subtle pulse placeholder to avoid a blank flash.
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 animate-pulse space-y-2">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="h-3 w-64 bg-slate-100 rounded" />
      </div>
    );
  }

  if (invitations.length === 0) return null;

  return (
    <section className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-slate-950">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-bold">{copy.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{copy.body}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {invitations.map((invitation) => (
          <div
            key={invitation.invitationId}
            className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{invitation.tenantName}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(invitation.roles ?? []).map((role: TenantRole) => (
                  <span
                    key={role}
                    className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
                  >
                    {getTenantRoleLabel(role, language)}
                  </span>
                ))}
              </div>
            </div>
            {invitation.invitationId && (
              <button
                type="button"
                onClick={() => void acceptInvitation(invitation.invitationId!)}
                disabled={acceptingId === invitation.invitationId}
                className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {acceptingId === invitation.invitationId ? '...' : copy.accept}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
