import React, { useState } from 'react';
import { TransactionList } from '../components/TransactionList';
import { useFinance } from '../context/FinanceContext';
import { exportToCSV } from '../services/exportImport';
import { Plus, Download, Trash2 } from 'lucide-react';

export function Transactions({
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) {
  const { transactions, accounts, categories, settleDue, clearAllTransactions } = useFinance();
  const [isClearing, setIsClearing] = useState(false);

  const handleExportCSV = () => {
    exportToCSV(transactions, accounts);
  };

  const handleClearHistory = async () => {
    if (
      window.confirm(
        '⚠️ Are you sure you want to clear your entire transaction history?\n\nThis will permanently remove all transaction records from your device and cloud, setting balances back to your starting baseline. This action cannot be undone.'
      )
    ) {
      setIsClearing(true);
      try {
        await clearAllTransactions();
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Transaction History</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            View, search, filter, and manage all your expense and income records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {transactions.length > 0 && (
            <button
              onClick={handleClearHistory}
              disabled={isClearing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors disabled:opacity-50"
              title="Delete all transactions and start fresh"
            >
              <Trash2 size={14} />
              <span>{isClearing ? 'Clearing...' : 'Clear All History'}</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => onOpenAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-all"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Full Transaction Table with Advanced Filters & Search */}
      <TransactionList
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        onEdit={onEditTransaction}
        onDelete={onDeleteTransaction}
        onSettleDue={settleDue}
        onExportCSV={handleExportCSV}
        showFilters={true}
      />
    </div>
  );
}
