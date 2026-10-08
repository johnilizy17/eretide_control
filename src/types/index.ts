// Core Types for EMCOOP Financial Control Center

export type TransactionStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED_1'
  | 'APPROVED_2'
  | 'QUEUED_FOR_EXECUTION'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED'
  | 'CANCELLED';

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';

export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'RESTRICTED' | 'PENDING';

export type LocationLevel = 'APEX' | 'ZONE' | 'BRANCH' | 'COMMUNITY';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'FINANCIAL_CONTROLLER'
  | 'SIGNATORY_1'
  | 'SIGNATORY_2'
  | 'AUDITOR'
  | 'ZONE_ADMIN'
  | 'BRANCH_ADMIN'
  | 'COMMUNITY_ADMIN';

export interface Location {
  id: string;
  name: string;
  level: LocationLevel;
  parentId?: string;
  code: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  ownerName: string;
  locationId: string;
  location?: Location;
  currency: string;
  status: AccountStatus;
  availableBalance: number;
  openedDate: string;
  restrictions?: AccountRestriction[];
  members?: AccountMember[];
}

export interface AccountMember {
  role?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  EMCOOPID?: string;
}

export interface AccountRestriction {
  id: string;
  accountId: string;
  restrictionType: 'FREEZE' | 'RESTRICT_WITHDRAWALS' | 'RESTRICT_TRANSFERS' | 'RESTRICT_DEPOSITS';
  reason: string;
  createdBy: string;
  approvedBy?: string;
  startedAt: string;
  endedAt?: string;
}

export interface Transaction {
  id: string;
  reference: string;
  type: TransactionType;
  sourceAccountId?: string;
  sourceAccount?: Account;
  destinationAccountId?: string;
  destinationAccount?: Account;
  amount: number;
  currency: string;
  purpose: string;
  status: TransactionStatus;
  initiatedBy: string;
  initiator?: User;
  createdAt: string;
  updatedAt: string;
  approvals?: TransactionApproval[];
  events?: TransactionEvent[];
}

export interface TransactionApproval {
  id: string;
  transactionId: string;
  signatoryId: string;
  signatory?: User;
  approvalSlot: 1 | 2;
  decision: 'APPROVED' | 'REJECTED';
  reason?: string;
  timestamp: string;
  authenticationEvent?: string;
}

export interface TransactionEvent {
  id: string;
  transactionId: string;
  eventType: string;
  description: string;
  actorId?: string;
  actor?: User;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  mfaEnabled: boolean;
  organizationScope?: string;
  branch_id?: string;
  head_branch_id?: string;
  zonal_id?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalBalance: number;
  pendingApprovals: number;
  frozenAccounts: number;
  depositsChange: number;
  withdrawalsChange: number;
}

// Response of GET /admin/control/dashboard
export type ControlSection = 'branch' | 'zonal' | 'committee' | 'apx' | 'parliament';

export interface ControlBucket {
  count: number;
  amount: number;
}

export interface ControlSectionData {
  count: number;
  balance: { total: number; breakdown: Record<string, number> };
  transactions: {
    total: ControlBucket;
    deposits: ControlBucket;
    withdrawals: ControlBucket;
    pending: ControlBucket;
    byStatus: Record<string, ControlBucket>;
    byType: Record<string, ControlBucket>;
    recent: any[];
  };
}

export interface ControlDashboardSummary {
  totalBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingApprovals: number;
  pendingAmount: number;
  transactionCount: number;
  entities: Record<ControlSection, number>;
  balanceBySection: Record<ControlSection, number>;
  recentTransactions: DashboardTransaction[];
  pendingTransactions: DashboardTransaction[];
}

// Normalized transaction shape returned by the control dashboard / feeds
export interface DashboardApproval {
  name: string;
  role?: string;
  decision?: string;
  decidedAt?: string | null;
}

export interface DashboardTransaction {
  id: string;
  reference: string;
  type: TransactionType;
  amount: number;
  currency: string;
  purpose: string;
  status: string;
  section: ControlSection;
  location: string;
  state: string;
  initiatedBy?: string;
  initiatedByName?: string;
  createdAt: string;
  approvals?: DashboardApproval[];
}

export type ControlDashboardData = {
  filters: { from: string | null; to: string | null; recent: number };
  summary: ControlDashboardSummary;
} & Record<ControlSection, ControlSectionData>;

export interface MoneyFlowData {
  date: string;
  deposits: number;
  withdrawals: number;
}

export interface LocationTransactionData {
  location: string;
  amount: number;
  percentage: number;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actor?: User;
  action: string;
  objectType: string;
  objectId: string;
  beforeSnapshot?: string;
  afterSnapshot?: string;
  ipAddress?: string;
  sessionId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  purpose: string;
  reference?: string;
  remarks?: string;
}

export interface ApprovalWorkflow {
  transactionId: string;
  transaction?: Transaction;
  signatory1Status: 'PENDING' | 'APPROVED' | 'REJECTED';
  signatory1Id?: string;
  signatory1Timestamp?: string;
  signatory2Status: 'PENDING' | 'APPROVED' | 'REJECTED';
  signatory2Id?: string;
  signatory2Timestamp?: string;
  executionStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface FilterOptions {
  locationLevel?: LocationLevel;
  locationId?: string;
  transactionType?: TransactionType;
  status?: TransactionStatus;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  initiatorId?: string;
  approverId?: string;
  searchQuery?: string;
}
