/**
 * Accepts a tenant member invitation after website-backed authentication.
 * The page verifies the token, accepts it, refreshes /api/me, and opens tenant mode.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { tenantMemberInvitationsApi, type TenantMemberInvitationPreview, type TenantRole } from '../lib/api';
import { getTenantRoleLabel } from '../lib/tenantRoles';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

type AcceptState =
  | { status: 'loading' }
  | { status: 'accepted'; preview: TenantMemberInvitationPreview; alreadyAccepted: boolean }
  | { status: 'error'; message: string };

const COPY = {
  he: {
    loading: 'מאשרים את ההזמנה...',
    accepted: 'ההזמנה אושרה',
    already: 'ההזמנה כבר אושרה',
    body: 'עכשיו אפשר לעבוד בתוך סביבת העבודה.',
    dashboard: 'פתח דשבורד',
    missing: 'קישור ההזמנה חסר או לא תקין.',
  },
  en: {
    loading: 'Accepting invitation...',
    accepted: 'Invitation accepted',
    already: 'Invitation already accepted',
    body: 'You can now work inside the tenant workspace.',
    dashboard: 'Open dashboard',
    missing: 'The invitation link is missing or invalid.',
  },
} as const;

/**
 * Renders the member invitation acceptance state.
 * Input: token from the dashboard query string.
 * Output: status page with localized copy.
 */
export default function MemberInviteAccept() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { reloadMe } = useAuth();
  const { language, isRTL } = useLanguage();
  const copy = COPY[language];
  const [state, setState] = useState<AcceptState>({ status: 'loading' });

  useEffect(() => {
    /**
     * Loads invite details and accepts the invite for the current user.
     * Input: token from the current URL.
     * Output: state update and refreshed dashboard context.
     */
    const acceptInvite = async () => {
      const token = params.get('token');
      if (!token) {
        setState({ status: 'error', message: copy.missing });
        return;
      }

      try {
        const preview = await tenantMemberInvitationsApi.get(token);
        const accepted = await tenantMemberInvitationsApi.accept(token);
        await reloadMe();
        setState({ status: 'accepted', preview, alreadyAccepted: accepted.alreadyAccepted });
      } catch (error) {
        setState({ status: 'error', message: error instanceof Error ? error.message : copy.missing });
      }
    };

    void acceptInvite();
  }, [copy.missing, params, reloadMe]);

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#edf1fc] px-6 py-10 text-slate-950">
      <section className="mx-auto mt-20 w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        {state.status === 'loading' ? (
          <div className="flex items-center gap-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            <p className="text-sm font-semibold text-slate-700">{copy.loading}</p>
          </div>
        ) : state.status === 'error' ? (
          <>
            <h1 className="text-xl font-bold text-slate-950">{state.message}</h1>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-6 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              {copy.dashboard}
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {state.preview.tenantName}
            </p>
            <h1 className="text-2xl font-bold text-slate-950">
              {state.alreadyAccepted ? copy.already : copy.accepted}
            </h1>
            {(state.preview.roles ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(state.preview.roles as TenantRole[]).map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {getTenantRoleLabel(role, language)}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-3 text-sm leading-6 text-slate-600">{copy.body}</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-8 cursor-pointer rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              {copy.dashboard}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
