import { useState, useEffect, useMemo } from 'react';
import { Search, Download, Eye, RefreshCw, X, User } from 'lucide-react';
import { polarisApi } from '../api';
import { formatCurrency, formatDateTime, getStatusBadgeColor } from '../utils/formatters';

export const Monitoring = () => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const [wallets, setWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [tab, setTab] = useState<'account' | 'transaction'>('account');

  // Search users by email, name, phone or EMCOOPID
  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setUsers([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await polarisApi.searchUsers(q);
        const payload: any = res.data?.data ?? res.data;
        setUsers(Array.isArray(payload) ? payload : []);
      } catch (err) {
        console.error('User search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch all accounts and transactions by default
  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [walletsRes, balancesRes, txRes] = await Promise.all([
        polarisApi.getAllWallets().catch(() => null),
        polarisApi.getAllBalances(1, 100).catch(() => null),
        polarisApi.getAllTransactions({ page: 1, limit: 50 }),
      ]);

      const wPayload: any = walletsRes?.data?.data ?? walletsRes?.data;
      const wList = Array.isArray(wPayload) ? wPayload : Array.isArray(wPayload?.data) ? wPayload.data : [];

      const bPayload: any = balancesRes?.data?.data ?? balancesRes?.data;
      const bList = Array.isArray(bPayload) ? bPayload : Array.isArray(bPayload?.data) ? bPayload.data : Array.isArray(bPayload?.balances) ? bPayload.balances : [];
      const balanceByUser = new Map<string, any>();
      bList.forEach((b: any) => {
        const key = String(b.user_id?._id || b.user_id || '');
        if (key) balanceByUser.set(key, b);
      });

      // Attach balance to each wallet
      const merged = wList.map((w: any) => {
        const b = balanceByUser.get(String(w.user_id?._id || w.user_id || ''));
        return {
          ...w,
          main_balance: b?.main_balance ?? 0,
          total_balance: b?.total_balance ?? b?.main_balance ?? 0,
          balance_status: b?.sync_status,
        };
      });

      // Deduplicate by account_number (a user can have multiple wallet rows)
      const seen = new Set<string>();
      const deduped = merged.filter((w: any) => {
        const key = w.account_number || w._id || '';
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setWallets(deduped);

      const txPayload: any = txRes?.data?.data ?? txRes?.data;
      const list = Array.isArray(txPayload?.transactions)
        ? txPayload.transactions
        : Array.isArray(txPayload?.data)
        ? txPayload.data
        : Array.isArray(txPayload)
        ? txPayload
        : [];
      setTransactions(list);
    } catch (err: any) {
      console.error('Failed to fetch monitoring data:', err);
      setError(err.response?.data?.message || 'Failed to load accounts and transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Filter by selected user (client-side)
  const userId = selectedUser?._id || selectedUser?.id || '';
  const visibleWallets = useMemo(() => {
    if (!userId) return wallets;
    return wallets.filter((w) => String(w.user_id?._id || w.user_id) === String(userId));
  }, [wallets, userId]);

  const visibleTransactions = useMemo(() => {
    if (!userId) return transactions;
    return transactions.filter(
      (t: any) =>
        String(t.from_user_id?._id || t.from_user_id || t.user_id?._id || t.user_id) === String(userId) ||
        String(t.to_user_id?._id || t.to_user_id) === String(userId)
    );
  }, [transactions, userId]);

  const handleExport = () => {
    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Status', 'Reference'];
    const rows = visibleTransactions.map((t) => [
      formatDateTime(t.created_at || t.createdAt),
      t.transaction_type || t.type || '',
      t.amount ?? '',
      t.currency || 'NGN',
      t.status || '',
      t.reference || t.transaction_ref || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'polaris-transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const selectUser = (u: any | null) => {
    setSelectedUser(u);
    setUsers([]);
    setSearch('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring</h1>
          <p className="text-sm text-gray-600 mt-1">
            {loading
              ? 'Loading...'
              : `${visibleWallets.length} account(s), ${visibleTransactions.length} transaction(s)`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={loading || visibleTransactions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* User search */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search User (email, name, phone, EMCOOPID)
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Email, name, phone number or EMCOOPID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
          />
        </div>
        {searching && <p className="text-xs text-gray-500 mt-2">Searching...</p>}
        {users.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded-lg divide-y divide-gray-100">
            {users.map((u) => (
              <button
                key={u._id}
                onClick={() => selectUser(u)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {[u.firstname, u.lastname].filter(Boolean).join(' ') || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {[u.email, u.phone, u.EMCOOPID].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
        {selectedUser && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-gray-600">
              Filtering by{' '}
              <span className="font-medium text-gray-900">
                {[selectedUser.firstname, selectedUser.lastname].filter(Boolean).join(' ')}
              </span>
            </span>
            <button
              onClick={() => selectUser(null)}
              className="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('account')}
            className={`px-6 py-4 text-sm font-medium ${tab === 'account' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Account ({visibleWallets.length})
          </button>
          <button
            onClick={() => setTab('transaction')}
            className={`px-6 py-4 text-sm font-medium ${tab === 'transaction' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Transactions ({visibleTransactions.length})
          </button>
        </div>

        <div className="p-6">
          {tab === 'account' && (
            loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-spin" />
              </div>
            ) : visibleWallets.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No accounts found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Account Number</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Savings</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {visibleWallets.map((w, i) => (
                      <tr key={w._id || i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {w.user_id?.firstname
                            ? `${w.user_id.firstname} ${w.user_id.lastname || ''}`
                            : w.user_id?.name || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600">
                          {w.account_number || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(Number(w.total_balance ?? w.main_balance ?? 0) || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(String(w.status || 'active').toUpperCase())}`}>
                            {w.status || 'active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === 'transaction' && (
            loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-spin" />
              </div>
            ) : visibleTransactions.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No transactions found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {visibleTransactions.map((t, i) => (
                      <tr key={t.id || i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(t.created_at || t.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                          {String(t.type || t.transaction_type || '—').replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600">
                          {t.transaction_ref || t.reference || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(Number(t.amount) || 0, t.currency || 'NGN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(String(t.status || '').toUpperCase())}`}>
                            {String(t.status || '—').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setSelected(t)}
                            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {/* Transaction detail modal */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} aria-hidden="true" />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900">Transaction Details</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-3 text-sm">
              {Object.entries(selected)
                .filter(([, v]) => typeof v !== 'object' || v === null)
                .map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-gray-900 text-right break-words max-w-[60%]">
                      {value === null || value === undefined ? '—' : String(value)}
                    </span>
                  </div>
                ))}

              {Object.entries(selected)
                .filter(([, v]) => typeof v === 'object' && v !== null && !Array.isArray(v))
                .map(([key, value]) => (
                  <div key={key}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 capitalize">
                      {key.replace(/_/g, ' ')}
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 space-y-1">
                      {Object.entries(value as Record<string, any>).map(([k, v]) => (
                        <div key={k} className="flex items-start justify-between gap-4">
                          <span className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}</span>
                          <span className="font-medium text-gray-900 text-right break-words max-w-[60%]">
                            {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              <details>
                <summary className="text-xs text-gray-400 cursor-pointer">Raw record</summary>
                <pre className="mt-2 bg-gray-50 rounded-lg p-3 text-[10px] text-gray-600 overflow-auto max-h-48">
                  {JSON.stringify(selected, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
