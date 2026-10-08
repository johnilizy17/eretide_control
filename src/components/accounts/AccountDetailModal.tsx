import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { accountsApi } from '../../api';
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeColor } from '../../utils/formatters';
import type { Account } from '../../types';

interface AccountDetailModalProps {
  account: Account | null;
  onClose: () => void;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-900 text-right break-words">{value}</span>
  </div>
);

export const AccountDetailModal = ({ account, onClose }: AccountDetailModalProps) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');

  useEffect(() => {
    if (!account) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [account, onClose]);

  // Fetch last 5 transactions for the account
  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    setTxLoading(true);
    setTxError('');
    accountsApi
      .getTransactions(account.id, { page: 1, limit: 5 } as any)
      .then((res) => {
        if (cancelled) return;
        const payload: any = (res.data as any)?.data ?? res.data;
        const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
        setTransactions(list.slice(0, 5));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to fetch account transactions:', err);
        setTxError(err.response?.data?.message || 'Failed to load transactions.');
      })
      .finally(() => {
        if (!cancelled) setTxLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [account]);

  if (!account) return null;

  const restrictions = account.restrictions ?? [];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">Account Details</h2>
            <p className="text-xs font-medium text-emerald-600 truncate">{account.accountNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(account.availableBalance, account.currency)}
            </p>
            <span
              className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(account.status)}`}
            >
              {account.status}
            </span>
          </div>

          <div>
            <Row label="Owner" value={account.ownerName || '—'} />
            <Row label="Account Number" value={account.accountNumber || '—'} />
            <Row label="Location" value={account.location?.name || '—'} />
            <Row label="Level" value={account.location?.level || '—'} />
            <Row label="Currency" value={account.currency} />
            <Row label="Opened" value={formatDate(account.openedDate)} />
          </div>

          {/* Recent Transactions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Recent Transactions ({transactions.length})
            </h3>
            {txLoading ? (
              <p className="text-sm text-gray-500">Loading transactions...</p>
            ) : txError ? (
              <p className="text-sm text-red-600">{txError}</p>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((t, i) => {
                  const type = t.transaction_type || t.action || t.type || '—';
                  const amount = t.amount ?? t.details?.amount ?? 0;
                  const status = t.status || t.details?.status || '—';
                  const date = t.created_at || t.createdAt || t.timestamp;
                  return (
                    <div
                      key={t._id || t.id || i}
                      className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate capitalize">
                          {String(type).replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-500">{date ? formatDateTime(date) : '—'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(Number(amount) || 0, account.currency)}
                        </p>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusBadgeColor(String(status).toUpperCase())}`}
                        >
                          {String(status).replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Restrictions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Restrictions ({restrictions.length})
            </h3>
            {restrictions.length === 0 ? (
              <p className="text-sm text-gray-500">No active restrictions.</p>
            ) : (
              <div className="space-y-2">
                {restrictions.map((r) => (
                  <div key={r.id} className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-sm font-medium text-gray-800">
                      {r.restrictionType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500">{r.reason || 'No reason provided'}</p>
                    <p className="text-xs text-gray-400">Started {formatDateTime(r.startedAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
