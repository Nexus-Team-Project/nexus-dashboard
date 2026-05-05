/**
 * Protects the Dev Playground route using backend-derived dashboard authorization.
 * Tenant admins see a placeholder, while Nexus platform admins get the full tool.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DevPlayground from './DevPlayground';

/**
 * Shows the locked Dev Playground state for tenant admins without platform access.
 * Input: none.
 * Output: simple coming-soon page inside the dashboard layout.
 */
function DevPlaygroundComingSoon() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 text-slate-950">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
          <span className="material-symbols-rounded !text-2xl">construction</span>
        </div>
        <h1 className="text-2xl font-bold tracking-normal">Coming soon</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Dev Playground access is being prepared for tenant admins.
        </p>
      </div>
    </section>
  );
}

/**
 * Selects the correct Dev Playground route result for the authenticated user.
 * Input: current dashboard auth context.
 * Output: redirect, coming-soon placeholder, or the full internal playground.
 */
function DevPlaygroundRoute() {
  const { me } = useAuth();

  if (!me?.authorization.canSeeDevMode) {
    return <Navigate to="/" replace />;
  }

  if (!me.authorization.canUseDevPlayground) {
    return <DevPlaygroundComingSoon />;
  }

  return <DevPlayground />;
}

export default DevPlaygroundRoute;
