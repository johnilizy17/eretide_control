import { useEffect, useState } from 'react';
import {
  ScrollText,
  Search,
  RefreshCw,
  Filter,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  User,
  Database,
  Tag,
  X,
} from 'lucide-react';
import { auditLogsApi, type AuditLogEntry } from '../api';

const EMPTY_FILTERS = { actions: [] as string[], objectTypes: [] as string[] };
const DEFAULT_PAGINATION = { page: 1, limit: 10, total: 0, pages: 1 };

const actionStyle = (action: string): string => {
  const a = action.toUpperCase();
  if (a.includes('TRANSFER') || a.includes('PAYMENT')) return 'bg-emerald-50 text-emerald-700';
  if (a.includes('DELETE') || a.includes('REJECT') || a.includes('FAIL')) return 'bg-rose-50 text-rose-700';
  if (a.includes('CREATE') || a.includes('SEND') || a.includes('NOTIFICATION')) return 'bg-sky-50 text-sky-700';
  if (a.includes('UPDATE') || a.includes('APPROVE')) return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-700';
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });

export const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [objectType, setObjectType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const data = await auditLogsApi.getAll({
        page,
        limit: 10,
        action: action === 'all' ? undefined : action,
        objectType: objectType === 'all' ? undefined : objectType,
        search: search.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setLogs(data.logs ?? []);
      setFilters(data.filters ?? EMPTY_FILTERS);
      setPagination(data.pagination ?? DEFAULT_PAGINATION);
    } catch {
      setLogs([]);
      setError('Unable to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = () => {
    setSearch('');
    setAction('all');
    setObjectType('all');
    setDateFrom('');
    setDateTo('');
    loadLogs(1);
  };

  const applyFilters = () => loadLogs(1);

  const exportCsv = () => {
    const header = ['Timestamp', 'Actor ID', 'Action', 'Object Type', 'Object ID', 'Description', 'IP Address'];
    const rows = logs.map((row) => [
      formatDateTime(row.createdAt),
      row.actor_name || row.actor_id,
      row.action,
      row.object_type,
      row.object_id,
      row.description ?? '',
      row.ip_address ?? '',
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-page-${pagination.page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    search.trim() !== '' || action !== 'all' || objectType !== 'all' || dateFrom !== '' || dateTo !== '';

  const selectClass =
    'px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-600 mt-1">
            Immutable audit trail of all financial control actions
          </p>
        </div>
        <button
          onClick={() => loadLogs(1)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          <ScrollText className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Log Entries</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <ScrollText className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Actions Tracked</p>
              <p className="text-2xl font-bold text-gray-900">{filters.actions.length}</p>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl">
              <Tag className="w-6 h-6 text-sky-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Objects Covered</p>
              <p className="text-2xl font-bold text-gray-900">{filters.objectTypes.length}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Database className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter className="w-4 h-4 text-gray-400" />
          Filter audit logs
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search actor, action, object..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
          <select value={action} onChange={(e) => setAction(e.target.value)} className={selectClass}>
            <option value="all">All actions</option>
            {filters.actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select value={objectType} onChange={(e) => setObjectType(e.target.value)} className={selectClass}>
            <option value="all">All object types</option>
            {filters.objectTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Audit Trail</h2>
            <p className="text-sm text-gray-600 mt-1">
              Chronological record of critical actions taken by administrators
            </p>
          </div>
          <button
            onClick={exportCsv}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <th className="px-6 py-3 text-left font-semibold">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold">Actor</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
                <th className="px-4 py-3 text-left font-semibold">Object</th>
                <th className="px-4 py-3 text-left font-semibold">Description</th>
                <th className="px-6 py-3 text-left font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Loading audit logs…
                  </td>
                </tr>
              )}

              {!loading &&
                logs.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDateTime(row.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-slate-500" />
                        </span>
                        <span>
                          <p className="font-medium text-gray-900">{row.actor_name || 'Admin'}</p>
                          <p className="text-xs text-gray-400 font-mono">{row.actor_id}</p>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${actionStyle(row.action)}`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-700">{row.object_type || '—'}</p>
                      <p className="text-xs text-gray-400 font-mono">{row.object_id || ''}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-600 max-w-md">
                      <p className="truncate">{row.description || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono whitespace-nowrap">
                      {row.ip_address || '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && logs.length === 0 && (
          <div className="p-16 text-center border-t border-gray-100">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <ScrollText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No audit logs found</h3>
            <p className="text-sm text-gray-600">
              {hasActiveFilters ? 'Try adjusting the filters above' : 'Audit trail entries will appear here'}
            </p>
          </div>
        )}

        {logs.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-4 flex-wrap text-sm text-gray-600">
            <span>
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {(pagination.page - 1) * pagination.limit + logs.length} of {pagination.total}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadLogs(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <span className="text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => loadLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages || loading}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};