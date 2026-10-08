import { useEffect, useState } from 'react';
import { X, Snowflake, LockOpen } from 'lucide-react';
import type { Account } from '../../types';

interface AccountFreezeModalProps {
  account: Account | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (account: Account, reason: string) => void;
}

export const AccountFreezeModal = ({ account, loading, onClose, onConfirm }: AccountFreezeModalProps) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (account) setReason('');
  }, [account]);

  useEffect(() => {
    if (!account) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [account, onClose]);

  if (!account) return null;

  const isFrozen = account.status === 'FROZEN';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">
            {isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            {isFrozen ? 'Unfreeze' : 'Freeze'} account{' '}
            <span className="font-medium text-gray-900">{account.accountNumber}</span> (
            {account.ownerName})?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Provide a reason for this action..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(account, reason.trim())}
              disabled={loading || !reason.trim()}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                isFrozen ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isFrozen ? <LockOpen className="w-4 h-4" /> : <Snowflake className="w-4 h-4" />}
              {loading ? 'Processing...' : isFrozen ? 'Unfreeze' : 'Freeze'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
