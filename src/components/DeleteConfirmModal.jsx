import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, transaction }) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-left">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-white leading-tight">Delete Transaction?</h3>
            <p className="text-xs text-slate-400 mt-1">
              This action cannot be undone. Account balances and reports will be recalculated immediately.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <span className="font-semibold text-white">{transaction.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-rose-400">{formatINR(transaction.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="text-white">{formatDate(transaction.date)}</span>
              </div>
              {transaction.note && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Note:</span>
                  <span className="text-slate-300 italic truncate max-w-[180px]">{transaction.note}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(transaction);
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md shadow-rose-500/20 transition-colors"
          >
            Yes, Delete Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
