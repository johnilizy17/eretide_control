import { ScrollText } from 'lucide-react';

export const AuditLogs = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-600 mt-1">
          Immutable audit trail of all financial control actions
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <ScrollText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Audit trail</h3>
        <p className="text-sm text-gray-600">
          Complete activity logs - coming soon
        </p>
      </div>
    </div>
  );
};
