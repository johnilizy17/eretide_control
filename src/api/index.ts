import { apiClient } from './client';
import type {
  Transaction,
  Account,
  User,
  DashboardStats,
  MoneyFlowData,
  TransferRequest,
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
export interface AuditLogEntry {
  _id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  object_type: string;
  object_id: string;
  description: string;
  ip_address: string;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogListResult {
  logs: AuditLogEntry[];
  filters: { actions: string[]; objectTypes: string[] };
  pagination: { page: number; limit: number; total: number; pages: number };
}

export const auditLogsApi = {
  getAll: async (filters?: {
    page?: number;
    limit?: number;
    action?: string;
    objectType?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<AuditLogListResult> => {
    const res = await apiClient.get('/audit-logs', { params: filters });
    const body = res.data?.data ?? res.data;
    return (body?.data ?? body) as AuditLogListResult;
  },
  write: (payload: {
    action: string;
    object_type?: string;
    object_id?: string;
    description?: string;
    metadata?: Record<string, any>;
  }) => apiClient.post('/audit-logs', payload),
};

// Notifications API (eretide_backend: /notification)
export type NotificationType = 'View' | 'Link' | 'Video';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export const notificationsApi = {
  getAll: async (): Promise<{ items: NotificationItem[]; unread: number }> => {
    const res = await apiClient.get('/notification/all');
    const body = res.data?.data ?? res.data;
    const items = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
    return { items: items as NotificationItem[], unread: Number(body?.unread ?? 0) };
  },
  markRead: (id: string) => apiClient.post(`/notification/${id}/read`),
  markAllRead: () => apiClient.post('/notification/read-all'),
  del: (id: string) => apiClient.post('/notification/delete', { _id: id }),
  send: (payload: {
    title: string;
    message: string;
    type: NotificationType;
    link: string;
  }) => apiClient.post('/notification', payload),
};

// Admin users API (eretide_backend: /admin/users)
export interface AdminUser {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  role: string;
  status: boolean;
  EMCOOPID?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUserListResult {
  admins: AdminUser[];
  stats: { active: number; inactive: number };
  pagination: { page: number; limit: number; total: number; pages: number };
}

export const adminsApi = {
  list: async (params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminUserListResult> => {
    const res = await apiClient.get('/admin/users', { params });
    const body = res.data?.data ?? res.data;
    return (body?.data ?? body) as AdminUserListResult;
  },
  create: (payload: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
  }) => apiClient.post('/admin/users', payload),
  update: (
    id: string,
    payload: {
      firstname?: string;
      lastname?: string;
      email?: string;
      phone?: string;
      role?: string;
      status?: boolean;
    }
  ) => apiClient.put(`/admin/users/${id}`, payload),
  remove: (id: string) => apiClient.delete(`/admin/users/${id}`),
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
  getAllWallets: (params?: { page?: number; limit?: number }) =>
    apiClient.get(`/polaris_wallet/all`, { params }),
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
  // Balances for a single user: { main: { balance, available }, bashiri, ... }
  getBalance: (userId: string) => apiClient.get(`/polaris_wallet/balance/${userId}`),
  // Withdraw to a bank account (external transfer)
  withdraw: (payload: {
    from_user_id: string;
    account_number: string;
    bank_code: string;
    bank_name?: string;
    recipient_name?: string;
    amount: number;
    description?: string;
    from_account_type?: string;
  }) => apiClient.post(`/polaris_wallet/transfer/external`, payload),
  // Send from one member to another (internal transfer)
  transferInternal: (payload: {
    from_user_id: string;
    to_user_id: string;
    amount: number;
    description?: string;
    from_account_type?: string;
    to_account_type?: string;
  }) => apiClient.post(`/polaris_wallet/transfer/internal`, payload),
  // Move funds between a member's own accounts (inter-account)
  transferInterAccount: (payload: {
    user_id: string;
    from_account_type: string;
    to_account_type: string;
    amount: number;
    description?: string;
  }) => apiClient.post(`/polaris_wallet/transfer/inter-account`, payload),
  getTransferHistory: (
    userId: string,
    params?: { status?: string; transfer_type?: string; page?: number; limit?: number }
  ) => apiClient.get(`/polaris_wallet/transfer/history/${userId}`, { params }),
  getTransferStats: (userId: string) => apiClient.get(`/polaris_wallet/transfer/stats/${userId}`),
};

export type AdminTransferStatus = 'pending' | 'completed' | 'failed';

export interface AdminAccount {
  id: string;
  name: string;
  type: string;
  accountNumber: string;
  bank: string;
  balance: number;
  currency: string;
}

export interface AdminBalanceStats {
  total_in: number;
  total_out: number;
  pending: number;
  completed: number;
  failed: number;
  count: number;
}

export interface AdminBalance {
  accounts: AdminAccount[];
  system: {
    balance: number;
    accountNumber: string;
    bankName: string;
    ledgerBalance: number | null;
  };
  reserve: {
    balance: number;
    breakdown: Record<string, number> | null;
  };
  stats: AdminBalanceStats;
}

export interface AdminTransferRow {
  _id: string;
  amount: number;
  account_number: string;
  account_name: string;
  bank_code: string;
  bank_name: string;
  narration: string;
  reference: string;
  status: AdminTransferStatus;
  balance_before: number;
  balance_after: number;
  created_by: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTransferList {
  transfers: AdminTransferRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

// Central admin wallet: system balance, withdrawals & admin transfer history
// (eretide_backend: /admin/wallet/balance | /admin/wallet/transfer | /admin/wallet/transfers)
export const adminWalletApi = {
  getBalance: async (): Promise<AdminBalance> => {
    const res = await apiClient.get('/admin/wallet/balance');
    const body = res.data?.data ?? res.data;
    return (body?.data ?? body) as AdminBalance;
  },
  createTransfer: async (payload: {
    amount: number;
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name?: string;
    narration?: string;
  }): Promise<AdminTransferRow> => {
    const res = await apiClient.post('/admin/wallet/transfer', payload);
    const body = res.data?.data ?? res.data;
    return (body?.data ?? body) as AdminTransferRow;
  },
  getTransfers: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<AdminTransferList> => {
    const res = await apiClient.get('/admin/wallet/transfers', { params });
    const body = res.data?.data ?? res.data;
    return (body?.data ?? body) as AdminTransferList;
  },
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ data: { token: string; refreshToken: string; profile: User } }>('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  verifyMfa: (code: string) => apiClient.post('/auth/mfa/verify', { code }),
};
