import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, AlertCircle, Calendar, Clock, Tag, ArrowRight, IndianRupee } from 'lucide-react';
import { getTodayDateString, getCurrentTimeString, formatIndianNumber } from '../utils/formatters';

export function AddTransactionModal({
  isOpen,
  onClose,
  onSave,
  accounts = [],
  categories = {},
  onAddCategory,
  initialData = null, // If provided, modal is in Edit mode
  defaultAccountId = null,
}) {
  const [type, setType] = useState('Spent'); // Spent, Received, Invested, Transfer, Lent
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCustomCategory, setShowAddCustomCategory] = useState(false);
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [person, setPerson] = useState('');
  const [dueDate, setDueDate] = useState('');

  const prevIsOpenRef = useRef(false);

  // Initialize or reset form only when modal opens or initialData changes
  useEffect(() => {
    if (isOpen && (!prevIsOpenRef.current || initialData)) {
      setError('');
      setShowAddCustomCategory(false);
      setNewCategoryInput('');

      if (initialData) {
        // Edit mode
        setType(initialData.type || 'Spent');
        setAmount(String(initialData.amount || ''));
        setAccountId(initialData.accountId || (accounts[0]?.id || ''));
        setFromAccountId(initialData.fromAccountId || (accounts[0]?.id || ''));
        setToAccountId(initialData.toAccountId || (accounts[1]?.id || ''));
        setCategory(initialData.category || '');
        setPerson(initialData.person || '');
        setDueDate(initialData.dueDate || '');
        setDate(initialData.date || getTodayDateString());
        setTime(initialData.time || getCurrentTimeString());
        setNote(initialData.note || '');
      } else {
        // Add mode
        setType('Spent');
        setAmount('');
        const defaultAcc = defaultAccountId || accounts[0]?.id || '';
        setAccountId(defaultAcc);
        setFromAccountId(defaultAcc);
        // Default to another account for transfer
        const otherAcc = accounts.find((a) => a.id !== defaultAcc) || accounts[1];
        setToAccountId(otherAcc ? otherAcc.id : '');
        setPerson('');
        setDueDate('');
        setDate(getTodayDateString());
        setTime(getCurrentTimeString());
        setNote('');

        const defaultCats = categories.expense || [];
        setCategory(defaultCats[0] || 'Food');
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialData]);

  // Update default category when type changes
  const handleTypeChange = (newType) => {
    setType(newType);
    setError('');
    let catList = [];
    if (newType === 'Spent') catList = categories.expense || [];
    else if (newType === 'Received') catList = categories.income || [];
    else if (newType === 'Invested') catList = categories.investment || [];
    else if (newType === 'Lent') catList = ['Personal Loan', 'Shared Bill', 'Friend / Family', 'Work Advance', 'Other'];
    else if (newType === 'WorkPending') catList = ['Freelance Project', 'Web Development', 'Design & Creative', 'Consulting', 'Content Writing', 'Software Dev', 'Retainer / Contract', 'Other'];

    if (catList.length > 0) {
      setCategory(catList[0]);
    } else {
      setCategory(newType === 'Transfer' ? 'Transfer' : 'General');
    }
  };

  const handleAddNewCategory = (e) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;

    let targetType = 'expense';
    if (type === 'Received') targetType = 'income';
    else if (type === 'Invested') targetType = 'investment';

    onAddCategory(targetType, newCategoryInput.trim());
    setCategory(newCategoryInput.trim());
    setNewCategoryInput('');
    setShowAddCustomCategory(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (type === 'Transfer') {
      if (!fromAccountId || !toAccountId) {
        setError('Please select both From and To accounts for the transfer.');
        return;
      }
      if (fromAccountId === toAccountId) {
        setError('Transfer source and destination cannot be the same account.');
        return;
      }
    } else if (type === 'Lent') {
      if (!accountId) {
        setError('Please select which account the money was paid from.');
        return;
      }
      if (!person.trim()) {
        setError('Please enter who owes you this money (Person / Business name).');
        return;
      }
    } else if (type === 'WorkPending') {
      if (!person.trim()) {
        setError('Please enter the client or company name who should pay you.');
        return;
      }
      if (!accountId) {
        setError('Please select which account you expect to receive this payment into.');
        return;
      }
    } else {
      if (!accountId) {
        setError('Please select an account.');
        return;
      }
      if (!category) {
        setError('Please select or specify a category.');
        return;
      }
    }

    if (!date) {
      setError('Please select a date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionData = {
        ...(initialData ? { id: initialData.id } : {}),
        type,
        amount: parsedAmount,
        accountId: type === 'Transfer' ? fromAccountId : accountId,
        fromAccountId: type === 'Transfer' ? fromAccountId : null,
        toAccountId: type === 'Transfer' ? toAccountId : null,
        category: type === 'Transfer' ? 'Transfer' : (type === 'Lent' ? (category || 'Lent') : (type === 'WorkPending' ? (category || 'Freelance') : category)),
        person: (type === 'Lent' || type === 'WorkPending') ? person.trim() : null,
        status: (type === 'Lent' || type === 'WorkPending') ? (initialData?.status || 'Pending') : null,
        dueDate: (type === 'Lent' || type === 'WorkPending') ? dueDate : null,
        date,
        time: time || '',
        note: note.trim(),
      };

      await onSave(transactionData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!isOpen) return null;

  // Available categories based on current type
  let currentCategoryList = [];
  if (type === 'Spent') currentCategoryList = categories.expense || [];
  else if (type === 'Received') currentCategoryList = categories.income || [];
  else if (type === 'Invested') currentCategoryList = categories.investment || [];
  else if (type === 'Lent') currentCategoryList = ['Personal Loan', 'Shared Bill', 'Friend / Family', 'Work Advance', 'Other'];
  else if (type === 'WorkPending') currentCategoryList = ['Freelance Project', 'Web Development', 'Design & Creative', 'Consulting', 'Content Writing', 'Software Dev', 'Retainer / Contract', 'Other'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 text-left my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {initialData ? 'Edit Transaction' : 'Add New Transaction'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {[
                { id: 'Spent', label: 'Spent', activeStyle: 'bg-rose-500/25 text-rose-300 border-rose-500 ring-1 ring-rose-500/50 shadow-md shadow-rose-950/40' },
                { id: 'Received', label: 'Received', activeStyle: 'bg-emerald-500/25 text-emerald-300 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-950/40' },
                { id: 'Invested', label: 'Invested', activeStyle: 'bg-purple-500/25 text-purple-300 border-purple-500 ring-1 ring-purple-500/50 shadow-md shadow-purple-950/40' },
                { id: 'Transfer', label: 'Transfer', activeStyle: 'bg-sky-500/25 text-sky-300 border-sky-500 ring-1 ring-sky-500/50 shadow-md shadow-sky-950/40' },
                { id: 'Lent', label: 'People Owe Me', activeStyle: 'bg-amber-500/25 text-amber-300 border-amber-500 ring-1 ring-amber-500/50 shadow-md shadow-amber-950/40' },
                { id: 'WorkPending', label: 'Work / Freelance', activeStyle: 'bg-cyan-500/25 text-cyan-300 border-cyan-500 ring-1 ring-cyan-500/50 shadow-md shadow-cyan-950/40' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleTypeChange(t.id)}
                  className={`py-2.5 px-2 text-xs font-bold rounded-lg border transition-all text-center cursor-pointer select-none active:scale-95 ${
                    type === t.id
                      ? `${t.activeStyle}`
                      : 'border-slate-800/80 bg-slate-900/70 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xl placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
              <span className="text-[11px] text-slate-400 mt-1 block">
                Formatted: ₹{formatIndianNumber(amount)}
              </span>
            )}
          </div>

          {/* Person Name Input (for Lent / People Owe Me) */}
          {type === 'Lent' && (
            <div>
              <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                Who owes you this money? (Person / Contact Name) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul, Priya, Alex, Landlord..."
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Client / Company Name (for Work / Freelance Pending) */}
          {type === 'WorkPending' && (
            <div>
              <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
                Client / Company Name (Who will pay for this work?) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp, Design Client, Rajesh, Studio..."
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {/* Account Selectors */}
          {type === 'Transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  From Account
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.purpose})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  To Account
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.purpose})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {type === 'Lent'
                  ? 'Paid From Which Account'
                  : type === 'WorkPending'
                  ? 'Expected Receiving Bank Account'
                  : 'Account'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — {acc.purpose}
                  </option>
                ))}
              </select>
              {type === 'WorkPending' && (
                <span className="text-[11px] text-cyan-400/90 mt-1.5 block">
                  💡 No money is deducted now. When the client pays, clicking "Collect" will deposit money directly into this account.
                </span>
              )}
            </div>
          )}

          {/* Category Selector (not needed for Transfer) */}
          {type !== 'Transfer' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomCategory(!showAddCustomCategory)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <Plus size={13} /> Custom Category
                </button>
              </div>

              {showAddCustomCategory ? (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Enter custom category name..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="px-3 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-emerald-400"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomCategory(false)}
                    className="px-2 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {currentCategoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}


          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Time (optional)
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Expected Payment Due Date (for Lent / WorkPending) */}
          {(type === 'Lent' || type === 'WorkPending') && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Expected Payment Due Date (optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Note / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Swiggy food delivery, salary, SIP contribution..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
