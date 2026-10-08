import { useEffect } from 'react';
import { X, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency, formatDateTime, getStatusBadgeColor } from '../../utils/formatters';
import type { DashboardTransaction } from '../../types';

interface TransactionDetailModalProps {
  transaction: DashboardTransaction | null;
  onClose: () => void;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-900 text-right break-words">{value}</span>
  </div>
);

export const TransactionDetailModal = ({ transaction, onClose }: TransactionDetailModalProps) => {
  // Close on Escape.
  useEffect(() => {
    if (!transaction) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [transaction, onClose]);

  if (!transaction) return null;

  const approvals = transaction.approvals ?? [];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">
              Transaction Details
            </h2>
            <p className="text-xs font-medium text-emerald-600 truncate">
              {transaction.reference}
            </p>
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
            <p className="text-sm text-gray-500 mb-1">Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(transaction.amount, transaction.currency)}
            </p>
            <span
              className={`inline-block mt-2 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(transaction.status)}`}
            >
              {transaction.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div>
            <Row label="Type" value={transaction.type} />
            <Row label="Section" value={transaction.section} />
            <Row label="Location" value={transaction.location || '—'} />
            <Row label="State" value={transaction.state || '—'} />
            <Row label="Purpose" value={transaction.purpose || '—'} />
            <Row
              label="Initiated By"
              value={transaction.initiatedByName || transaction.initiatedBy || '—'}
            />
            <Row label="Date" value={formatDateTime(transaction.createdAt)} />
          </div>

          {/* Approvals */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Approved By ({approvals.length}/2)
            </h3>
            {approvals.length === 0 ? (
              <p className="text-sm text-gray-500">No approvals recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {approvals.map((approval, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {approval.name}
                        </p>
                        {approval.role && (
                          <p className="text-xs text-gray-500 capitalize">
                            {String(approval.role).replace(/_/g, ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                    {approval.decidedAt && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDateTime(approval.decidedAt)}
                      </span>
                    )}
                  </div>
                ))}
                {approvals.length < 2 && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 px-3 py-2">
                    <Clock className="w-4 h-4" />
                    Awaiting remaining approval
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
