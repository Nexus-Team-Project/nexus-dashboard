import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { orgsApi, type Org, type OrgRole } from '../lib/api';

interface OrgMembership {
  role: OrgRole;
  org: Org;
}

const ROLE_COLORS: Record<OrgRole, string> = {
  OWNER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  MEMBER: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const Home = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Create org modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgWebsite, setNewOrgWebsite] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    orgsApi
      .myOrgs()
      .then((data) => setMemberships(data as OrgMembership[]))
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setIsCreating(true);
    setCreateError('');
    try {
      const org = await orgsApi.create({
        name: newOrgName.trim(),
        websiteUrl: newOrgWebsite.trim() || undefined,
      });
      // Add the new org to the list as OWNER
      setMemberships((prev) => [{ role: 'OWNER', org }, ...prev]);
      setShowCreate(false);
      setNewOrgName('');
      setNewOrgWebsite('');
      // Navigate to the new org
      navigate(`/organizations/${org.slug}`);
    } catch (err: unknown) {
      const e = err as Error;
      setCreateError(e.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={`${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Organizations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage and navigate your organizations
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#111111] dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:opacity-90 transition-all"
        >
          <span className="material-icons text-lg">add</span>
          New Organization
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <svg className="animate-spin h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : memberships.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-icons text-3xl text-slate-400">business</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No organizations yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            Create your first organization to start managing your team and campaigns.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-[#111111] dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:opacity-90 transition-all"
          >
            Create Organization
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {memberships.map(({ role, org }) => (
            <div
              key={org.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: org.primaryColor ?? '#6366f1' }}
                    >
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">
                      {org.name}
                    </h3>
                    {org.websiteUrl && (
                      <p className="text-xs text-slate-400 truncate max-w-[140px]">{org.websiteUrl}</p>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>
                  {role}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {org._count?.members ?? 0} member{(org._count?.members ?? 0) !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => navigate(`/organizations/${org.slug}`)}
                  className="text-xs font-semibold text-[#111111] dark:text-white hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Manage
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Organization</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                  {createError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Organization name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f7f7f7] dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#111111] focus:border-transparent outline-none text-sm dark:text-white"
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Website (optional)
                </label>
                <input
                  type="url"
                  value={newOrgWebsite}
                  onChange={(e) => setNewOrgWebsite(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f7f7f7] dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#111111] focus:border-transparent outline-none text-sm dark:text-white"
                  placeholder="https://acme.com"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newOrgName.trim()}
                  className="flex-1 py-2.5 bg-[#111111] dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
