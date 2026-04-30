import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orgsApi, type Org, type OrgMember, type OrgRole, type OrgInvite } from '../lib/api';

// ─── Helpers ──────────────────────────────────────────────────────

const ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: 'בעלים',
  ADMIN: 'מנהל',
  MEMBER: 'חבר',
};

const ROLE_COLORS: Record<OrgRole, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-violet-100 text-violet-700',
  MEMBER: 'bg-slate-100 text-slate-600',
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Add Member Modal ─────────────────────────────────────────────

interface AddMemberModalProps {
  slug: string;
  onClose: () => void;
  onAdded: (member: OrgMember) => void;
}

function AddMemberModal({ slug, onClose, onAdded }: AddMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('MEMBER');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('נדרשת כתובת אימייל'); return; }
    setSaving(true);
    setError('');
    try {
      const member = await orgsApi.addMember(slug, email.trim(), role);
      onAdded(member);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-900">הוספת חבר</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-icons">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">אימייל *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="user@example.com"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">תפקיד</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OrgRole)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="MEMBER">חבר</option>
              <option value="ADMIN">מנהל</option>
              <option value="OWNER">בעלים</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              ביטול
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="material-icons animate-spin !text-[16px]">sync</span>}
              הוסף
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Member Modal ────────────────────────────────────────────

interface EditMemberModalProps {
  slug: string;
  member: OrgMember;
  onClose: () => void;
  onUpdated: (member: OrgMember) => void;
}

