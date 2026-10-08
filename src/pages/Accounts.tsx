import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, RefreshCw, ChevronLeft, ChevronRight, Snowflake, LockOpen } from 'lucide-react';
import { accountsApi } from '../api';
import { formatCurrency, formatDate, getStatusBadgeColor } from '../utils/formatters';
import { AccountDetailModal } from '../components/accounts/AccountDetailModal';
import { AccountFreezeModal } from '../components/accounts/AccountFreezeModal';
import type { Account } from '../types';

export const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewAccount, setViewAccount] = useState<Account | null>(null);
  const [freezeAccount, setFreezeAccount] = useState<Account | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [locationLevel, setLocationLevel] = useState('');

  // Fetch accounts
  const fetchAccounts = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await accountsApi.getAll({
        search: search || undefined,
        status: status || undefined,
        page: currentPage,
        limit: pageSize,
      } as any);

      const payload: any = response.data?.data ?? response.data;
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setAccounts(list);
      setTotalCount(payload?.total ?? list.length);
    } catch (err: any) {
      console.error('Failed to fetch accounts:', err);
      setError(err.response?.data?.message || 'Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchAccounts();
  }, [currentPage, search, status]);

  // Client-side location level filter
  const filteredAccounts = locationLevel
    ? accounts.filter((a) => a.location?.level === locationLevel)
    : accounts;

  // Status summary counts
  const statusCounts = accounts.reduce<Record<string, number>>((acc, account) => {
    acc[account.status] = (acc[account.status] || 0) + 1;
    return acc;
  }, {});

  // View account details (fetch fresh copy, fall back to table row)
  const handleView = async (account: Account) => {
    setViewAccount(account);
    try {
      const res = await accountsApi.getById(account.id);
      const fresh: any = (res.data as any)?.data?.data ?? (res.data as any)?.data ?? res.data;
      if (fresh) setViewAccount(fresh);
    } catch (err) {
      console.error('Failed to fetch account details:', err);
    }
  };

  // Confirm freeze / unfreeze from the modal
  const handleFreezeConfirm = async (account: Account, reason: string) => {
    const isFrozen = account.status === 'FROZEN';
    setActionLoading(account.id);
    try {
      if (isFrozen) {
        await accountsApi.unfreeze(account.id, reason);
      } else {
        await accountsApi.freeze(account.id, reason);
      }
      setFreezeAccount(null);
      await fetchAccounts();
    } catch (err: any) {
      console.error('Failed to update account:', err);
      setError(err.response?.data?.message || 'Failed to update account status.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle export
  const handleExport = () => {
    const csv = convertToCSV(filteredAccounts);
    downloadCSV(csv, 'accounts.csv');
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            {loading ? 'Loading...' : `${totalCount} accounts found`}
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
            disabled={loading || filteredAccounts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Account</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Account number, member name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="FROZEN">Frozen</option>
              <option value="RESTRICTED">Restricted</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select
              value={locationLevel}
              onChange={(e) => setLocationLevel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
            >
              <option value="">All Locations</option>
              <option value="APEX">Apex</option>
              <option value="ZONE">Zones</option>
              <option value="BRANCH">Branches</option>
              <option value="COMMUNITY">Communities</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Active Accounts</span>
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{statusCounts['ACTIVE'] || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Frozen Accounts</span>
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{statusCounts['FROZEN'] || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Restricted</span>
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{statusCounts['RESTRICTED'] || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Pending</span>
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{statusCounts['PENDING'] || 0}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading accounts...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center">
            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts found</h3>
            <p className="text-sm text-gray-600">
              {search || status || locationLevel
                ? 'Try adjusting your filters'
                : 'No accounts available yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Account Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Available Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Opened
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-emerald-600">
                          {account.accountNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.ownerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {account.location?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(account.availableBalance, account.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(account.openedDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                            account.status
                          )}`}
                        >
                          {account.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-4">
                        <button
                          onClick={() => handleView(account)}
                          className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => setFreezeAccount(account)}
                          disabled={actionLoading === account.id}
                          className={`font-medium flex items-center gap-1 disabled:opacity-50 ${
                            account.status === 'FROZEN'
                              ? 'text-green-600 hover:text-green-700'
                              : 'text-red-600 hover:text-red-700'
                          }`}
                        >
                          {account.status === 'FROZEN' ? (
                            <>
                              <LockOpen className="w-4 h-4" />
                              Unfreeze
                            </>
                          ) : (
                            <>
                              <Snowflake className="w-4 h-4" />
                              Freeze
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalCount)} of {totalCount} accounts
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={!hasPrevPage}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-emerald-600 text-white'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!hasNextPage}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AccountDetailModal account={viewAccount} onClose={() => setViewAccount(null)} />
      <AccountFreezeModal
        account={freezeAccount}
        loading={actionLoading === freezeAccount?.id}
        onClose={() => setFreezeAccount(null)}
        onConfirm={handleFreezeConfirm}
      />
    </div>
  );
};

// Helper function to convert accounts to CSV
function convertToCSV(accounts: Account[]): string {
  const headers = [
    'Account Number',
    'Owner',
    'Location',
    'Currency',
    'Available Balance',
    'Status',
    'Opened Date',
  ];

  const rows = accounts.map((a) => [
    a.accountNumber,
    a.ownerName,
    a.location?.name || '',
    a.currency,
    a.availableBalance,
    a.status,
    formatDate(a.openedDate),
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

// Helper function to download CSV
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
