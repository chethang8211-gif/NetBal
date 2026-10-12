import React from 'react';
import { BalanceCard } from '../components/BalanceCard';
import { FinanceCharts } from '../components/FinanceCharts';
import { TransactionList } from '../components/TransactionList';
import { useFinance } from '../context/FinanceContext';
import { ArrowRight, Plus, Zap } from 'lucide-react';

export function Dashboard({
  onOpenAddModal,
  onOpenQuickEntry,
  onNavigateToTransactions,
  onNavigateToSettings,
  onEditTransaction,
  onDeleteTransaction,
}) {
  const {
    accounts,
    transactions,
    categories,
    budget,
    accountBalances,
    overallBalance,
    totalPendingReceivable,
    totalBalanceWithPending,
    pendingDues,
    summaryMetrics,
    monthlyTrends,
    settleDue,
  } = useFinance();

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Main Balance and Accounts Section */}
      <BalanceCard
        overallBalance={overallBalance}
        totalBalanceWithPending={totalBalanceWithPending}
        totalPendingReceivable={totalPendingReceivable}
        pendingDues={pendingDues}
        onSettleDue={settleDue}
        accounts={accounts}
        accountBalances={accountBalances}
        summaryMetrics={summaryMetrics}
        budget={budget}
        onAddTransactionWithAccount={(accId) => onOpenAddModal(accId)}
        onOpenSettings={onNavigateToSettings}
      />

      {/* 2. Visual Analytics Charts */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 px-1">
          Financial Analytics
        </h3>
        <FinanceCharts
          transactions={transactions}
          accounts={accounts}
          accountBalances={accountBalances}
          monthlyTrends={monthlyTrends}
        />
      </div>

      {/* 3. Recent Transactions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Recent Activity
          </h3>
          {transactions.length > 0 && (
            <button
              onClick={onNavigateToTransactions}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
            >
              View all ({transactions.length})
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        <TransactionList
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          onEdit={onEditTransaction}
          onDelete={onDeleteTransaction}
          onSettleDue={settleDue}
          showFilters={false}
          limit={5}
        />
      </div>
    </div>
  );
}
