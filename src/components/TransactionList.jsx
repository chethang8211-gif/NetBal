import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  ArrowLeftRight,
  Edit2,
  Trash2,
  Calendar,
  X,
  Clock,
  Download,
  UserCheck,
  CheckCircle,
  Briefcase,
} from 'lucide-react';
import { formatINR, formatDate, formatTime, getTodayDateString } from '../utils/formatters';

export function TransactionList({
  transactions = [],
  accounts = [],
  categories = {},
  onEdit,
  onDelete,
  onSettleDue,
  onExportCSV,
  showFilters = true,

  limit = null,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, YESTERDAY, THIS_WEEK, THIS_MONTH, LAST_MONTH, CUSTOM
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const accountMap = useMemo(() => {
    const map = {};
    accounts.forEach((acc) => {
      map[acc.id] = acc.name;
    });
    return map;
  }, [accounts]);

  // All categories combined for filter
  const allCategories = useMemo(() => {
    const set = new Set();
    (categories.expense || []).forEach((c) => set.add(c));
    (categories.income || []).forEach((c) => set.add(c));
    (categories.investment || []).forEach((c) => set.add(c));
    return Array.from(set);
  }, [categories]);

  // Filtering transactions
  const filteredTransactions = useMemo(() => {
    const todayStr = getTodayDateString();
    const today = new Date();

    // Date range helpers
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    // This week (last 7 days or Monday to today)
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;

    // This month
    const thisMonthPrefix = todayStr.substring(0, 7);

    // Last month
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    return transactions.filter((tx) => {
      // 1. Account filter
      if (accountFilter !== 'ALL') {
        const matchesAccount =
          tx.accountId === accountFilter ||
          tx.fromAccountId === accountFilter ||
          tx.toAccountId === accountFilter;
        if (!matchesAccount) return false;
      }

      // 2. Type filter
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) {
        return false;
      }

      // 3. Category filter
      if (categoryFilter !== 'ALL' && tx.category !== categoryFilter) {
        return false;
      }

      // 4. Date filter
      if (dateFilter === 'TODAY' && tx.date !== todayStr) return false;
      if (dateFilter === 'YESTERDAY' && tx.date !== yesterdayStr) return false;
      if (dateFilter === 'THIS_WEEK' && tx.date < weekAgoStr) return false;
      if (dateFilter === 'THIS_MONTH' && !tx.date?.startsWith(thisMonthPrefix)) return false;
      if (dateFilter === 'LAST_MONTH' && !tx.date?.startsWith(lastMonthPrefix)) return false;
      if (dateFilter === 'CUSTOM') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      // 5. Search term (notes, categories, account names, transaction types)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const noteMatch = (tx.note || '').toLowerCase().includes(query);
        const catMatch = (tx.category || '').toLowerCase().includes(query);
        const typeMatch = (tx.type || '').toLowerCase().includes(query);
        const accName = accountMap[tx.accountId] || '';
        const fromName = accountMap[tx.fromAccountId] || '';
        const toName = accountMap[tx.toAccountId] || '';
        const accMatch =
          accName.toLowerCase().includes(query) ||
          fromName.toLowerCase().includes(query) ||
          toName.toLowerCase().includes(query);

        if (!noteMatch && !catMatch && !typeMatch && !accMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    accountFilter,
    typeFilter,
    categoryFilter,
    dateFilter,
    customStartDate,
    customEndDate,
    searchTerm,
    accountMap,
  ]);

  const displayedTransactions = limit ? filteredTransactions.slice(0, limit) : filteredTransactions;

  // Reset filters
  const hasActiveFilters =
    searchTerm ||
    accountFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    dateFilter !== 'ALL';

  const resetFilters = () => {
    setSearchTerm('');
    setAccountFilter('ALL');
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
    setDateFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const getTypeBadge = (type, tx = {}) => {
    switch (type) {
      case 'Spent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ArrowUpRight size={12} /> Spent
          </span>
        );
      case 'Received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowDownLeft size={12} /> Received
          </span>
        );
      case 'Invested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <TrendingUp size={12} /> Invested
          </span>
        );
      case 'Transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <ArrowLeftRight size={12} /> Transfer
          </span>
        );
      case 'Lent':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              tx.status === 'Settled'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            <UserCheck size={12} /> {tx.status === 'Settled' ? 'Repaid' : 'Pending Due'}
          </span>
        );
      case 'WorkPending':
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              tx.status === 'Settled'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            }`}
          >
            <Briefcase size={12} /> {tx.status === 'Settled' ? 'Client Paid' : 'Work Pending'}
          </span>
        );
      default:
        return null;
    }
  };

  const getAmountColor = (type) => {
    switch (type) {
      case 'Received':
        return 'text-emerald-400 font-bold';
      case 'Spent':
        return 'text-rose-400 font-bold';
      case 'Invested':
        return 'text-purple-400 font-bold';
      case 'Transfer':
        return 'text-sky-400 font-bold';
      case 'Lent':
        return 'text-amber-400 font-bold';
      case 'WorkPending':
        return 'text-cyan-400 font-bold';
      default:
        return 'text-white font-bold';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search note, category, account..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Export Button */}
            {onExportCSV && (
              <button
                onClick={onExportCSV}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                title="Export filtered transactions to CSV"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            )}
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
            {/* Account Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Account
              </label>
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Types</option>
                <option value="Spent">Spent</option>
                <option value="Received">Received</option>
                <option value="Invested">Invested</option>
                <option value="Transfer">Transfer</option>
                <option value="Lent">People Owe Me (Lent)</option>
                <option value="WorkPending">Work / Client Due</option>
              </select>
            </div>


            {/* Category Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Dates</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="THIS_WEEK">This Week</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_MONTH">Last Month</option>
                <option value="CUSTOM">Custom Range</option>
              </select>
            </div>
          </div>

          {/* Custom Date Pickers if CUSTOM selected */}
          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white"
              />
              <span className="text-xs text-slate-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          )}

          {/* Active Filter Clear Bar */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
              <span>
                Found <strong className="text-white">{filteredTransactions.length}</strong> matching transaction{filteredTransactions.length === 1 ? '' : 's'}
              </span>
              <button
                onClick={resetFilters}
                className="text-emerald-400 hover:underline font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transactions List */}
      {displayedTransactions.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
          <Calendar size={36} className="mx-auto mb-3 text-slate-600" />
          <h4 className="text-base font-semibold text-slate-300">No transactions found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try changing or clearing your search filters above.'
              : 'Add your first transaction using "+ Add Transaction" or Quick Entry.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Note</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedTransactions.map((tx) => {
                  const accountText =
                    tx.type === 'Transfer'
                      ? `${accountMap[tx.fromAccountId] || 'From'} → ${accountMap[tx.toAccountId] || 'To'}`
                      : accountMap[tx.accountId] || 'Account';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{formatDate(tx.date)}</div>
                        {tx.time && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock size={11} /> {formatTime(tx.time)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">{getTypeBadge(tx.type, tx)}</td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-medium">
                        {tx.type === 'Lent' && tx.person ? (
                          <div>
                            <span className="font-bold text-amber-300">{tx.person}</span>
                            <span className="text-[10px] text-slate-400 block">via {accountText}</span>
                          </div>
                        ) : tx.type === 'WorkPending' && tx.person ? (
                          <div>
                            <span className="font-bold text-cyan-300">{tx.person}</span>
                            <span className="text-[10px] text-slate-400 block">into {accountText}</span>
                          </div>
                        ) : (
                          accountText
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[11px]">
                          {tx.category || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-400" title={tx.note}>
                        {tx.note || <span className="text-slate-600 italic">—</span>}
                      </td>

                      <td className={`py-3.5 px-4 text-right whitespace-nowrap text-sm ${getAmountColor(tx.type)}`}>
                        {tx.type === 'Received' || tx.type === 'WorkPending' ? '+' : '-'}
                        {formatINR(tx.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {(tx.type === 'Lent' || tx.type === 'WorkPending') && tx.status !== 'Settled' && onSettleDue && (
                            <button
                              onClick={() => onSettleDue(tx.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 transition-colors"
                              title={tx.type === 'WorkPending' ? "Mark as Client Paid (Deposit into bank)" : "Mark as Repaid (Received Back)"}
                            >
                              <CheckCircle size={13} /> {tx.type === 'WorkPending' ? 'Collect' : 'Settle'}
                            </button>
                          )}
                          <button
                            onClick={() => onEdit(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                            title="Edit Transaction"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => onDelete(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete Transaction"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-800">
            {displayedTransactions.map((tx) => {
              const accountText =
                tx.type === 'Transfer'
                  ? `${accountMap[tx.fromAccountId] || 'From'} → ${accountMap[tx.toAccountId] || 'To'}`
                  : accountMap[tx.accountId] || 'Account';

              return (
                <div key={tx.id} className="p-4 space-y-2 hover:bg-slate-850/40">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeBadge(tx.type, tx)}
                        <span className="text-xs font-semibold text-slate-300">
                          {tx.type === 'Lent' && tx.person
                            ? `To: ${tx.person}`
                            : tx.type === 'WorkPending' && tx.person
                            ? `Client: ${tx.person}`
                            : accountText}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span>{formatDate(tx.date)}</span>
                        {tx.time && (
                          <>
                            <span>•</span>
                            <span>{formatTime(tx.time)}</span>
                          </>
                        )}
                        {tx.type === 'Lent' && (
                          <span className="text-amber-400/80 font-medium">• via {accountText}</span>
                        )}
                        {tx.type === 'WorkPending' && (
                          <span className="text-cyan-400/80 font-medium">• into {accountText}</span>
                        )}
                      </div>
                    </div>

                    <div className={`text-right text-base ${getAmountColor(tx.type)}`}>
                      {tx.type === 'Received' || tx.type === 'WorkPending' ? '+' : '-'}
                      {formatINR(tx.amount)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs truncate max-w-[180px]">
                      {tx.category && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                          {tx.category}
                        </span>
                      )}
                      {tx.note && <span className="text-slate-400 truncate italic">{tx.note}</span>}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {(tx.type === 'Lent' || tx.type === 'WorkPending') && tx.status !== 'Settled' && onSettleDue && (
                        <button
                          onClick={() => onSettleDue(tx.id)}
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1"
                        >
                          <CheckCircle size={12} /> {tx.type === 'WorkPending' ? 'Collect' : 'Settle'}
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
