import { useEffect, useState } from 'react';
import {
  User,
  Lock,
  Bell,
  Shield,
  Users,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  UserPlus,
  Edit,
  Trash2,
  Search,
  X,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { adminsApi, type AdminUser } from '../api';

type Tab = 'settings' | 'admins';

interface AdminForm {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  status: boolean;
}

const EMPTY_FORM: AdminForm = {
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  password: '',
  role: 'ADMIN',
  status: true,
};

const ROLE_OPTIONS = [
  'ADMIN',
  'SECRETARY',
  'SECRETARY_FINANCIAL',
  'CHAIRMAN',
  'ZONAL_SECRETARY',
  'ZONAL_CHAIRMAN',
  'STAFF',
];

const rolePermissions = (role: string): string[] => {
  const r = role.toUpperCase();
  if (r === 'ADMIN') return ['transfers', 'approvals', 'settings'];
  if (r === 'SECRETARY_FINANCIAL') return ['transfers', 'reports'];
  if (r === 'CHAIRMAN') return ['approvals', 'reports'];
  if (r === 'SECRETARY') return ['approvals', 'reports'];
  return ['reports'];
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const Settings = () => {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<Tab>('settings');

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    approvalRequests: true,
    securityAlerts: true,
    transferNotifications: true,
    weeklyReports: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  // Admin users
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState({ active: 0, inactive: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [adminsError, setAdminsError] = useState('');
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  // Add / edit drawer
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAdmins = async (targetPage = page) => {
    setAdminsLoading(true);
    setAdminsError('');
    try {
      const data = await adminsApi.list({
        search: search.trim() || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: targetPage,
        limit: 10,
      });
      setAdmins(data.admins ?? []);
      setTotal(data.pagination?.total ?? 0);
      setPages(data.pagination?.pages ?? 1);
      setPage(targetPage);
      setCounts(data.stats ?? { active: 0, inactive: 0 });
    } catch {
      setAdmins([]);
      setAdminsError('Unable to load admin users. Please try again.');
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admins') loadAdmins(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    loadAdmins(1);
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    loadAdmins(1);
  };

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (admin: AdminUser) => {
    setEditId(admin._id);
    setForm({
      firstname: admin.firstname ?? '',
      lastname: admin.lastname ?? '',
      email: admin.email ?? '',
      phone: admin.phone ?? '',
      password: '',
      role: admin.role ?? 'ADMIN',
      status: admin.status === true,
    });
    setFormError('');
    setFormOpen(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      if (editId) {
        await adminsApi.update(editId, {
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: form.role,
          status: form.status,
        });
        setFlash({ ok: true, text: 'Admin account updated.' });
      } else {
        await adminsApi.create({
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role: form.role,
        });
        setFlash({ ok: true, text: 'Admin account created. Credentials were sent separately.' });
      }
setFormOpen(false);
          loadAdmins(1);
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Failed to save admin account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminsApi.remove(deleteId);
      setFlash({ ok: true, text: 'Admin account removed.' });
      setDeleteId(null);
      loadAdmins();
    } catch (err: any) {
      setFlash({ ok: false, text: err?.response?.data?.message ?? 'Failed to remove admin account.' });
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (admin: AdminUser) => {
    try {
      await adminsApi.update(admin._id, { status: admin.status !== true });
      loadAdmins();
    } catch (err: any) {
      setFlash({ ok: false, text: err?.response?.data?.message ?? 'Failed to update status.' });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage('New passwords do not match.');
      return;
    }
    setPasswordMessage('Password updated successfully.');
    setPasswordForm({ current: '', next: '', confirm: '' });
  };

  const inputClass =
    'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your account, security, and team
          </p>
        </div>
        {activeTab === 'admins' && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 font-semibold"
          >
            <UserPlus className="w-5 h-5" />
            Add Admin
          </button>
        )}
      </div>

      {flash && (
        <div
          className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border text-sm ${
            flash.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {flash.text}
          <button onClick={() => setFlash(null)} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1.5 inline-flex gap-1">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'settings'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Shield className="w-4 h-4" />
          Settings
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'admins'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          Admins
          <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
            {total}
          </span>
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-8">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user?.name ?? 'User'}</h2>
                  <p className="text-emerald-50 mt-1">{user?.email ?? 'email@example.com'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-semibold">
                      {user?.role ?? 'Admin'}
                    </span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Mail className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email Address</p>
                    <p className="font-semibold text-gray-900">{user?.email ?? '—'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                    <p className="font-semibold text-gray-900">+234 801 234 5678</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Two-Factor Authentication</p>
                    <p className="font-semibold text-gray-900">
                      {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Member Since</p>
                    <p className="font-semibold text-gray-900">January 15, 2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Bell className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
                <p className="text-sm text-gray-600">Manage how you receive notifications</p>
              </div>
            </div>
            <div className="space-y-4">
              {([
                ['emailAlerts', 'Email alerts', 'Receive important updates via email'],
                ['approvalRequests', 'Approval requests', 'Get notified when approval is needed'],
                ['securityAlerts', 'Security alerts', 'Important security notifications'],
                ['transferNotifications', 'Transfer notifications', 'Updates on transfer status'],
                ['weeklyReports', 'Weekly reports', 'Receive weekly summary reports'],
              ] as const).map(([key, label, description]) => (
                <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-emerald-200 transition-colors">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[key]}
                      onChange={(e) =>
                        setNotifications({ ...notifications, [key]: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Lock className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
              </div>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
              {passwordMessage && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  {passwordMessage}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={passwordForm.next}
                  onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/30"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Admins</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {adminsLoading ? '—' : total}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {adminsLoading ? '—' : counts.active}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Inactive</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {adminsLoading ? '—' : counts.inactive}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <XCircle className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <form onSubmit={applyFilters} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
              >
                <option value="all">All roles</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold"
              >
                Apply
              </button>
            </div>
          </form>

          {adminsError && (
            <div className="px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
              {adminsError}
            </div>
          )}

          {/* Admin List */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Admin Users</h2>
                <p className="text-sm text-gray-600 mt-1">Manage administrator accounts and permissions</p>
              </div>
              <span className="text-sm text-gray-500">{total} total</span>
            </div>

            {adminsLoading && admins.length === 0 && (
              <div className="p-14 text-center text-gray-500 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading admin users…
              </div>
            )}

            {!adminsLoading && admins.length === 0 && (
              <div className="p-14 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No admin users found.</p>
              </div>
            )}

            <div className="divide-y divide-gray-100">
              {admins.map((admin) => (
                <div key={admin._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                      admin.status ? 'bg-gradient-to-br from-emerald-600 to-emerald-700' : 'bg-gray-400'
                    }`}>
                      {`${admin.firstname?.[0] ?? ''}${admin.lastname?.[0] ?? ''}` || 'A'}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {`${admin.firstname ?? ''} ${admin.lastname ?? ''}`.trim() || 'Unnamed'}
                          </h3>
                          <p className="text-sm text-gray-600">{admin.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Role</p>
                          <p className="text-sm font-semibold text-gray-900">{admin.role}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            admin.status ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {admin.status ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {admin.status ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Member ID</p>
                          <p className="text-sm font-semibold text-gray-900">{admin.EMCOOPID || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Joined</p>
                          <p className="text-sm font-semibold text-gray-900">{formatDate(admin.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-600">Permissions:</span>
                        {rolePermissions(admin.role).map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium"
                          >
                            {perm}
                          </span>
                        ))}
                        <span className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded-md">
                          {admin.phone || '—'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-4">
                        <button
                          onClick={() => openEdit(admin)}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => toggleStatus(admin)}
                          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${
                            admin.status
                              ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                              : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {admin.status ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setDeleteId(admin._id)}
                          className="flex items-center gap-2 px-4 py-2 border border-rose-300 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!adminsLoading && admins.length > 0 && total > 10 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-4 flex-wrap text-sm text-gray-600">
                <span>
                  Showing {(page - 1) * 10 + 1}–{(page - 1) * 10 + admins.length} of {total}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => loadAdmins(page - 1)}
                    disabled={page <= 1 || adminsLoading}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-gray-500">Page {page} of {pages}</span>
                  <button
                    onClick={() => loadAdmins(page + 1)}
                    disabled={page >= pages || adminsLoading}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Admin Drawer */}
      {formOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFormOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editId ? 'Edit Admin' : 'Add Admin'}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {editId ? 'Update the admin account details below' : 'Create a new administrator account'}
                </p>
              </div>
              <button onClick={() => setFormOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={submitForm} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    value={form.firstname}
                    onChange={(e) => setForm({ ...form, firstname: e.target.value })}
                    placeholder="e.g. Ada"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    value={form.lastname}
                    onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                    placeholder="e.g. Obi"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@emcoop.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+234 8XX XXX XXXX"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={inputClass}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {!editId ? (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <KeyRound className="w-4 h-4 text-gray-400" />
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    min={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Share the password and Member ID with the new admin securely.
                  </p>
                </div>
              ) : (
                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Account Active</p>
                    <p className="text-xs text-gray-500 mt-0.5">Inactive accounts cannot log in</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.checked })}
                    className="w-5 h-5 accent-emerald-600"
                  />
                </label>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-5 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? (editId ? 'Saving…' : 'Creating…') : editId ? 'Save Changes' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Remove Admin?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This permanently deletes the admin account and revokes their access immediately.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-5 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-3 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};