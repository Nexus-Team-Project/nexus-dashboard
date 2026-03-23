import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orgsApi, type Org } from '../lib/api';

// ─── Role badge colours ───────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-600',
  PRO: 'bg-violet-100 text-violet-700',
  ENTERPRISE: 'bg-purple-100 text-purple-700',
};

// ─── Create Org Modal ────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: (org: Org) => void;
}

function CreateOrgModal({ onClose, onCreated }: CreateModalProps) {
  const [form, setForm] = useState({
    name: '',
    nameHe: '',
    websiteUrl: '',
    plan: 'FREE',
    primaryColor: '#0066cc',
    isPublished: false,
    isPremium: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('שם הארגון הוא שדה חובה'); return; }
    setSaving(true);
    setError('');
    try {
      const org = await orgsApi.create({
        name: form.name,
        nameHe: form.nameHe || undefined,
        websiteUrl: form.websiteUrl || undefined,
        plan: form.plan || undefined,
        primaryColor: form.primaryColor,
        isPublished: form.isPublished,
        isPremium: form.isPremium,
      });
      onCreated(org);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">ארגון חדש</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-icons">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">שם הארגון *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder='לדוגמה: חברת ABC'
              autoFocus
            />
          </div>

          {/* Hebrew name */}
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">שם בעברית</label>
            <input
              type="text"
              value={form.nameHe}
              onChange={(e) => setForm({ ...form, nameHe: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder='שם בעברית (אופציונלי)'
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">אתר אינטרנט</label>
            <input
              type="url"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder='https://...'
            />
          </div>

          {/* Plan + Color row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">חבילה</label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="FREE">Free</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">צבע ראשי</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="h-9 w-14 p-0.5 border border-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-[12px] text-slate-500">{form.primaryColor}</span>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-[13px] text-slate-700">פרסם</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPremium}
                onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-[13px] text-slate-700">פרמיום</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="material-icons animate-spin !text-[16px]">sync</span>}
              צור ארגון
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────

interface DeleteModalProps {
  org: Org;
  onClose: () => void;
  onDeleted: (slug: string) => void;
}

function DeleteOrgModal({ org, onClose, onDeleted }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await orgsApi.delete(org.slug);
      onDeleted(org.slug);
    } catch (err) {
      setError((err as Error).message);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <span className="material-icons text-red-600">delete_forever</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">מחיקת ארגון</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">
              האם אתה בטוח שברצונך למחוק את <span className="font-medium text-slate-700">"{org.name}"</span>? פעולה זו אינה הפיכה.
            </p>
          </div>
        </div>
        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            ביטול
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {deleting && <span className="material-icons animate-spin !text-[16px]">sync</span>}
            מחק
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

const Organizations = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Org | null>(null);

  useEffect(() => {
    orgsApi.list()
      .then(setOrgs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orgs.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase()),
  );

  // ─── Skeleton ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-200 rounded-lg" />
          <div className="h-9 w-36 bg-slate-200 rounded-lg" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
              <div className="h-6 w-16 bg-slate-100 rounded-full" />
              <div className="h-6 w-8 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ארגונים</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {orgs.length} ארגונים רשומים במערכת
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <span className="material-icons !text-[18px]">add</span>
          ארגון חדש
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <span className="material-icons !text-[18px]">error_outline</span>
          {error}
          <button className="mr-auto text-red-500 hover:text-red-700" onClick={() => setError('')}>
            <span className="material-icons !text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 !text-[18px]">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם או כתובת…"
          className="w-full pr-10 pl-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <span className="material-icons !text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="material-icons !text-5xl mb-3">domain</span>
            <p className="text-[15px] font-medium text-slate-600">
              {search ? 'לא נמצאו ארגונים התואמים את החיפוש' : 'עדיין אין ארגונים'}
            </p>
            {!search && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                צור ארגון ראשון
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wide">ארגון</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wide">כתובת URL</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wide">חבילה</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wide">חברים</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wide">סטטוס</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((org) => (
                <tr
                  key={org.id}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/organizations/${org.slug}`)}
                >
                  {/* Name + logo */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                        style={{ backgroundColor: org.primaryColor ?? '#0066cc' }}
                      >
                        {org.logoUrl ? (
                          <img src={org.logoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          org.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{org.name}</p>
                        {org.nameHe && <p className="text-[12px] text-slate-400">{org.nameHe}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Slug */}
                  <td className="px-4 py-3">
                    <code className="text-[12px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      /org/{org.slug}
                    </code>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${PLAN_COLORS[org.plan ?? 'FREE'] ?? 'bg-slate-100 text-slate-600'}`}>
                      {org.plan ?? 'FREE'}
                    </span>
                    {org.isPremium && (
                      <span className="ml-1.5 material-icons !text-[14px] text-amber-500 align-middle">star</span>
                    )}
                  </td>

                  {/* Members count */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="material-icons !text-[16px] text-slate-400">people_alt</span>
                      {org._count?.members ?? '—'}
                    </div>
                  </td>

                  {/* Published */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      org.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${org.isPublished ? 'bg-green-500' : 'bg-slate-400'}`} />
                      {org.isPublished ? 'פעיל' : 'לא פרסום'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/organizations/${org.slug}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-violet-50 transition-colors"
                        title="נהל ארגון"
                      >
                        <span className="material-icons !text-[18px]">manage_accounts</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(org)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="מחק"
                      >
                        <span className="material-icons !text-[18px]">delete_outline</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateOrgModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(org) => {
            setOrgs((prev) => [org, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
      {deleteTarget && (
        <DeleteOrgModal
          org={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(slug) => {
            setOrgs((prev) => prev.filter((o) => o.slug !== slug));
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default Organizations;
