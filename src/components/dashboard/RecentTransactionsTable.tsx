import { Eye, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDateTime, getStatusBadgeColor } from '../../utils/formatters';
import type { DashboardTransaction } from '../../types';

interface RecentTransactionsTableProps {
  transactions: DashboardTransaction[];
  loading?: boolean;
  onView?: (transaction: DashboardTransaction) => void;
}

export const RecentTransactionsTable = ({ transactions, loading, onView }: RecentTransactionsTableProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">Recent Transactions</h2>
        <Link
          to="/transactions"
          className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
        >
          View All →
        </Link>
      </div>

      {loading ? (
        <p className="p-6 text-sm text-gray-500">Loading…</p>
      ) : transactions.length === 0 ? (
        <p className="p-6 text-sm text-gray-500">No recent transactions.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Initiated By
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Approved By
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(transaction.createdAt)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-emerald-600">{transaction.reference}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {transaction.location || transaction.state || 'N/A'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-xs font-medium ${
                        transaction.type === 'DEPOSIT'
                          ? 'text-green-600'
                          : transaction.type === 'WITHDRAWAL'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {transaction.initiatedByName || '—'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                    {transaction.approvals && transaction.approvals.length > 0 ? (
                      <div className="space-y-0.5">
                        {transaction.approvals.slice(0, 2).map((a, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                            <span className="truncate max-w-[12rem]">{a.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(transaction.status)}`}
                    >
                      {transaction.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      type="button"
                      onClick={() => onView?.(transaction)}
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
      )}
    </div>
  );
};
