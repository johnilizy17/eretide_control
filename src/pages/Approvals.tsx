import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export const Approvals = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Center</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage transaction approvals with two-signatory verification
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button className="px-6 py-4 text-sm font-medium text-emerald-600 border-b-2 border-emerald-600">
            Awaiting My Approval (3)
          </button>
          <button className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-900">
            All Pending (12)
          </button>
          <button className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-900">
            Approved (45)
          </button>
          <button className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-gray-900">
            Rejected (5)
          </button>
        </div>

        <div className="p-12 text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending approvals</h3>
          <p className="text-sm text-gray-600">
            All transactions requiring your approval will appear here
          </p>
        </div>
      </div>

      {/* Approval Actions Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Approve Transaction</h3>
          </div>
          <p className="text-sm text-gray-600">
            Review transaction details carefully before approving. Two independent approvals are required.
          </p>
        </div>

        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Reject Transaction</h3>
          </div>
          <p className="text-sm text-gray-600">
            Provide a reason when rejecting. The initiator will be notified immediately.
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Dual Authorization</h3>
          </div>
          <p className="text-sm text-gray-600">
            Cannot approve your own transaction or provide both approvals for any transaction.
          </p>
        </div>
      </div>
    </div>
  );
};
