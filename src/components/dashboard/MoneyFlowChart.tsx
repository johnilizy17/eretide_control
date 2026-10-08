import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MoneyFlowChartProps {
  data: Array<{
    date: string;
    deposits: number;
    withdrawals: number;
  }>;
  loading?: boolean;
}

const compactNaira = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `₦${(value / 1_000).toFixed(0)}k`;
  return `₦${value.toLocaleString()}`;
};

export const MoneyFlowChart = ({ data, loading }: MoneyFlowChartProps) => {
  const hasData = data.some((d) => d.deposits > 0 || d.withdrawals > 0);

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">Money Flow Overview</h2>
        <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none">
          <option>Last 30 Days</option>
        </select>
      </div>

      {loading ? (
        <div className="h-64 sm:h-72 flex items-center justify-center text-sm text-gray-500">
          Loading chart…
        </div>
      ) : !hasData ? (
        <div className="h-64 sm:h-72 flex items-center justify-center text-sm text-gray-500">
          No settled transactions in this period.
        </div>
      ) : (
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={20} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={compactNaira} width={52} />
              <Tooltip
                formatter={(value) => `₦${Number(value).toLocaleString()}`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="deposits" fill="#10b981" name="Deposits" radius={[8, 8, 0, 0]} />
              <Bar dataKey="withdrawals" fill="#ef4444" name="Withdrawals" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
