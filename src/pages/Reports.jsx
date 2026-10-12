import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatINR, formatDate, getTodayDateString } from '../utils/formatters';
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Percent,
  PieChart,
} from 'lucide-react';

export function Reports() {
  const { transactions } = useFinance();

  const [periodType, setPeriodType] = useState('monthly'); // 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Period navigation
  const navigatePeriod = (direction) => {
    const newDate = new Date(currentDate);
    if (periodType === 'daily') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (periodType === 'weekly') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else if (periodType === 'monthly') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (periodType === 'yearly') {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setCurrentDate(newDate);
  };

  const jumpToPresent = () => {
    setCurrentDate(new Date());
  };

  // Determine date bounds based on periodType and currentDate
  const periodBounds = useMemo(() => {
    const d = new Date(currentDate);

    if (periodType === 'daily') {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      return {
        start: dateStr,
        end: dateStr,
        label: d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
      };
    }

    if (periodType === 'weekly') {
      // Current week: Monday to Sunday
      const dayOfWeek = d.getDay(); // 0 is Sunday
      const diffToMonday = (dayOfWeek + 6) % 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const toStr = (date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const start = toStr(monday);
      const end = toStr(sunday);
      const label = `${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

      return { start, end, label };
    }

    if (periodType === 'monthly') {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const start = `${year}-${month}-01`;
      const lastDay = new Date(year, d.getMonth() + 1, 0).getDate();
      const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

      return { start, end, label };
    }

    // Yearly
    const year = d.getFullYear();
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      label: `Year ${year}`,
    };
  }, [periodType, currentDate]);

  // Aggregate metrics for this period
  const { periodTransactions, received, spent, invested, categoryBreakdown, incomeBreakdown } = useMemo(() => {
    let rec = 0;
    let sp = 0;
    let inv = 0;
    const catMap = {};
    const incMap = {};

    const filtered = transactions.filter((tx) => {
      const txDate = tx.date || '';
      return txDate >= periodBounds.start && txDate <= periodBounds.end;
    });

    filtered.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'Received') {
        rec += amt;
        const cat = tx.category || 'Other';
        incMap[cat] = incMap[cat] || { amount: 0, count: 0 };
        incMap[cat].amount += amt;
        incMap[cat].count += 1;
      } else if (tx.type === 'Spent') {
        sp += amt;
        const cat = tx.category || 'Other';
        catMap[cat] = catMap[cat] || { amount: 0, count: 0 };
        catMap[cat].amount += amt;
        catMap[cat].count += 1;
      } else if (tx.type === 'Invested') {
        inv += amt;
      }
    });

    return {
      periodTransactions: filtered,
      received: rec,
      spent: sp,
      invested: inv,
      categoryBreakdown: catMap,
      incomeBreakdown: incMap,
    };
  }, [transactions, periodBounds]);

  const netSavings = received - spent - invested;
  const savingsRate = received > 0 ? ((netSavings / received) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Period Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Financial Reports</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Periodic summary, savings rate, and category breakdowns
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {[
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'yearly', label: 'Yearly' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriodType(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                periodType === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period Navigator Bar */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <button
          onClick={() => navigatePeriod(-1)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
          title="Previous period"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <h3 className="text-sm sm:text-base font-bold text-white">{periodBounds.label}</h3>
          <button
            onClick={jumpToPresent}
            className="text-[11px] text-emerald-400 hover:underline font-medium"
          >
            Jump to Present
          </button>
        </div>

        <button
          onClick={() => navigatePeriod(1)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors"
          title="Next period"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Received */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
            <ArrowDownLeft size={14} /> Total Received
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{formatINR(received)}</div>
        </div>

        {/* Spent */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold mb-1">
            <ArrowUpRight size={14} /> Total Spent
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{formatINR(spent)}</div>
        </div>

        {/* Invested */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold mb-1">
            <TrendingUp size={14} /> Total Invested
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{formatINR(invested)}</div>
        </div>

        {/* Net Savings */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold mb-1">
            Net Savings
          </div>
          <div
            className={`text-xl sm:text-2xl font-black ${
              netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {netSavings >= 0 ? `+${formatINR(netSavings)}` : `-${formatINR(Math.abs(netSavings))}`}
          </div>
        </div>

        {/* Savings Rate */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 col-span-2 lg:col-span-1">
          <div className="text-xs text-slate-400 font-semibold mb-1">
            Savings Rate
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{savingsRate}%</div>
        </div>
      </div>

      {/* Category Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Expenses Category Breakdown */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart size={16} className="text-rose-400" />
              Expense Breakdown ({formatINR(spent)})
            </h4>
            <span className="text-xs text-slate-400">
              {Object.keys(categoryBreakdown).length} categories
            </span>
          </div>

          {Object.keys(categoryBreakdown).length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No expenses in this period.</p>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(categoryBreakdown)
                .sort((a, b) => b[1].amount - a[1].amount)
                .map(([category, data]) => {
                  const percent = spent > 0 ? ((data.amount / spent) * 100).toFixed(1) : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white flex items-center gap-2">
                          {category}
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({data.count} tx)
                          </span>
                        </span>
                        <span className="font-bold text-white">
                          {formatINR(data.amount)}
                          <span className="text-slate-400 font-normal ml-1">({percent}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Income Category Breakdown */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart size={16} className="text-emerald-400" />
              Income Breakdown ({formatINR(received)})
            </h4>
            <span className="text-xs text-slate-400">
              {Object.keys(incomeBreakdown).length} sources
            </span>
          </div>

          {Object.keys(incomeBreakdown).length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No income recorded in this period.</p>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(incomeBreakdown)
                .sort((a, b) => b[1].amount - a[1].amount)
                .map(([category, data]) => {
                  const percent = received > 0 ? ((data.amount / received) * 100).toFixed(1) : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white flex items-center gap-2">
                          {category}
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({data.count} tx)
                          </span>
                        </span>
                        <span className="font-bold text-white">
                          {formatINR(data.amount)}
                          <span className="text-slate-400 font-normal ml-1">({percent}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
