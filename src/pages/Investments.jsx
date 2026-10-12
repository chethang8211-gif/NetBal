import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR, formatDate, formatTime, getTodayDateString } from '../utils/formatters';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  PieChart,
  Percent,
  Check,
  ShieldCheck,
} from 'lucide-react';

export function Investments({
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) {
  const {
    transactions,
    accounts,
    totalInvested,
    summaryMetrics,
    investmentsValuation,
    updateInvestmentsValuation,
  } = useFinance();

  const [isEditingValuation, setIsEditingValuation] = useState(false);
  const [valuationInput, setValuationInput] = useState(String(investmentsValuation || ''));

  const accountMap = useMemo(() => {
    const map = {};
    accounts.forEach((a) => {
      map[a.id] = a.name;
    });
    return map;
  }, [accounts]);

  // Filter only 'Invested' transactions
  const investmentTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.type === 'Invested');
  }, [transactions]);

  // Breakdown by investment category
  const categoryBreakdown = useMemo(() => {
    const breakdown = {};
    investmentTransactions.forEach((tx) => {
      const cat = tx.category || 'Other';
      breakdown[cat] = (breakdown[cat] || 0) + (Number(tx.amount) || 0);
    });
    return breakdown;
  }, [investmentTransactions]);

  const thisMonthInvested = summaryMetrics.monthly.invested || 0;

  // Manual Valuation Calculations
  const hasManualValuation = investmentsValuation > 0;
  const profitLoss = hasManualValuation ? investmentsValuation - totalInvested : 0;
  const profitLossPercentage =
    hasManualValuation && totalInvested > 0
      ? ((profitLoss / totalInvested) * 100).toFixed(2)
      : '0.00';

  const handleSaveValuation = (e) => {
    e.preventDefault();
    const val = parseFloat(valuationInput);
    if (!isNaN(val) && val >= 0) {
      updateInvestmentsValuation(val);
      setIsEditingValuation(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Investment Tracking</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor investment contributions, asset breakdown, and manual portfolio valuations
          </p>
        </div>

        <button
          onClick={() => onOpenAddModal(null, 'Invested')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-purple-500 text-white hover:bg-purple-400 shadow-md shadow-purple-500/20 transition-all self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Investment</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Invested */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Invested (All-Time)
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{formatINR(totalInvested)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Total principal contributions recorded</p>
        </div>

        {/* This Month's Contributions */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              This Month's Contributions
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">{formatINR(thisMonthInvested)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Added to portfolio in current calendar month</p>
        </div>

        {/* Current Portfolio Valuation & Profit/Loss */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current Portfolio Valuation
            </span>
            <button
              onClick={() => {
                setValuationInput(String(investmentsValuation || ''));
                setIsEditingValuation(!isEditingValuation);
              }}
              className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Edit2 size={12} /> {isEditingValuation ? 'Cancel' : 'Update'}
            </button>
          </div>

          {isEditingValuation ? (
            <form onSubmit={handleSaveValuation} className="flex gap-2 my-1">
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Current portfolio value..."
                value={valuationInput}
                onChange={(e) => setValuationInput(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-bold hover:bg-purple-400"
              >
                Save
              </button>
            </form>
          ) : (
            <div>
              <div className="text-3xl font-black text-white">
                {hasManualValuation ? formatINR(investmentsValuation) : '₹0'}
              </div>
              {hasManualValuation && totalInvested > 0 ? (
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {profitLoss >= 0 ? `+${formatINR(profitLoss)}` : `-${formatINR(Math.abs(profitLoss))}`} (
                    {profitLoss >= 0 ? `+${profitLossPercentage}%` : `${profitLossPercentage}%`})
                  </span>
                  <span className="text-[10px] text-slate-500">P&L</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">
                  Manual valuation not provided yet (Click Update)
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Asset Breakdown by Category */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <PieChart size={16} className="text-purple-400" />
          Investment Distribution
        </h3>

        {Object.keys(categoryBreakdown).length === 0 ? (
          <p className="text-xs text-slate-500 italic">No investment records available.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(categoryBreakdown).map(([categoryName, amount]) => {
              const percent = totalInvested > 0 ? ((amount / totalInvested) * 100).toFixed(1) : 0;
              return (
                <div key={categoryName} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block truncate">
                    {categoryName}
                  </span>
                  <div className="text-base font-bold text-white mt-1">
                    {formatINR(amount)}
                  </div>
                  <div className="text-[10px] text-purple-400 mt-0.5">{percent}% of portfolio</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Investment Transactions History */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Investment History ({investmentTransactions.length})
          </h3>
        </div>

        {investmentTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No investment contributions recorded yet. Click "Add Investment" to log your first SIP, Mutual Fund, or Gold purchase.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Note</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {investmentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium whitespace-nowrap">
                      {accountMap[tx.accountId] || 'Account'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold text-[11px]">
                        {tx.category || 'Investment'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {tx.note || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-purple-400 text-sm whitespace-nowrap">
                      {formatINR(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
