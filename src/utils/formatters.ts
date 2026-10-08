import { format } from 'date-fns';

export const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
  const value = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (date: string | Date, formatStr: string = 'dd MMM yyyy'): string => {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '—';
  return format(parsed, formatStr);
};

export const formatDateTime = (date: string | Date): string => {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '—';
  return format(parsed, 'dd MMM yyyy HH:mm');
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-NG').format(num);
};

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    COMPLETED: 'text-green-600 bg-green-50',
    APPROVED: 'text-green-600 bg-green-50',
    APPROVED_1: 'text-blue-600 bg-blue-50',
    APPROVED_2: 'text-green-600 bg-green-50',
    PENDING_APPROVAL: 'text-yellow-600 bg-yellow-50',
    PROCESSING: 'text-blue-600 bg-blue-50',
    FAILED: 'text-red-600 bg-red-50',
    REJECTED: 'text-red-600 bg-red-50',
    CANCELLED: 'text-gray-600 bg-gray-50',
    ACTIVE: 'text-green-600 bg-green-50',
    FROZEN: 'text-red-600 bg-red-50',
    RESTRICTED: 'text-orange-600 bg-orange-50',
    PENDING: 'text-yellow-600 bg-yellow-50',
  };
  return statusColors[status] || 'text-gray-600 bg-gray-50';
};

export const getStatusBadgeColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800',
    APPROVED: 'bg-green-100 text-green-800',
    APPROVED_1: 'bg-blue-100 text-blue-800',
    APPROVED_2: 'bg-green-100 text-green-800',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    FAILED: 'bg-red-100 text-red-800',
    REJECTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    FROZEN: 'bg-red-100 text-red-800',
    RESTRICTED: 'bg-orange-100 text-orange-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

export const getChangeIndicator = (value: number): { color: string; icon: string } => {
  if (value > 0) return { color: 'text-green-600', icon: '↑' };
  if (value < 0) return { color: 'text-red-600', icon: '↓' };
  return { color: 'text-gray-600', icon: '=' };
};
