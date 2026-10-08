import type { LucideProps } from 'lucide-react';
import { formatCurrency, getChangeIndicator } from '../../utils/formatters';

interface StatCardProps {
  title: string;
  value: number;
  change?: number;
  icon: React.ComponentType<LucideProps>;
  iconColor: string;
  subtitle?: string;
  currency?: boolean;
}

export const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  subtitle,
  currency = false,
}: StatCardProps) => {
  const changeInfo = change !== undefined ? getChangeIndicator(change) : null;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {currency ? formatCurrency(value) : value.toLocaleString()}
          </h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {changeInfo && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-medium ${changeInfo.color}`}>
                {changeInfo.icon} {Math.abs(change!)}% from last month
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};