function EditMemberModal({ slug, member, onClose, onUpdated }: EditMemberModalProps) {
  const [role, setRole] = useState<OrgRole>(member.role);
  const [displayName, setDisplayName] = useState(member.displayName ?? '');
  const [title, setTitle] = useState(member.title ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await orgsApi.updateMember(slug, member.userId, {
        role,
        displayName: displayName || undefined,
        title: title || undefined,
      });
      onUpdated(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">עריכת חבר</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Member identity (read-only) */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {initials(member.user.fullName)}
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-800">{member.user.fullName}</p>
            <p className="text-[12px] text-slate-400">{member.user.email}</p>
          </div>
        </div>

        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">תפקיד בארגון</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OrgRole)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="MEMBER">חבר</option>
              <option value="ADMIN">מנהל</option>
              <option value="OWNER">בעלים</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">שם תצוגה (בארגון זה)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder={member.user.fullName}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">תואר / תפקיד</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder='לדוגמה: מנהל מוצר'
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              ביטול
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="material-icons animate-spin !text-[16px]">sync</span>}
              שמור
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Invite Section ───────────────────────────────────────────────

const INVITE_BASE = (import.meta.env.VITE_APP_URL as string | undefined) ?? '';
const ROLE_LABELS_INVITE: Record<OrgRole, string> = { OWNER: 'בעלים', ADMIN: 'מנהל', MEMBER: 'חבר' };

interface InviteSectionProps { slug: string }

function InviteSection({ slug }: InviteSectionProps) {
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ role: 'MEMBER' as OrgRole, label: '', maxUses: '', expiresInDays: '7' });
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    orgsApi.listInvites(slug)
      .then(setInvites)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const invite = await orgsApi.createInvite(slug, {
        role: form.role,
        label: form.label || undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresInDays: form.expiresInDays ? Number(form.expiresInDays) : undefined,
      });
      setInvites((prev) => [invite, ...prev]);
      setShowForm(false);
      setForm({ role: 'MEMBER', label: '', maxUses: '', expiresInDays: '7' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await orgsApi.deleteInvite(slug, id).catch(() => {});
    setInvites((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCopy = (token: string) => {
    const link = `${INVITE_BASE}/join/${token}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="material-icons !text-[20px] text-slate-400">link</span>
          <h2 className="text-[14px] font-semibold text-slate-800">קישורי הזמנה</h2>
          {!loading && invites.length > 0 && (
            <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{invites.length}</span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span className="material-icons !text-[16px]">add_link</span>
          {showForm ? 'ביטול' : 'קישור חדש'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="px-5 py-4 bg-slate-50 border-b border-slate-100 space-y-3">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1">תפקיד מוענק</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as OrgRole })}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="MEMBER">חבר</option>
                <option value="ADMIN">מנהל</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1">תוקף (ימים)</label>
              <select
                value={form.expiresInDays}
                onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="1">יום אחד</option>
                <option value="7">שבוע</option>
                <option value="30">חודש</option>
                <option value="">ללא תוקף</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1">תווית (אופציונלי)</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder='לדוגמה: גיוס עובדים'
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1">מקסימום שימושים</label>
              <input
                type="number"
                min="1"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="ללא הגבלה"
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {creating && <span className="material-icons animate-spin !text-[15px]">sync</span>}
              צור קישור
            </button>
          </div>
        </form>
      )}

      {/* Invite list */}
      {loading ? (
        <div className="px-5 py-4 space-y-2 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : invites.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-[13px]">
          <span className="material-icons !text-3xl mb-2 block text-slate-300">link_off</span>
          אין קישורי הזמנה פעילים
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {invites.map((invite) => {
            const link = `${INVITE_BASE}/join/${invite.token}`;
            const expired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
            const exhausted = invite.maxUses !== null && invite.maxUses !== undefined && invite.useCount >= invite.maxUses;
            const inactive = expired || exhausted;
            return (
              <li key={invite.id} className={`flex items-center gap-3 px-5 py-3 ${inactive ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {invite.label && <span className="text-[13px] font-medium text-slate-700">{invite.label}</span>}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      invite.role === 'ADMIN' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ROLE_LABELS_INVITE[invite.role]}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {invite.useCount}{invite.maxUses ? `/${invite.maxUses}` : ''} שימושים
                    </span>
                    {invite.expiresAt && (
                      <span className={`text-[11px] ${expired ? 'text-red-500' : 'text-slate-400'}`}>
                        {expired ? 'פג תוקף' : `עד ${new Date(invite.expiresAt).toLocaleDateString('he-IL')}`}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{link}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(invite.token)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-violet-50 transition-colors"
                    title={copied === invite.token ? 'הועתק!' : 'העתק קישור'}
                  >
                    <span className="material-icons !text-[18px]">
                      {copied === invite.token ? 'check' : 'content_copy'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(invite.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="מחק קישור"
                  >
                    <span className="material-icons !text-[18px]">delete_outline</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

const OrgDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<OrgMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([orgsApi.get(slug), orgsApi.listMembers(slug)])
      .then(([orgData, membersData]) => {
        setOrg(orgData);
        setMembers(membersData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleRemove = async () => {
    if (!removeTarget || !slug) return;
    setRemoving(true);
    try {
      await orgsApi.removeMember(slug, removeTarget.userId);
      setMembers((prev) => prev.filter((m) => m.userId !== removeTarget.userId));
      setRemoveTarget(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRemoving(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase()),
  );

  // ─── Skeleton ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-5 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-slate-200 rounded" />
          <div className="h-5 w-32 bg-slate-200 rounded" />
        </div>
        <div className="h-28 bg-slate-200 rounded-2xl" />
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
              <div className="h-6 w-16 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6 text-center text-slate-500">
        <span className="material-icons !text-5xl mb-3 text-slate-300">domain_disabled</span>
        <p>הארגון לא נמצא</p>
        <button onClick={() => navigate('/organizations')} className="mt-3 text-primary text-sm hover:underline">
          חזרה לרשימה
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-slate-500">
        <button onClick={() => navigate('/organizations')} className="hover:text-primary transition-colors">
          ארגונים
        </button>
        <span className="material-icons !text-[14px]">chevron_left</span>
        <span className="text-slate-800 font-medium">{org.name}</span>
      </div>

      {/* Org header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-sm"
            style={{ backgroundColor: org.primaryColor ?? '#0066cc' }}
          >
            {org.logoUrl ? (
              <img src={org.logoUrl} alt="" className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              org.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{org.name}</h1>
              {org.nameHe && <span className="text-[13px] text-slate-400">({org.nameHe})</span>}
              {org.isPremium && <span className="material-icons !text-[18px] text-amber-500">star</span>}
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <code className="text-[12px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">/org/{org.slug}</code>
              {org.websiteUrl && (
                <a href={org.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-primary hover:underline flex items-center gap-1">
                  <span className="material-icons !text-[14px]">open_in_new</span>
                  {org.websiteUrl}
                </a>
              )}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                org.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${org.isPublished ? 'bg-green-500' : 'bg-slate-400'}`} />
                {org.isPublished ? 'פעיל' : 'לא פרסום'}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[28px] font-bold text-slate-900 leading-none">{members.length}</p>
            <p className="text-[12px] text-slate-400 mt-0.5">חברים</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <span className="material-icons !text-[18px]">error_outline</span>
          {error}
          <button className="mr-auto" onClick={() => setError('')}>
            <span className="material-icons !text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Members header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 !text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש חברים…"
            className="w-full pr-10 pl-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm shrink-0"
        >
          <span className="material-icons !text-[18px]">person_add</span>
          הוסף חבר
        </button>
      </div>

      {/* Members table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-slate-400">
            <span className="material-icons !text-5xl mb-3">people_outline</span>
            <p className="text-[15px] font-medium text-slate-500">
              {search ? 'לא נמצאו חברים' : 'אין חברים בארגון זה עדיין'}
            </p>
            {!search && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                הוסף חבר ראשון
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wide">משתמש</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wide">תפקיד</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wide">פרופיל בארגון</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-slate-500 uppercase tracking-wide">הצטרף</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/60 transition-colors group">
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-[12px] shrink-0">
                        {member.user.avatarUrl ? (
                          <img src={member.user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          initials(member.user.fullName)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{member.user.fullName}</p>
                        <p className="text-[12px] text-slate-400">{member.user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${ROLE_COLORS[member.role]}`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                  </td>

                  {/* Per-org profile */}
                  <td className="px-4 py-3">
                    <div className="text-[13px] text-slate-600">
                      {member.displayName && <p className="font-medium">{member.displayName}</p>}
                      {member.title && <p className="text-slate-400 text-[12px]">{member.title}</p>}
                      {!member.displayName && !member.title && (
                        <span className="text-slate-300 text-[12px]">—</span>
                      )}
                    </div>
                  </td>

                  {/* Join date */}
                  <td className="px-4 py-3 text-[12px] text-slate-400">
                    {new Date(member.joinedAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditTarget(member)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-violet-50 transition-colors"
                        title="ערוך"
                      >
                        <span className="material-icons !text-[18px]">edit</span>
                      </button>
                      {member.role !== 'OWNER' && (
                        <button
                          onClick={() => setRemoveTarget(member)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="הסר מהארגון"
                        >
                          <span className="material-icons !text-[18px]">person_remove</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite section */}
      {slug && <InviteSection slug={slug} />}

      {/* Modals */}
      {showAddModal && slug && (
        <AddMemberModal
          slug={slug}
          onClose={() => setShowAddModal(false)}
          onAdded={(member) => {
            setMembers((prev) => [...prev, member]);
            setShowAddModal(false);
          }}
        />
      )}

      {editTarget && slug && (
        <EditMemberModal
          slug={slug}
          member={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={(updated) => {
            setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
            setEditTarget(null);
          }}
        />
      )}

      {/* Remove confirm inline */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRemoveTarget(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <span className="material-icons text-red-600">person_remove</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">הסרת חבר</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  האם להסיר את <span className="font-medium text-slate-700">{removeTarget.user.fullName}</span> מהארגון?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRemoveTarget(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {removing && <span className="material-icons animate-spin !text-[16px]">sync</span>}
                הסר
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgDetail;
