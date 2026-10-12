import React from 'react';
import { formatINR, formatDate } from '../utils/formatters';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  ArrowLeftRight,
  CreditCard,
  Building2,
  Smartphone,
  AlertCircle,
  PlusCircle,
  UserCheck,
  CheckCircle,
  Sparkles,
  Briefcase,
} from 'lucide-react';

export function BalanceCard({
  overallBalance = 0,
  totalBalanceWithPending = overallBalance,
  accounts = [],
  accountBalances = {},
  summaryMetrics,
  budget = 0,
  totalPendingReceivable = 0,
  pendingDues = [],
  onSettleDue,
  onAddTransactionWithAccount,
  onOpenSettings,
}) {
  const { today, monthly } = summaryMetrics;

  // Icon helper based on account name/purpose
  const getAccountIcon = (account) => {
    const name = (account.name || '').toLowerCase();
    const purpose = (account.purpose || '').toLowerCase();

    if (name.includes('slice') || purpose.includes('upi')) {
      return <Smartphone className="text-violet-400" size={20} />;
    }
    if (name.includes('sbi') || purpose.includes('income') || purpose.includes('received')) {
      return <Building2 className="text-blue-400" size={20} />;
    }
    if (name.includes('kotak') || purpose.includes('debit') || purpose.includes('card')) {
      return <CreditCard className="text-rose-400" size={20} />;
    }
    return <Wallet className="text-emerald-400" size={20} />;
  };

  // Budget calculations
  const monthlySpent = monthly.spent || 0;
  const budgetRemaining = budget > 0 ? budget - monthlySpent : 0;
  const budgetPercentage = budget > 0 ? Math.min(Math.round((monthlySpent / budget) * 100), 100) : 0;
  const isBudgetExceeded = budget > 0 && monthlySpent > budget;

  return (
    <div className="space-y-6">
      {/* 1. TOP 3-METRIC HERO SECTION: Total Balance, Current Cash, Need To Receive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total Net Balance */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/30 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-widest font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Total Net Balance
            </span>
            <span className="text-[10px] font-semibold text-emerald-300/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Cash + Receivables
            </span>
          </div>

          <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight my-2">
            {formatINR(totalBalanceWithPending)}
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Current cash ({formatINR(overallBalance)}) + To receive ({formatINR(totalPendingReceivable)})
          </p>
        </div>

        {/* Metric 2: Current Cash (How much I have right now) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-750 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-widest font-bold text-sky-400 flex items-center gap-1.5">
              <Wallet size={13} />
              Current Cash Available
            </span>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              In Accounts
            </span>
          </div>

          <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-sky-400 tracking-tight my-2">
            {formatINR(overallBalance)}
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Actual balance ready to use in Slice, SBI & Kotak
          </p>
        </div>

        {/* Metric 3: Need to Receive (How much people owe me) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-amber-500/30 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400 flex items-center gap-1.5">
              <UserCheck size={13} />
              Need To Receive
            </span>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
              {pendingDues.length} Pending
            </span>
          </div>

          <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-400 tracking-tight my-2">
            {formatINR(totalPendingReceivable)}
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Pending dues from friends/colleagues awaiting repayment
          </p>
        </div>
      </div>

      {/* Fresh Clean Slate Onboarding Prompt */}
      {overallBalance === 0 && totalPendingReceivable === 0 && (!pendingDues || pendingDues.length === 0) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">Fresh Clean Slate Active</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                All test transactions have been wiped and bank accounts are at ₹0.00. Ready to enter your real finances?
                Set your current bank balances via <strong>Manage Accounts</strong> or record your first transaction.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <button
              onClick={onOpenSettings}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer"
            >
              Set Bank Balances
            </button>
          </div>
        </div>
      )}

          {/* Who Should Settle You (Pending Repayments & Client Dues List) */}
          {pendingDues && pendingDues.length > 0 && (
            <div className="mt-5 p-4 sm:p-5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-amber-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-300">
                      Pending Receivables & Client Dues ({pendingDues.length} Pending)
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Included in your Total Balance above. Click "Settle" or "Collect" when money is received.
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30">
                  +{formatINR(totalPendingReceivable)}
                </span>
              </div>

              <div className="divide-y divide-amber-500/15 max-h-64 overflow-y-auto pr-1">
                {pendingDues.map((due) => {
                  const account = accounts.find((a) => a.id === due.accountId);
                  const accName = account ? account.name : due.accountId || 'Account';
                  const isWork = due.type === 'WorkPending';

                  return (
                    <div
                      key={due.id}
                      className="py-2.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${
                            isWork
                              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                              : 'bg-slate-800 border-slate-700 text-amber-300'
                          }`}
                        >
                          {isWork ? <Briefcase size={14} /> : (due.person || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {due.person || due.note || (isWork ? 'Client' : 'Contact')}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                                isWork
                                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {isWork ? `Work / Client • Into ${accName}` : `Paid from ${accName}`}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{formatDate(due.date)}</span>
                            {due.category && isWork && (
                              <>
                                <span>•</span>
                                <span className="text-cyan-400/90 font-medium">{due.category}</span>
                              </>
                            )}
                            {due.dueDate && (
                              <>
                                <span>•</span>
                                <span className="text-amber-400/90 font-medium">Due: {formatDate(due.dueDate)}</span>
                              </>
                            )}
                            {due.note && due.note !== due.person && (
                              <>
                                <span>•</span>
                                <span className="italic truncate max-w-[200px] text-slate-400">
                                  {due.note}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                        <span className={`text-sm font-bold ${isWork ? 'text-cyan-400' : 'text-amber-400'}`}>
                          {formatINR(due.amount)}
                        </span>
                        {onSettleDue && (
                          <button
                            type="button"
                            onClick={() => onSettleDue(due.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title={isWork ? "Collect payment into bank account" : "Mark as Repaid (Received back into account)"}
                          >
                            <CheckCircle size={13} /> {isWork ? 'Collect' : 'Settle'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

      {/* Monthly Expense Budget Banner (if configured) */}
      {budget > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-2">
            <span className="text-slate-300 flex items-center gap-1.5">
              Monthly Expense Budget
              {isBudgetExceeded && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertCircle size={12} /> Exceeded
                </span>
              )}
            </span>
            <span className="text-slate-300">
              <span className="font-semibold text-white">{formatINR(monthlySpent)}</span> of{' '}
              <span className="text-slate-400">{formatINR(budget)}</span>
              {' '}(
              <span className={isBudgetExceeded ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {isBudgetExceeded ? `Over by ${formatINR(Math.abs(budgetRemaining))}` : `${formatINR(budgetRemaining)} remaining`}
              </span>
              )
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isBudgetExceeded
                  ? 'bg-rose-500'
                  : budgetPercentage > 80
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* 2. Individual Account Cards (Slice, SBI, Kotak, etc.) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Accounts & Starting Balances
          </h3>
          <button
            onClick={onOpenSettings}
            className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
          >
            Manage Accounts
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const currentBal = accountBalances[account.id] ?? account.startingBalance ?? 0;
            return (
              <div
                key={account.id}
                className="group relative rounded-xl bg-slate-900 border border-slate-800 p-5 hover:border-slate-700 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:scale-105 transition-transform">
                      {getAccountIcon(account)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight">
                        {account.name}
                      </h4>
                      <span className="inline-block text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded mt-0.5">
                        {account.purpose || 'Active Account'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onAddTransactionWithAccount(account.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                    title={`Add transaction for ${account.name}`}
                  >
                    <PlusCircle size={18} />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Available</span>
                    <div className="text-2xl font-bold text-white tracking-tight">
                      {formatINR(currentBal)}
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className="text-[10px] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer text-right group/start block"
                      title={`Click to edit ${account.name} starting balance in Settings`}
                    >
                      <span>Starting: </span>
                      <span className="font-semibold text-slate-300 group-hover/start:underline decoration-emerald-500">
                        {formatINR(account.startingBalance || 0)}
                      </span>
                      <span className="ml-1 text-[9px] text-emerald-400/80">✎</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Today's & Monthly Quick Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Stats */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Today's Overview
            </h4>
            <span className="text-xs text-slate-400 font-medium">Daily Totals</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-1 text-[11px] font-medium text-rose-400 mb-1">
                <ArrowUpRight size={13} /> Spent
              </div>
              <div className="text-lg font-bold text-white">
                {formatINR(today.spent)}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 mb-1">
                <ArrowDownLeft size={13} /> Received
              </div>
              <div className="text-lg font-bold text-white">
                {formatINR(today.received)}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-1 text-[11px] font-medium text-purple-400 mb-1">
                <TrendingUp size={13} /> Invested
              </div>
              <div className="text-lg font-bold text-white">
                {formatINR(today.invested)}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-1 text-[11px] font-medium text-sky-400 mb-1">
                <ArrowLeftRight size={13} /> Transfers
              </div>
              <div className="text-lg font-bold text-white">
                {formatINR(today.transfers)}
              </div>
            </div>
          </div>
        </div>

        {/* This Month's Stats */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              This Month's Overview
            </h4>
            <span className="text-xs text-slate-400 font-medium">Monthly Totals</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-1 text-[11px] font-medium text-rose-400 mb-1">
                <ArrowUpRight size={13} /> Spent
              </div>
              <div className="text-lg font-bold text-white">
                {formatINR(monthly.spent)}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 mb-1">
                <ArrowDownLeft size={13} /> Received
              </div>
              <div className="text-lg font-bold text-white">
                {formatINR(monthly.received)}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-1 text-[11px] font-medium text-purple-400 mb-1">
                <TrendingUp size={13} /> Invested
              </div>
              <div className="text-lg font-bold text-white">
                {formatINR(monthly.invested)}
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-1 text-[11px] font-medium text-sky-400 mb-1">
                <ArrowLeftRight size={13} /> Transfers
              </div>
              <div className="text-lg font-bold text-white">
                {formatINR(monthly.transfers)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
