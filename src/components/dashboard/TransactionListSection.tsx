interface TransactionListSectionProps {
  title: string;
  items: any[];
  loading?: boolean;
}

export const TransactionListSection = ({ title, items, loading }: TransactionListSectionProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No transactions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Reference</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tx: any, idx: number) => (
                <tr key={tx._id ?? tx.id ?? idx} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 text-gray-900">
                    {tx.reference ?? tx._id ?? tx.id ?? '—'}
                  </td>
                  <td className="py-2 text-gray-900">
                    {tx.currency ?? 'NGN'} {(tx.amount ?? 0).toLocaleString()}
                  </td>
                  <td className="py-2 text-gray-600">{tx.status ?? tx.type ?? '—'}</td>
                  <td className="py-2 text-gray-500">
                    {tx.createdAt ?? tx.created_at ?? tx.date ?? tx.timestamp ?? '—'}
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
