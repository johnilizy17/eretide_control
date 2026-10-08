import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Users, Eye, X } from 'lucide-react';
import { accountsApi, committeeApi } from '../api';
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeColor } from '../utils/formatters';
import type { Account } from '../types';

type Tab = 'overview' | 'transactions' | 'members' | 'head';

export const ReportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const decodedId = id ? decodeURIComponent(id) : '';
  const isCommittee = decodedId.startsWith('committee:');
  const rawId = decodedId.split(':')[1] || '';

  const [account, setAccount] = useState<Account | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const fetchAll = async () => {
    if (!decodedId) return;
    setLoading(true);
    setError('');
    try {
      const [accountRes, txRes] = await Promise.all([
        accountsApi.getById(decodedId),
        accountsApi.getTransactions(decodedId, { page: 1, limit: 20 } as any),
      ]);

      const accountPayload: any = (accountRes.data as any)?.data?.data ?? (accountRes.data as any)?.data ?? accountRes.data;
      setAccount(accountPayload ?? null);

      const txPayload: any = (txRes.data as any)?.data ?? txRes.data;
      setTransactions(Array.isArray(txPayload?.data) ? txPayload.data : Array.isArray(txPayload) ? txPayload : []);

      if (Array.isArray(accountPayload?.members)) {
        setMembers(accountPayload.members);
      } else if (isCommittee && rawId) {
        try {
          const groupRes = await committeeApi.getGroup(rawId);
          const groupPayload: any = (groupRes.data as any)?.data ?? groupRes.data;
          setMembers(Array.isArray(groupPayload?.user_ids) ? groupPayload.user_ids : []);
        } catch (e) {
          console.error('Failed to load committee members:', e);
        }
      }
    } catch (err: any) {
      console.error('Failed to load report:', err);
      setError(err.response?.data?.message || 'Failed to load report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [decodedId]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'transactions', label: `Transactions (${transactions.length})` },
    { key: 'members', label: `Members (${members.length})` },
    { key: 'head', label: 'Head' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {account?.ownerName || 'Report'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">{account?.accountNumber || decodedId}</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Account Summary */}
      {account && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Available Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(account.availableBalance, account.currency)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Status</p>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(account.status)}`}>
              {account.status}
            </span>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Location</p>
            <p className="text-sm font-semibold text-gray-900">{account.location?.name || '—'}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Opened</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(account.openedDate)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                tab === key
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview */}
          {tab === 'overview' && account && (
            <div className="text-sm">
              {[
                ['Owner', account.ownerName || '—'],
                ['Account Number', account.accountNumber || '—'],
                ['Location', account.location?.name || '—'],
                ['Level', account.location?.level || '—'],
                ['Currency', account.currency],
                ['Opened', formatDate(account.openedDate)],
                ['Restrictions', String(account.restrictions?.length ?? 0)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900 text-right">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Transactions */}
          {tab === 'transactions' && (
            loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No transactions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((t: any, i: number) => {
                      const type = t.transaction_type || t.action || t.type || '—';
                      const amount = t.amount ?? t.details?.amount ?? 0;
                      const status = t.status || t.details?.status || '—';
                      const date = t.created_at || t.createdAt || t.timestamp;
                      return (
                        <tr key={t._id || t.id || i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {date ? formatDateTime(date) : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                            {String(type).replace(/_/g, ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(Number(amount) || 0, account?.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(String(status).toUpperCase())}`}>
                              {String(status).replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setSelectedTx(t)}
                              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Members */}
          {tab === 'members' && (
            members.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No members found.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {members.map((m: any, i: number) => (
                  <div key={m._id || i} className="py-2.5 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {[m.firstname, m.lastname].filter(Boolean).join(' ') || m.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {[m.role, m.email, m.phone, m.EMCOOPID].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Head */}
          {tab === 'head' && account && (
            <div className="text-sm">
              {[
                ['Name / Group', account.ownerName || '—'],
                ['Level', account.location?.level || '—'],
                ['Number', account.accountNumber || '—'],
                ['Location', account.location?.name || '—'],
                ['Status', account.status],
                ['Balance', formatCurrency(account.availableBalance, account.currency)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900 text-right">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedTx(null)} aria-hidden="true" />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900">Transaction Details</h2>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    Number(selectedTx.amount ?? selectedTx.details?.amount ?? 0) || 0,
                    selectedTx.currency || account?.currency
                  )}
                </p>
                <span
                  className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                    String(selectedTx.status || selectedTx.details?.status || '').toUpperCase()
                  )}`}
                >
                  {String(selectedTx.status || selectedTx.details?.status || '—').replace(/_/g, ' ')}
                </span>
              </div>

              {/* All available transaction fields */}
              <div className="text-sm">
                {[
                  ['Reference', selectedTx.reference || selectedTx._id || selectedTx.id || '—'],
                  ['Type', selectedTx.transaction_type || selectedTx.action || selectedTx.type || '—'],
                  ['Currency', selectedTx.currency || account?.currency || 'NGN'],
                  ['Purpose', selectedTx.purpose || selectedTx.details?.purpose || '—'],
                  ['From', selectedTx.source_account?.account_number || selectedTx.sourceAccount?.accountNumber || selectedTx.from || '—'],
                  ['To', selectedTx.destination_account?.account_number || selectedTx.destinationAccount?.accountNumber || selectedTx.to || '—'],
                  ['Initiated By', selectedTx.initiator?.name || selectedTx.initiated_by?.name || selectedTx.user_id || '—'],
                  ['Created', formatDateTime(selectedTx.created_at || selectedTx.createdAt || selectedTx.timestamp)],
                  ['Updated', selectedTx.updated_at || selectedTx.updatedAt ? formatDateTime(selectedTx.updated_at || selectedTx.updatedAt) : '—'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900 text-right break-words max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>

              {/* Nested details/metadata */}
              {selectedTx.details && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Additional Details</h3>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 space-y-1">
                    {Object.entries(selectedTx.details).map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between gap-4">
                        <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-medium text-gray-900 text-right break-words max-w-[60%]">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approvals */}
              {Array.isArray(selectedTx.approvals) && selectedTx.approvals.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Approvals ({selectedTx.approvals.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedTx.approvals.map((a: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {a.signatory?.name || a.approver_role || 'Signatory'}
                          </p>
                          <p className="text-xs text-gray-500">{a.decision || a.approvalSlot || ''}</p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(a.timestamp || a.decided_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw record (for audit purposes) */}
              <details>
                <summary className="text-xs text-gray-400 cursor-pointer">Raw record</summary>
                <pre className="mt-2 bg-gray-50 rounded-lg p-3 text-[10px] text-gray-600 overflow-auto max-h-48">
                  {JSON.stringify(selectedTx, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
