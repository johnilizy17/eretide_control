import { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';

export const Transfers = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfer Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Initiate and track outgoing transfers with two-signatory approval
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Send className="w-4 h-4" />
          Initiate Transfer
        </button>
      </div>

      {/* Transfer Initiation Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">New Transfer Request</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Account *
                </label>
                <input
                  type="text"
                  placeholder="Search and select account"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Account / Beneficiary *
                </label>
                <input
                  type="text"
                  placeholder="Search and select account"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency *</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500">
                  <option>NGN - Nigerian Naira</option>
                  <option>USD - US Dollar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
              <input
                type="text"
                placeholder="e.g., Branch operational expenses"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., TRANS-2026-401"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
              <textarea
                rows={3}
                placeholder="Additional notes..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
              />
            </div>

            {/* Warning Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900 mb-1">
                  Two-Signatory Approval Required
                </p>
                <p className="text-xs text-yellow-700">
                  This transfer will require approval from two independent authorized signatories before
                  execution. You cannot approve your own transaction.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                Submit for Approval
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transfers */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Recent Transfer Requests</h2>
        </div>
        <div className="p-12 text-center">
          <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No transfers yet</h3>
          <p className="text-sm text-gray-600">
            Initiated transfers will appear here for tracking
          </p>
        </div>
      </div>
    </div>
  );
};
