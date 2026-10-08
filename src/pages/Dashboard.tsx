import { useCallback, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, Clock, Activity, RefreshCw } from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { MoneyFlowChart } from '../components/dashboard/MoneyFlowChart';
import { TransactionsByLocation } from '../components/dashboard/TransactionsByLocation';
import { RecentTransactionsTable } from '../components/dashboard/RecentTransactionsTable';
import { PendingApprovalsTable } from '../components/dashboard/PendingApprovalsTable';
import { TransactionDetailModal } from '../components/dashboard/TransactionDetailModal';
import { TransactionListSection } from '../components/dashboard/TransactionListSection';
import { adminControlApi, transactionsFeedApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatters';
import type {
  ControlDashboardSummary,
  DashboardTransaction,
  LocationTransactionData,
  MoneyFlowData,
} from '../types';

const extractList = (res: any): any[] => {
  const body = res?.data ?? res;
  // The backend nests payloads as { data: { message, data | transactions, ... } }.
  const candidates = [
    body,
    body?.data,
    body?.data?.data,
    body?.transactions,
    body?.data?.transactions,
    body?.data?.groups,
    body?.groups,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

export const Dashboard = () => {
  const user = useAuthStore((state) => state.user);

  const [branchTx, setBranchTx] = useState<any[]>([]);
  const [zonalTx, setZonalTx] = useState<any[]>([]);
  const [committeeTx, setCommitteeTx] = useState<any[]>([]);
  const [polarisTx, setPolarisTx] = useState<any[]>([]);
  const [feedsLoading, setFeedsLoading] = useState(true);

  const [summary, setSummary] = useState<ControlDashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [moneyFlow, setMoneyFlow] = useState<MoneyFlowData[]>([]);
  const [moneyFlowLoading, setMoneyFlowLoading] = useState(true);

  const [byLocation, setByLocation] = useState<LocationTransactionData[]>([]);
  const [byLocationLoading, setByLocationLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<DashboardTransaction | null>(null);

  const fetchSummary = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setSummaryLoading(true);
      setSummaryError(null);
    }
    try {
      const data = await adminControlApi.getDashboard();
      setSummary(data?.summary ?? null);
    } catch (err: any) {
      setSummaryError(err?.response?.data?.message ?? 'Unable to load dashboard totals');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchCharts = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setMoneyFlowLoading(true);
      setByLocationLoading(true);
    }

    const [flow, locations] = await Promise.allSettled([
      adminControlApi.getMoneyFlow({ granularity: 'day' }),
      adminControlApi.getTransactionsByLocation(),
    ]);

    if (flow.status === 'fulfilled') setMoneyFlow(Array.isArray(flow.value) ? flow.value : []);
    if (locations.status === 'fulfilled')
      setByLocation(Array.isArray(locations.value) ? locations.value : []);

    setMoneyFlowLoading(false);
    setByLocationLoading(false);
  }, []);

  const fetchFeeds = useCallback(async (showLoading = true) => {
    if (showLoading) setFeedsLoading(true);
    try {
      const userId = (user as any)?._id ?? user?.id ?? '';
      const branchId = (user as any)?.branch_id ?? (user as any)?.head_branch_id ?? '';
      const zonalId = (user as any)?.zonal_id ?? '';

      const [branch, zonal, groups, polaris] = await Promise.allSettled([
        // These endpoints require a valid id; skip (don't call) when absent to
        // avoid a server error and keep the feed empty.
        branchId
          ? transactionsFeedApi.getBranchTransactions(branchId)
          : Promise.resolve({ data: [] }),
        zonalId
          ? transactionsFeedApi.getZonalTransactions(zonalId)
          : Promise.resolve({ data: [] }),
        transactionsFeedApi.getCommitteeGroups(),
        userId
          ? transactionsFeedApi.getPolarisTransactions(userId)
          : Promise.resolve({ data: [] }),
      ]);

      if (branch.status === 'fulfilled') setBranchTx(extractList(branch.value));
      if (zonal.status === 'fulfilled') setZonalTx(extractList(zonal.value));
      if (polaris.status === 'fulfilled') setPolarisTx(extractList(polaris.value));

      if (groups.status === 'fulfilled') {
        const groupList = extractList(groups.value);
        const auditResults = await Promise.allSettled(
          groupList.map((g: any) => transactionsFeedApi.getCommitteeTransactions(g._id ?? g.id))
        );
        setCommitteeTx(
          auditResults.flatMap((r) => (r.status === 'fulfilled' ? extractList(r.value) : []))
        );
      }
    } finally {
      setFeedsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Initial state is already "loading"; skip the synchronous loading toggle here.
    // The fetchers only update state after awaiting, so this does not cause a synchronous cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSummary(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCharts(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFeeds(false);
  }, [fetchSummary, fetchCharts, fetchFeeds]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchSummary(), fetchCharts(), fetchFeeds()]);
    } finally {
      setRefreshing(false);
    }
  };

  const statSubtitle = (text: string) =>
    summaryLoading ? 'Loading…' : summaryError ? summaryError : text;

  const entityCount = summary
    ? Object.values(summary.entities).reduce((sum, n) => sum + n, 0)
    : 0;

  const recentTransactions: DashboardTransaction[] = summary?.recentTransactions ?? [];
  const pendingTransactions: DashboardTransaction[] = summary?.pendingTransactions ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Control Center</h1>
          <p className="text-sm text-gray-600 mt-1">
            Central monitoring and control of all cooperative financial transactions
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh data"
          title="Refresh data"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Deposits"
          value={summary?.totalDeposits ?? 0}
          icon={TrendingUp}
          iconColor="bg-green-500"
          subtitle={statSubtitle('Settled deposits, all sections')}
          currency
        />
        <StatCard
          title="Total Withdrawals"
          value={summary?.totalWithdrawals ?? 0}
          icon={TrendingDown}
          iconColor="bg-red-500"
          subtitle={statSubtitle('Settled withdrawals, all sections')}
          currency
        />
        <StatCard
          title="Total Balance"
          value={summary?.totalBalance ?? 0}
          icon={Wallet}
          iconColor="bg-blue-500"
          subtitle={statSubtitle(
            `Branch, zonal, committee, APX & parliament (${entityCount.toLocaleString()})`
          )}
          currency
        />
        <StatCard
          title="Pending Approval"
          value={summary?.pendingApprovals ?? 0}
          icon={Clock}
          iconColor="bg-yellow-500"
          subtitle={statSubtitle(`${formatCurrency(summary?.pendingAmount ?? 0)} awaiting approval`)}
        />
        <StatCard
          title="Total Transactions"
          value={summary?.transactionCount ?? 0}
          icon={Activity}
          iconColor="bg-purple-500"
          subtitle={statSubtitle('All statuses, all sections')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <MoneyFlowChart data={moneyFlow} loading={moneyFlowLoading} />
        <TransactionsByLocation data={byLocation} loading={byLocationLoading} />
      </div>

      {/* Recent Transactions */}
      <RecentTransactionsTable
        transactions={recentTransactions}
        loading={summaryLoading}
        onView={setSelectedTransaction}
      />

      {/* Pending Approvals */}
      <PendingApprovalsTable
        transactions={pendingTransactions}
        loading={summaryLoading}
        onView={setSelectedTransaction}
      />

      {/* Live transaction feeds from the API */}
      <TransactionListSection title="Branch Transactions" items={branchTx} loading={feedsLoading} />
      <TransactionListSection title="Zonal Transactions" items={zonalTx} loading={feedsLoading} />
      <TransactionListSection title="Committee Transactions" items={committeeTx} loading={feedsLoading} />
      <TransactionListSection title="Polaris Transactions" items={polarisTx} loading={feedsLoading} />

      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
};
