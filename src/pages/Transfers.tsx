import { useState, useRef, useEffect } from 'react';
import {
  Send,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Download,
  CreditCard,
  Building2,
  Calendar,
  X,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import BANK_LIST, { type Bank } from '../components/banklist';
import {
  adminWalletApi,
  type AdminAccount,
  type AdminTransferRow,
  type AdminTransferStatus,
} from '../api';

const DEFAULT_ACCOUNTS: AdminAccount[] = [
  {
    id: 'system',
    name: 'System Operating Account',
    accountNumber: '—',
    bank: 'Merchant Wallet',
    balance: 0,
    currency: 'NGN',
    type: 'Operating',
  },
  {
    id: 'reserve',
    name: 'Reserve Fund Account',
    accountNumber: '—',
    bank: 'Internal Ledger',
    balance: 0,
    currency: 'NGN',
    type: 'Reserve',
  },
];

const EMPTY_FORM = {
  account_name: '',
  account_number: '',
  amount: '',
  purpose: '',
  reference: '',
  remarks: '',
};

export const Transfers = () => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState('system');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  const [accounts, setAccounts] = useState<AdminAccount[]>(DEFAULT_ACCOUNTS);
  const [stats, setStats] = useState({ total_in: 0, total_out: 0, pending: 0 });
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState('');

  const [transfers, setTransfers] = useState<AdminTransferRow[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [statusFilter, setStatusFilter] = useState<'all' | AdminTransferStatus>('all');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [loadingTransfers, setLoadingTransfers] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadBalance = async () => {
    setBalanceLoading(true);
    try {
      const data = await adminWalletApi.getBalance();
      setAccounts(data.accounts?.length ? data.accounts : DEFAULT_ACCOUNTS);
      setStats(data.stats ?? { total_in: 0, total_out: 0, pending: 0 });
      setBalanceError('');
    } catch (error: any) {
      setBalanceError(error?.response?.data?.message ?? 'Unable to load account balances');
    } finally {
      setBalanceLoading(false);
    }
  };

  const loadTransfers = async (page = 1, status: 'all' | AdminTransferStatus = statusFilter) => {
    setLoadingTransfers(true);
    try {
      const data = await adminWalletApi.getTransfers({ page, limit: 10, status });
      setTransfers(data.transfers ?? []);
      setPagination(data.pagination ?? { page: 1, limit: 10, total: 0, pages: 1 });
    } catch {
      setTransfers([]);
    } finally {
      setLoadingTransfers(false);
    }
  };

  useEffect(() => {
    loadBalance();
    loadTransfers(1, 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target as Node)) {
        setShowBankDropdown(false);
      }
      if (!(event.target as HTMLElement)?.closest?.('[data-status-filter]')) {
        setShowStatusFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter banks based on search
  const filteredBanks = BANK_LIST.filter(bank =>
    bank.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
    bank.code.includes(bankSearch)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const setField = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmitTransfer = async () => {
    setFormError('');
    setFormSuccess('');

    if (!selectedBank) {
      setFormError('Select the beneficiary bank');
      return;
    }
    if (form.account_name.trim().length < 2) {
      setFormError('Enter the beneficiary name');
      return;
    }
    if (!/^\d{10}$/.test(form.account_number.trim())) {
      setFormError('Enter a valid 10-digit account number');
      return;
    }
    const amount = Number(form.amount);
    if (!(amount > 0)) {
      setFormError('Enter a valid amount');
      return;
    }
    if (!form.purpose.trim()) {
      setFormError('Enter the purpose of this transfer');
      return;
    }

    const narration = [form.purpose.trim(), form.reference.trim() && `Ref: ${form.reference.trim()}`, form.remarks.trim()]
      .filter(Boolean)
      .join(' | ')
      .slice(0, 150);

    setSubmitting(true);
    try {
      await adminWalletApi.createTransfer({
        amount,
        account_number: form.account_number.trim(),
        account_name: form.account_name.trim(),
        bank_code: selectedBank.code,
        bank_name: selectedBank.name,
        narration,
      });

      setFormSuccess('Transfer completed successfully');
      setForm(EMPTY_FORM);
      setSelectedBank(null);
      setBankSearch('');
      await Promise.all([loadBalance(), loadTransfers(1, statusFilter)]);

      window.setTimeout(() => {
        setShowDrawer(false);
        setFormSuccess('');
      }, 1200);
    } catch (error: any) {
      setFormError(error?.response?.data?.message ?? 'Transfer failed, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const exportCsv = () => {
    const header = ['Date', 'Reference', 'Beneficiary', 'Account Number', 'Bank', 'Amount', 'Status', 'Narration'];
    const rows = transfers.map(row => [
      new Date(row.createdAt).toLocaleString('en-NG'),
      row.reference,
      row.account_name,
      row.account_number,
      row.bank_name || row.bank_code,
      String(row.amount),
      row.status,
      row.narration ?? '',
    ]);

    const csv = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-transfers-page-${pagination.page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: AdminTransferStatus) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-semibold">
        <XCircle className="w-3.5 h-3.5" />
        Failed
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts & Transfers</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your accounts and initiate secure transfers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadBalance();
              loadTransfers(pagination.page, statusFilter);
            }}
            disabled={balanceLoading || loadingTransfers}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${balanceLoading || loadingTransfers ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 font-semibold"
          >
            <Send className="w-5 h-5" />
            New Transfer
          </button>
        </div>
      </div>

      {balanceError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {balanceError}
        </div>
      )}

      {/* Account Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {accounts.map((account) => (
          <div
            key={account.id}
            onClick={() => setSelectedAccount(account.id)}
            className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all ${
              selectedAccount === account.id
                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-2xl shadow-emerald-600/50 scale-[1.02]'
                : 'bg-gradient-to-br from-gray-700 to-gray-800 hover:scale-[1.01] shadow-lg'
            }`}
          >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

            <div className="relative">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-white/80" />
                    <p className="text-white/80 text-sm font-medium">{account.type} Account</p>
                  </div>
                  <h3 className="text-white font-bold text-lg">{account.name}</h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedAccount === account.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/80'
                }`}>
                  Active
                </div>
              </div>

              {/* Balance */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-white/80 text-sm font-medium">Available Balance</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBalance(!showBalance);
                    }}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-white text-3xl font-bold tracking-tight">
                  {balanceLoading
                    ? 'Loading…'
                    : showBalance
                      ? formatCurrency(account.balance)
                      : '₦ • • • • • •'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div>
                  <p className="text-white/60 text-xs mb-1">Account Number</p>
                  <p className="text-white font-mono font-semibold">{account.accountNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs mb-1">Bank</p>
                  <p className="text-white font-semibold text-sm">{account.bank}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Inflow (This Month)</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.total_in)}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Outflow (This Month)</p>
              <p className="text-2xl font-bold text-rose-600">{formatCurrency(stats.total_out)}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl">
              <TrendingDown className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Approvals</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          showDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDrawer(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
            showDrawer ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">New Transfer Request</h2>
                <p className="text-sm text-emerald-50">Fill in the transfer details below</p>
              </div>
            </div>
            <button
              onClick={() => setShowDrawer(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors group"
            >
              <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Drawer Content - Scrollable */}
          <div className="h-[calc(100vh-80px)] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* From Account */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  From Account *
                </label>
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => account.id === 'system' && setSelectedAccount(account.id)}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        account.id === 'system'
                          ? 'border-emerald-500 cursor-pointer hover:shadow-md group'
                          : 'border-gray-200 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-600" />
                          <p className="font-semibold text-gray-900">{account.name}</p>
                        </div>
                        {account.id === 'system' ? (
                          <input
                            type="radio"
                            name="fromAccount"
                            readOnly
                            checked
                            className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                        ) : (
                          <span className="text-[11px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                            Not withdrawable
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1 font-mono">{account.accountNumber}</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(account.balance)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipient Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Beneficiary Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter beneficiary name"
                    value={form.account_name}
                    onChange={(e) => setField('account_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    placeholder="0000000000"
                    maxLength={10}
                    value={form.account_number}
                    onChange={(e) => setField('account_number', e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Name *
                  </label>
                  <div className="relative" ref={bankDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowBankDropdown(!showBankDropdown)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-left flex items-center justify-between hover:border-gray-400"
                    >
                      <span className={selectedBank ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                        {selectedBank ? selectedBank.name : 'Select bank'}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showBankDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    {showBankDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-hidden">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search banks..."
                              value={bankSearch}
                              onChange={(e) => setBankSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        {/* Bank List */}
                        <div className="overflow-y-auto max-h-64">
                          {filteredBanks.length > 0 ? (
                            filteredBanks.map((bank) => (
                              <button
                                key={bank.code}
                                type="button"
                                onClick={() => {
                                  setSelectedBank(bank);
                                  setShowBankDropdown(false);
                                  setBankSearch('');
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-0"
                              >
                                <p className="font-medium text-gray-900 text-sm">{bank.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Code: {bank.code}</p>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-8 text-center">
                              <p className="text-sm text-gray-500">No banks found</p>
                              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">₦</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => setField('amount', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-lg font-semibold"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {formatCurrency(accounts.find((a) => a.id === 'system')?.balance ?? 0)}
                  </p>
                </div>
              </div>

              {/* Transfer Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose *</label>
                  <input
                    type="text"
                    placeholder="e.g., Operational expenses"
                    value={form.purpose}
                    onChange={(e) => setField('purpose', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., TRANS-2026-401"
                    value={form.reference}
                    onChange={(e) => setField('reference', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Additional notes..."
                    value={form.remarks}
                    onChange={(e) => setField('remarks', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Warning Notice */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">
                    Central Withdrawal — System Account Only
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Funds leave the system operating account only. No member or branch balances are
                    affected by this transfer. The withdrawal executes immediately after validation.
                  </p>
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {formSuccess}
                </div>
              )}

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 -mx-6 px-6 space-y-3">
                <button
                  onClick={handleSubmitTransfer}
                  disabled={submitting}
                  className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all font-semibold shadow-lg shadow-emerald-600/30 hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {submitting ? 'Processing…' : 'Initiate Transfer'}
                </button>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Transfers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Admin Transfers</h2>
              <p className="text-sm text-gray-600 mt-1">
                Withdrawals initiated from the system operating account
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative" data-status-filter>
                <button
                  onClick={() => setShowStatusFilter(!showStatusFilter)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Filter className="w-4 h-4" />
                  {statusFilter === 'all' ? 'Filter' : statusFilter}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showStatusFilter ? 'rotate-180' : ''}`} />
                </button>
                {showStatusFilter && (
                  <div className="absolute right-0 z-20 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                    {(['all', 'completed', 'pending', 'failed'] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setStatusFilter(option);
                          setShowStatusFilter(false);
                          loadTransfers(1, option);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 transition-colors flex items-center justify-between ${
                          statusFilter === option ? 'text-emerald-700 font-semibold bg-emerald-50/60' : 'text-gray-700'
                        }`}
                      >
                        {option === 'all' ? 'All statuses' : option}
                        {statusFilter === option && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={exportCsv}
                disabled={transfers.length === 0}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <th className="px-6 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Reference</th>
                <th className="px-4 py-3 text-left font-semibold">Beneficiary</th>
                <th className="px-4 py-3 text-left font-semibold">Bank</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingTransfers && transfers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Loading transfers…
                  </td>
                </tr>
              )}

              {!loadingTransfers &&
                transfers.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(row.createdAt).toLocaleString('en-NG', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-gray-700 whitespace-nowrap">{row.reference}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{row.account_name}</p>
                      <p className="text-xs text-gray-500 font-mono">{row.account_number}</p>
                      {row.narration && <p className="text-xs text-gray-400 mt-0.5">{row.narration}</p>}
                    </td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                      {row.bank_name || row.bank_code}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-rose-600 whitespace-nowrap">
                      -{formatCurrency(row.amount)}
                    </td>
                    <td className="px-6 py-4">{statusBadge(row.status)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loadingTransfers && transfers.length === 0 && (
          <div className="p-16 text-center border-t border-gray-100">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transfers yet</h3>
            <p className="text-sm text-gray-600">
              Admin-initiated withdrawals will appear here
            </p>
          </div>
        )}

        {transfers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-4 flex-wrap text-sm text-gray-600">
            <span>
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {(pagination.page - 1) * pagination.limit + transfers.length} of {pagination.total}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadTransfers(pagination.page - 1)}
                disabled={pagination.page <= 1 || loadingTransfers}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <span className="text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => loadTransfers(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages || loadingTransfers}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
