import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TransactionsByLocationProps {
  data: Array<{
    location: string;
    amount: number;
    percentage: number;
  }>;
  loading?: boolean;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899'];

export const TransactionsByLocation = ({ data, loading }: TransactionsByLocationProps) => {
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  const hasData = data.length > 0 && totalAmount > 0;

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">Transaction by Location</h2>
        <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none">
          <option>All States</option>
        </select>
      </div>

      {loading ? (
        <div className="h-64 sm:h-72 flex items-center justify-center text-sm text-gray-500">
          Loading chart…
        </div>
      ) : !hasData ? (
        <div className="h-64 sm:h-72 flex items-center justify-center text-sm text-gray-500">
          No transaction data available.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-full sm:w-1/2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="amount"
                >
                  {data.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full sm:flex-1">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">₦{totalAmount.toLocaleString()}</p>
            </div>

            <div className="space-y-3 max-h-52 overflow-y-auto">
              {data.map((item, index) => (
                <div key={item.location} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-gray-700 truncate">{item.location}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{item.percentage}%</p>
                    <p className="text-xs text-gray-500">₦{item.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
