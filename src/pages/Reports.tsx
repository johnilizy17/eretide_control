import { useState, useEffect, useMemo } from 'react';
import { Search, Download, RefreshCw, Building2, Map, Users, Eye } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { accountsApi } from '../api';
import { formatCurrency, formatDate, getStatusBadgeColor } from '../utils/formatters';
import type { Account } from '../types';

type Section = 'BRANCH' | 'ZONE' | 'COMMUNITY';

const SECTIONS: { key: Section; label: string; icon: any }[] = [
  { key: 'BRANCH', label: 'Branch', icon: Building2 },
  { key: 'ZONE', label: 'Zonal', icon: Map },
  { key: 'COMMUNITY', label: 'Committee', icon: Users },
];

export const Reports = () => {
  const [section, setSection] = useState<Section>('BRANCH');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const sectionRoute: Record<Section, string> = {
    BRANCH: '/branches',
    ZONE: '/zones',
    COMMUNITY: '/communities',
  };

  // Sync the active tab with the current route (/branches, /zones, /communities)
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/zones')) setSection('ZONE');
    else if (path.startsWith('/communities')) setSection('COMMUNITY');
    else if (path.startsWith('/branches')) setSection('BRANCH');
  }, [location.pathname]);

  const fetchAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await accountsApi.getAll({ search: search || undefined, limit: 100 } as any);
      const payload: any = response.data?.data ?? response.data;
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setAccounts(list);
    } catch (err: any) {
      console.error('Failed to fetch report data:', err);
      setError(err.response?.data?.message || 'Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [search]);

  // Filter to the active section and search client-side as well
  const items = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return accounts.filter((a) => {
      const level = a.location?.level === 'ZONE' && section === 'ZONE' ? 'ZONE' : a.location?.level;
      const matchesSection =
        (section === 'BRANCH' && a.location?.level === 'BRANCH') ||
        (section === 'ZONE' && (a.location?.level === 'ZONE' || level === 'ZONE')) ||
        (section === 'COMMUNITY' && a.location?.level === 'COMMUNITY');
      const matchesSearch =
        !needle ||
        a.accountNumber.toLowerCase().includes(needle) ||
        a.ownerName.toLowerCase().includes(needle) ||
        (a.location?.name || '').toLowerCase().includes(needle);
      return matchesSection && matchesSearch;
    });
  }, [accounts, section, search]);

  const totalBalance = items.reduce((sum, a) => sum + (Number(a.availableBalance) || 0), 0);

  const handleExport = () => {
    const csv = convertToCSV(items);
    downloadCSV(csv, `${section.toLowerCase()}-report.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-sm text-gray-600 mt-1">
            {loading ? 'Loading...' : `${items.length} ${section.toLowerCase()} item(s)`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAccounts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={loading || items.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setSection(key);
              navigate(sectionRoute[key]);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              section === key
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Search + Total */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Number, name, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Available Balance</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Details Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading report...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-sm text-gray-600">
              {search ? 'Try a different search term' : 'No records available for this section'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Opened</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Restrictions</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                      {a.accountNumber || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.ownerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {a.location?.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{a.currency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(a.availableBalance, a.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(a.status)}`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(a.openedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {a.restrictions?.length ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/reports/${encodeURIComponent(a.id)}`}
                        className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

function convertToCSV(items: Account[]): string {
  const headers = ['Number', 'Name', 'Level', 'Location', 'Currency', 'Balance', 'Status', 'Opened', 'Restrictions'];
  const rows = items.map((a) => [
    a.accountNumber,
    a.ownerName,
    a.location?.level || '',
    a.location?.name || '',
    a.currency,
    a.availableBalance,
    a.status,
    formatDate(a.openedDate),
    a.restrictions?.length ?? 0,
  ]);
  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
