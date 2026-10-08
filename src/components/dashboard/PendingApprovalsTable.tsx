import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import type { DashboardTransaction } from '../../types';

interface PendingApprovalsTableProps {
  transactions: DashboardTransaction[];
  loading?: boolean;
  onView?: (transaction: DashboardTransaction) => void;
}

const approverName = (approval: any): string => {
  if (!approval) return 'Pending';
  return (
    approval?.name ??
    approval?.signatory?.name ??
    approval?.approver?.name ??
    approval?.approver_role ??
    'Approved'
  );
};

export const PendingApprovalsTable = ({ transactions, loading, onView }: PendingApprovalsTableProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">
          Pending Approvals (2 Signatories Required)
        </h2>
        <Link
          to="/approvals"
          className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
        >
          View All →
        </Link>
      </div>

      {loading ? (
        <p className="p-6 text-sm text-gray-500">Loading…</p>
      ) : transactions.length === 0 ? (
        <p className="p-6 text-sm text-gray-500">No pending approvals.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Signatory 1
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Signatory 2
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => {
                const approvals = transaction.approvals ?? [];
                const approval1 = approvals[0];
                const approval2 = approvals[1];

                return (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(transaction.createdAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => onView?.(transaction)}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline text-left"
                        >
                          {transaction.reference}
                        </button>
                        <p className="text-xs text-gray-500">
                          {transaction.type} · {transaction.section}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {approval1 ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">{approverName(approval1)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {approval2 ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">{approverName(approval2)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium text-xs">
                          Approve
                        </button>
                        <button className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium text-xs">
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => onView?.(transaction)}
                          className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 font-medium text-xs"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
