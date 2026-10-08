import { useState, useEffect } from 'react';
import { Search, Download, Eye, RefreshCw, X, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { polarisApi } from '../api';
import { formatCurrency, formatDateTime, getStatusBadgeColor } from '../utils/formatters';

const PAGE_SIZE = 10;

const extractTransactions = (res: any): { list: any[]; pagination: any } => {
  const payload = res?.data?.data ?? res?.data;
  const list = Array.isArray(payload?.transactions)
    ? payload.transactions
    : Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
    ? payload
    : [];
  return { list, pagination: payload?.pagination ?? null };
};

const dedupeAccounts = (list: any[]): any[] => {
  const seen = new Set<string>();
  return list.filter((w: any) => {
    const key = String(w?.account_number ?? '');
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const clientPage = (list: any[], page: number, limit: number): any[] =>
  list.slice((page - 1) * limit, page * limit);

const profileRows = (u: any): [string, string][] => {
  if (!u || typeof u !== 'object') return [];
  const rows: [string, string][] = [];
  const add = (label: string, value: any) => {
    if (value === undefined || value === null || value === '') return;
    rows.push([label, String(value)]);
  };
  add('Full Name', [u.firstname, u.lastname].filter(Boolean).join(' '));
  add('Email', u.email);
  add('Phone', u.phone);
  add('EMCOOPID', u.EMCOOPID);
  add('Gender', u.gender);
  add('Date of Birth', u.birth_date);
  add('Address', u.home_address || u.address);
  add('State', u.state);
  add('LGA', u.LGA);
  add('Occupation', u.occupation);
  add(
    'Next of Kin',
    u.next_kin_name || [u.nextOfKinFirstName, u.nextOfKinLastName].filter(Boolean).join(' ')
  );
  add('Next of Kin Phone', u.next_kin_phone || u.nextOfKinPhoneNumber);
  add('Member Since', u.createdAt ? formatDateTime(u.createdAt) : undefined);
  return rows;
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-900 text-right break-words max-w-[60%]">{value}</span>
  </div>
);

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  label: string;
  onPageChange: (page: number) => void;
}

const Pagination = ({ page, totalPages, totalCount, pageSize, label, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalCount);
  const start = Math.max(1, Math.min(page - 2, Math.max(1, totalPages - 4)));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);

  return (
    <div className="px-1 py-3 sm:px-6 sm:py-4 border-t border-gray-200 mt-2 sm:mt-0 flex flex-wrap items-center justify-center sm:justify-between gap-3">
      <div className="hidden sm:block text-sm text-gray-600">
        Showing {first} to {last} of {totalCount} {label}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="px-2.5 sm:px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <div className="flex items-center gap-1">
          {pages.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[2rem] px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium ${
                page === pageNum ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="px-2.5 sm:px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const Monitoring = () => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const [wallets, setWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [tab, setTab] = useState<'account' | 'transaction'>('account');

  const [accountPage, setAccountPage] = useState(1);
  const [accountTotal, setAccountTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);

  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const userId = selectedUser?._id || selectedUser?.id || '';
  const accountPages = Math.ceil(accountTotal / PAGE_SIZE);
  const txPages = Math.ceil(txTotal / PAGE_SIZE);

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

  const fetchAccounts = async (page: number) => {
    setLoadingAccounts(true);
    setError('');
    try {
      if (userId) {
        // Scoped to a single user: their wallet record
        const res = await polarisApi.getWallet(userId);
        const payload: any = res.data?.data ?? res.data;
        const list = Array.isArray(payload) ? payload : payload ? [payload] : [];
        const unique = dedupeAccounts(list);
        setWallets(clientPage(unique, page, PAGE_SIZE));
        setAccountTotal(unique.length);
      } else {
        const res = await polarisApi.getAllWallets({ page, limit: PAGE_SIZE });
        const body: any = res.data ?? {};
        const list = Array.isArray(body?.data) ? body.data : [];
        const unique = dedupeAccounts(list);
        const serverPagination = body?.pagination;
        if (serverPagination && list.length <= PAGE_SIZE) {
          setWallets(unique);
          setAccountTotal(serverPagination.total ?? unique.length);
        } else {
          // Backend ignored page/limit: slice the full list locally
          setWallets(clientPage(unique, page, PAGE_SIZE));
          setAccountTotal(unique.length);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch accounts:', err);
      setWallets([]);
      setAccountTotal(0);
      // A user without a wallet is an empty state, not an error
      if (!userId || err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load accounts.');
      }
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchTransactions = async (page: number) => {
    setLoadingTx(true);
    setError('');
    try {
      const res = userId
        ? await polarisApi.getTransactions(userId, {
            transaction_type: 'all',
            page,
            limit: PAGE_SIZE,
          })
        : await polarisApi.getAllTransactions({ page, limit: PAGE_SIZE });
      const { list, pagination } = extractTransactions(res);
      if (pagination) {
        setTransactions(list);
        setTxTotal(pagination.total ?? list.length);
      } else {
        // Backend ignored page/limit: slice the full list locally
        setTransactions(clientPage(list, page, PAGE_SIZE));
        setTxTotal(list.length);
      }
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
      setTxTotal(0);
      setError(err.response?.data?.message || 'Failed to load transactions.');
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    fetchAccounts(accountPage);
  }, [accountPage, userId]);

  useEffect(() => {
    fetchTransactions(txPage);
  }, [txPage, userId]);

  const handleRefresh = () => {
    fetchAccounts(accountPage);
    fetchTransactions(txPage);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      let rows = transactions;
      try {
        const res = userId
          ? await polarisApi.getTransactions(userId, {
              transaction_type: 'all',
              page: 1,
              limit: 1000,
            })
          : await polarisApi.getAllTransactions({ page: 1, limit: 1000 });
        const { list } = extractTransactions(res);
        if (list.length) rows = list;
      } catch (err) {
        console.error('Full export fetch failed, using loaded rows:', err);
      }

      const headers = ['Date', 'Type', 'Amount', 'Currency', 'Status', 'Reference'];
      const csvRows = rows.map((t) => [
        formatDateTime(t.created_at || t.createdAt),
        t.transaction_type || t.type || '',
        t.amount ?? '',
        t.currency || 'NGN',
        t.status || '',
        t.reference || t.transaction_ref || '',
      ]);
      const csv = [headers, ...csvRows].map((r) => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'polaris-transactions.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const selectUser = (u: any | null) => {
    setSelectedUser(u);
    setUsers([]);
    setSearch('');
    setAccountPage(1);
    setTxPage(1);
  };

  const openAccountDetails = (w: any) => {
    setSelectedAccount(w);
    const uid = String(w?.user_id?._id || w?.user_id || userId || '');
    if (!uid) {
      setRecentTx([]);
      return;
    }
    setDetailLoading(true);
    setRecentTx([]);
    polarisApi
      .getTransactions(uid, { transaction_type: 'all', page: 1, limit: 5 })
      .then((res) => setRecentTx(extractTransactions(res).list))
      .catch((err) => console.error('Failed to fetch recent transactions:', err))
      .finally(() => setDetailLoading(false));
  };

  const accountUser = selectedAccount?.user_id && typeof selectedAccount.user_id === 'object'
    ? selectedAccount.user_id
    : selectedUser;
  const accountName = [accountUser?.firstname, accountUser?.lastname].filter(Boolean).join(' ');
  const balanceDetail = selectedAccount?.balance_detail;
  const detailProfileRows = profileRows(accountUser);
  const walletAccounts: [string, string][] = [
    ['Main Account', selectedAccount?.account_number],
    ['Bashiri Account', selectedAccount?.bashiri_account_number],
    ['Contribution Account', selectedAccount?.contribution_account_number],
    ['Target Account', selectedAccount?.target_account_number],
    ['Investment Account', selectedAccount?.investment_account_number],
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Monitoring</h1>
          <p className="text-sm text-gray-600 mt-1">
            {loadingAccounts || loadingTx
              ? 'Loading...'
              : `${accountTotal} account(s), ${txTotal} transaction(s)`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
          <button
            onClick={handleRefresh}
            disabled={loadingAccounts || loadingTx}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAccounts || loadingTx ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || loadingTx || txTotal === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* User search */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search User (email, name, phone, EMCOOPID)
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Email, name, phone or EMCOOPID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
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
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {[u.firstname, u.lastname].filter(Boolean).join(' ') || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setTab('account')}
            className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap ${tab === 'account' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Account ({accountTotal})
          </button>
          <button
            onClick={() => setTab('transaction')}
            className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap ${tab === 'transaction' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Transactions ({txTotal})
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {tab === 'account' && (
            loadingAccounts ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-spin" />
              </div>
            ) : wallets.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No accounts found.</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Account Number</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Savings</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {wallets.map((w, i) => (
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => openAccountDetails(w)}
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

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-200 -mx-4 sm:-mx-6">
                  {wallets.map((w, i) => (
                    <div key={w._id || i} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {w.user_id?.firstname
                            ? `${w.user_id.firstname} ${w.user_id.lastname || ''}`
                            : w.user_id?.name || '—'}
                        </p>
                        <p className="text-xs text-emerald-600 truncate">{w.account_number || '—'}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${getStatusBadgeColor(String(w.status || 'active').toUpperCase())}`}>
                            {w.status || 'active'}
                          </span>
                          <span className="text-xs font-semibold text-gray-900">
                            {formatCurrency(Number(w.total_balance ?? w.main_balance ?? 0) || 0)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => openAccountDetails(w)}
                        className="flex-shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  ))}
                </div>

                <Pagination
                  page={accountPage}
                  totalPages={accountPages}
                  totalCount={accountTotal}
                  pageSize={PAGE_SIZE}
                  label="accounts"
                  onPageChange={setAccountPage}
                />
              </>
            )
          )}

          {tab === 'transaction' && (
            loadingTx ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No transactions found.</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
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
                      {transactions.map((t, i) => (
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

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-200 -mx-4 sm:-mx-6">
                  {transactions.map((t, i) => (
                    <div key={t.id || i} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate capitalize">
                          {String(t.type || t.transaction_type || '—').replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-emerald-600 truncate">
                          {t.transaction_ref || t.reference || '—'}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${getStatusBadgeColor(String(t.status || '').toUpperCase())}`}>
                            {String(t.status || '—').replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {formatDateTime(t.created_at || t.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(Number(t.amount) || 0, t.currency || 'NGN')}
                        </p>
                        <button
                          onClick={() => setSelected(t)}
                          className="mt-1.5 flex items-center gap-1 px-3 py-2 text-xs font-medium text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 ml-auto"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  page={txPage}
                  totalPages={txPages}
                  totalCount={txTotal}
                  pageSize={PAGE_SIZE}
                  label="transactions"
                  onPageChange={setTxPage}
                />
              </>
            )
          )}
        </div>
      </div>

      {/* Account / user detail modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedAccount(null)} aria-hidden="true" />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-xl pb-[env(safe-area-inset-bottom)] sm:pb-0">
            <div className="sm:hidden pt-2 pb-1 flex justify-center">
              <span className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-200">
              <div className="min-w-0 flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-gray-900 truncate">{accountName || 'User Details'}</h2>
                  <p className="text-xs font-medium text-emerald-600 truncate">
                    {[accountUser?.EMCOOPID, selectedAccount.account_number].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-5 space-y-5 text-sm">
              {/* Balance summary */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Total Savings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(Number(selectedAccount.total_balance ?? selectedAccount.main_balance ?? 0) || 0)}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(String(selectedAccount.status || 'active').toUpperCase())}`}>
                    {selectedAccount.status || 'active'}
                  </span>
                  {selectedAccount.balance_status && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      balance: {selectedAccount.balance_status}
                    </span>
                  )}
                </div>
              </div>

              {/* Profile */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Profile</h3>
                {detailProfileRows.length === 0 ? (
                  <p className="text-sm text-gray-500">No profile details available.</p>
                ) : (
                  <div>
                    {detailProfileRows.map(([label, value]) => (
                      <DetailRow key={label} label={label} value={value} />
                    ))}
                  </div>
                )}
              </div>

              {/* Wallet accounts */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Accounts</h3>
                {walletAccounts.map(([label, value]) => (
                  <DetailRow key={label} label={label} value={value || '—'} />
                ))}
              </div>

              {/* Balance breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Balance Breakdown</h3>
                {!balanceDetail ? (
                  <p className="text-sm text-gray-500">No balance record found.</p>
                ) : (
                  (['main', 'bashiri', 'contribution', 'target', 'investment', 'total'] as const).map(
                    (key) => {
                      const entry = balanceDetail[key];
                      if (!entry) return null;
                      return (
                        <div
                          key={key}
                          className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 last:border-0"
                        >
                          <span className="text-sm text-gray-500 capitalize">
                            {key === 'total' ? 'Total' : `${key} account`}
                          </span>
                          <span className="text-right">
                            <span className="block text-sm font-medium text-gray-900">
                              {formatCurrency(Number(entry.balance) || 0)}
                            </span>
                            <span className="block text-xs text-gray-500">
                              Available {formatCurrency(Number(entry.available) || 0)}
                            </span>
                          </span>
                        </div>
                      );
                    }
                  )
                )}
              </div>

              {/* Recent transactions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Recent Transactions ({recentTx.length})
                </h3>
                {detailLoading ? (
                  <p className="text-sm text-gray-500">Loading transactions...</p>
                ) : recentTx.length === 0 ? (
                  <p className="text-sm text-gray-500">No transactions recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recentTx.map((t, i) => (
                      <div
                        key={t.id || i}
                        className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate capitalize">
                            {String(t.type || t.transaction_type || '—').replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(t.created_at || t.createdAt)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(Number(t.amount) || 0, t.currency || 'NGN')}
                          </p>
                          <span
                            className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusBadgeColor(String(t.status || '').toUpperCase())}`}
                          >
                            {String(t.status || '—').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction detail modal */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} aria-hidden="true" />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-xl pb-[env(safe-area-inset-bottom)] sm:pb-0">
            <div className="sm:hidden pt-2 pb-1 flex justify-center">
              <span className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900">Transaction Details</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-5 space-y-3 text-sm">
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
