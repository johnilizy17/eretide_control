import { apiClient } from './client';
import type {
  Transaction,
  Account,
  User,
  DashboardStats,
  MoneyFlowData,
  TransferRequest,
  AuditLog,
  FilterOptions,
  LocationTransactionData,
  ControlDashboardData,
} from '../types';

// Admin control dashboard API (eretide_backend: GET /admin/control/dashboard)
export const adminControlApi = {
  getDashboard: async (params?: { from?: string; to?: string; recent?: number }) => {
    const res = await apiClient.get('/admin/control/dashboard', { params });
    // Backend wraps as { data: { message, data: {...} } }
    const body = res.data?.data ?? res.data;
    return (body?.data ?? body) as ControlDashboardData;
  },
  getMoneyFlow: async (params?: {
    from?: string;
    to?: string;
    granularity?: 'day' | 'week' | 'month';
  }) => {
    const res = await apiClient.get('/admin/control/money-flow', { params });
    const body = res.data?.data ?? res.data;
    return (body?.data ?? body) as MoneyFlowData[];
  },
  getTransactionsByLocation: async (params?: { from?: string; to?: string }) => {
    const res = await apiClient.get('/admin/control/transactions-by-location', { params });
    const body = res.data?.data ?? res.data;
    return (body?.data ?? body) as LocationTransactionData[];
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/dashboard/stats'),
  getMoneyFlow: (period: 'day' | 'week' | 'month') =>
    apiClient.get<MoneyFlowData[]>(`/dashboard/money-flow?period=${period}`),
  getTransactionsByLocation: (period: 'day' | 'week' | 'month') =>
    apiClient.get<LocationTransactionData[]>(`/dashboard/transactions-by-location?period=${period}`),
  getRecentTransactions: (limit = 10) =>
    apiClient.get<Transaction[]>(`/dashboard/recent-transactions?limit=${limit}`),
  getPendingApprovals: (limit = 10) =>
    apiClient.get<Transaction[]>(`/dashboard/pending-approvals?limit=${limit}`),
};

// Transactions API
export const transactionsApi = {
  getAll: (filters?: FilterOptions) =>
    apiClient.get<{ data: Transaction[]; total: number }>('/transactions', { params: filters }),
  getById: (id: string) => apiClient.get<Transaction>(`/transactions/${id}`),
  create: (data: Partial<Transaction>) => apiClient.post<Transaction>('/transactions', data),
  approve: (id: string, reason?: string) =>
    apiClient.post(`/transactions/${id}/approve`, { reason }),
  reject: (id: string, reason: string) =>
    apiClient.post(`/transactions/${id}/reject`, { reason }),
  cancel: (id: string, reason: string) =>
    apiClient.post(`/transactions/${id}/cancel`, { reason }),
  getStats: () =>
    apiClient.get<{
      totalDeposits: number;
      totalWithdrawals: number;
      pendingApprovals: number;
      completedToday: number;
    }>('/transactions/stats'),
};

// Transfers API
export const transfersApi = {
  initiate: (data: TransferRequest) => apiClient.post<Transaction>('/transfers', data),
  getAll: (filters?: FilterOptions) =>
    apiClient.get<{ data: Transaction[]; total: number }>('/transfers', { params: filters }),
};

// Accounts API
export const accountsApi = {
  getAll: (filters?: Partial<{ search: string; status: string; locationId: string }>) =>
    apiClient.get<{ data: Account[]; total: number }>('/accounts', { params: filters }),
  getById: (id: string) => apiClient.get<Account>(`/accounts/${encodeURIComponent(id)}`),
  getTransactions: (id: string, filters?: FilterOptions) =>
    apiClient.get<{ data: Transaction[]; total: number }>(`/accounts/${encodeURIComponent(id)}/transactions`, {
      params: filters,
    }),
  freeze: (id: string, reason: string) =>
    apiClient.post(`/accounts/${encodeURIComponent(id)}/freeze`, { reason }),
  unfreeze: (id: string, reason: string) =>
    apiClient.post(`/accounts/${encodeURIComponent(id)}/unfreeze`, { reason }),
  restrict: (id: string, restrictionType: string, reason: string) =>
    apiClient.post(`/accounts/${encodeURIComponent(id)}/restrict`, { restrictionType, reason }),
};

// Committee API
export const committeeApi = {
  getGroups: () => apiClient.get<{ success: boolean; data: any[] }>('/committee/groups'),
  getGroup: (id: string) => apiClient.get<{ success: boolean; data: any }>(`/committee/groups/${id}`),
};

// Audit Logs API
export const auditLogsApi = {
  getAll: (filters?: Partial<{ action: string; objectType: string; dateFrom: string; dateTo: string }>) =>
    apiClient.get<{ data: AuditLog[]; total: number }>('/audit-logs', { params: filters }),
};

// Users API
export const usersApi = {
  getAll: (filters?: Partial<{ role: string; status: string }>) =>
    apiClient.get<{ data: User[]; total: number }>('/users', { params: filters }),
  getById: (id: string) => apiClient.get<User>(`/users/${id}`),
  getCurrent: () => apiClient.get<User>('/users/me'),
};

// Branch / Zonal / Committee / Polaris transaction history API
export const transactionsFeedApi = {
  getBranchTransactions: (branchId?: string) =>
    apiClient.get<{ data?: any[] } | any[]>('/organisation/history/branch', {
      params: { branch: branchId, limit: 10 },
    }),
  getZonalTransactions: (zonalId?: string) =>
    apiClient.get<{ data?: any[] } | any[]>('/organisation/history/zonal', {
      params: { zonal: zonalId, limit: 10 },
    }),
  getCommitteeGroups: () =>
    apiClient.get<{ data?: any[] } | any[]>('/committee/groups'),
  getCommitteeTransactions: (groupId: string) =>
    apiClient.get<{ data?: any[] } | any[]>(`/committee/groups/${groupId}/audit`),
  getPolarisTransactions: (userId: string) =>
    apiClient.get<{ data?: any[] } | any[]>(
      `/polaris_wallet/transactions/history/${userId}`,
      { params: { transaction_type: 'all', page: 1, limit: 10 } }
    ),
};

// Polaris wallet transactions API
export const polarisApi = {
  getTransactions: (
    userId: string,
    params?: {
      transaction_type?: string;
      status?: string;
      account_type?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number;
    }
  ) => apiClient.get(`/polaris_wallet/transactions/history/${userId}`, { params }),
  getStats: (userId: string, accountType?: string) =>
    apiClient.get(`/polaris_wallet/transactions/stats/${userId}`, {
      params: { account_type: accountType },
    }),
  getWallet: (userId: string) => apiClient.get(`/polaris_wallet/user/${userId}`),
  getAllWallets: () => apiClient.get(`/polaris_wallet/all`),
  getAllBalances: (page = 1, limit = 50) =>
    apiClient.get(`/polaris_wallet/balance/all`, { params: { page, limit } }),
  getAllTransactions: (params?: {
    transaction_type?: string;
    status?: string;
    account_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get(`/polaris_wallet/transactions/history`, { params }),
  searchUsers: (query: string) => apiClient.get(`/profile/search/user`, { params: { query } }),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ data: { token: string; refreshToken: string; profile: User } }>('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  verifyMfa: (code: string) => apiClient.post('/auth/mfa/verify', { code }),
};
