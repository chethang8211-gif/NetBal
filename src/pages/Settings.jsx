import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { exportToCSV, exportToJSON, readBackupJSON } from '../services/exportImport';
import { formatINR } from '../utils/formatters';
import {
  Wallet,
  DollarSign,
  Tag,
  Download,
  Upload,
  Cloud,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

export function Settings({ onOpenFirebaseConfig }) {
  const {
    accounts,
    updateAccount,
    addAccount,
    deleteAccount,
    budget,
    updateBudget,
    categories,
    addCategory,
    transactions,
    investmentsValuation,
    restoreBackup,
    resetAllData,
    clearAllTransactions,
  } = useFinance();

  const { isFirebaseConfigured, currentUser } = useAuth();

  // Account editing state
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editStartingBal, setEditStartingBal] = useState('');

  // Add new account state
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccPurpose, setNewAccPurpose] = useState('');
  const [newAccStartingBal, setNewAccStartingBal] = useState('0');

  // Budget editing state
  const [budgetInput, setBudgetInput] = useState(String(budget || ''));
  const [budgetSavedMessage, setBudgetSavedMessage] = useState(false);

  // New category inputs
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newInvestCat, setNewInvestCat] = useState('');

  // Backup restore status
  const [restoreMessage, setRestoreMessage] = useState('');
  const [restoreError, setRestoreError] = useState('');

  // Start editing account
  const handleStartEditAccount = (acc) => {
    setEditingAccountId(acc.id);
    setEditName(acc.name);
    setEditPurpose(acc.purpose || '');
    setEditStartingBal(String(acc.startingBalance ?? 0));
  };

  const handleSaveAccountEdit = (id) => {
    if (!editName.trim()) return;
    updateAccount(id, {
      name: editName.trim(),
      purpose: editPurpose.trim(),
      startingBalance: parseFloat(editStartingBal) || 0,
    });
    setEditingAccountId(null);
  };

  const handleAddNewAccount = (e) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    addAccount({
      name: newAccName.trim(),
      purpose: newAccPurpose.trim() || 'Custom Account',
      startingBalance: parseFloat(newAccStartingBal) || 0,
    });
    setNewAccName('');
    setNewAccPurpose('');
    setNewAccStartingBal('0');
    setShowAddAccount(false);
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const val = parseFloat(budgetInput) || 0;
    updateBudget(val);
    setBudgetSavedMessage(true);
    setTimeout(() => setBudgetSavedMessage(false), 3000);
  };

  const handleRestoreFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError('');
    setRestoreMessage('');

    try {
      const data = await readBackupJSON(file);
      if (confirm(`Backup loaded successfully!\n- ${data.accounts?.length || 0} Accounts\n- ${data.transactions?.length || 0} Transactions\n\nDo you want to restore this data?`)) {
        restoreBackup(data);
        setRestoreMessage('Backup restored successfully!');
      }
    } catch (err) {
      setRestoreError(err.message || 'Failed to read backup file.');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <h2 className="text-2xl font-bold text-white tracking-tight">Settings & Accounts</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure accounts, starting balances, monthly budget, categories, and cloud backups
        </p>
      </div>

      {/* 1. Accounts & Starting Balances Section */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet size={18} className="text-emerald-400" />
              Accounts & Starting Balances
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Change account names, purposes, and starting balances. Balance recalculates immediately.
            </p>
          </div>
          <button
            onClick={() => setShowAddAccount(!showAddAccount)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold transition-colors"
          >
            <Plus size={14} /> Add Account
          </button>
        </div>

        {/* Add Account Form */}
        {showAddAccount && (
          <form
            onSubmit={handleAddNewAccount}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
          >
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">New Account</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC, Cash, ICICI"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Purpose / Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Fund, Credit Card"
                  value={newAccPurpose}
                  onChange={(e) => setNewAccPurpose(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Starting Balance (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={newAccStartingBal}
                  onChange={(e) => setNewAccStartingBal(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAccount(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-emerald-400 text-slate-950 rounded-lg hover:bg-emerald-300"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* Accounts List */}
        <div className="divide-y divide-slate-800">
          {accounts.map((acc) => {
            const isEditing = editingAccountId === acc.id;
            return (
              <div key={acc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {isEditing ? (
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Account Name"
                      className="px-2.5 py-1.5 text-xs rounded bg-slate-950 border border-slate-700 text-white"
                    />
                    <input
                      type="text"
                      value={editPurpose}
                      onChange={(e) => setEditPurpose(e.target.value)}
                      placeholder="Purpose"
                      className="px-2.5 py-1.5 text-xs rounded bg-slate-950 border border-slate-700 text-white"
                    />
                    <input
                      type="number"
                      step="any"
                      value={editStartingBal}
                      onChange={(e) => setEditStartingBal(e.target.value)}
                      placeholder="Starting Balance"
                      className="px-2.5 py-1.5 text-xs rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{acc.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                        {acc.purpose || 'Account'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Starting Balance:{' '}
                      <span className="text-white font-semibold">{formatINR(acc.startingBalance || 0)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveAccountEdit(acc.id)}
                        className="px-3 py-1.5 bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg hover:bg-emerald-300 flex items-center gap-1"
                      >
                        <Check size={14} /> Save
                      </button>
                      <button
                        onClick={() => setEditingAccountId(null)}
                        className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEditAccount(acc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit Account Details"
                      >
                        <Edit2 size={15} />
                      </button>
                      {accounts.length > 1 && (
                        <button
                          onClick={() => deleteAccount(acc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Monthly Budget Section */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign size={18} className="text-amber-400" />
            Monthly Expense Budget
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Set an optional monthly expense limit. Set to 0 to disable. Example: ₹15,000.
          </p>
        </div>

        <form onSubmit={handleSaveBudget} className="flex flex-col sm:flex-row gap-3 max-w-md">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 15000"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors"
          >
            Save Budget
          </button>
        </form>

        {budgetSavedMessage && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <Check size={14} /> Budget updated successfully!
          </span>
        )}
      </div>

      {/* 3. Category Management */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Tag size={18} className="text-purple-400" />
            Category Management
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            View predefined categories and add your own custom categories
          </p>
        </div>

        {/* Expense Categories */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Expense Categories
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(categories.expense || []).map((cat) => (
              <span
                key={cat}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300"
              >
                {cat}
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-sm pt-1">
            <input
              type="text"
              placeholder="Add expense category..."
              value={newExpenseCat}
              onChange={(e) => setNewExpenseCat(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white"
            />
            <button
              onClick={() => {
                addCategory('expense', newExpenseCat);
                setNewExpenseCat('');
              }}
              className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 rounded-lg"
            >
              Add
            </button>
          </div>
        </div>

        {/* Income Categories */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Income Categories
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(categories.income || []).map((cat) => (
              <span
                key={cat}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300"
              >
                {cat}
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-sm pt-1">
            <input
              type="text"
              placeholder="Add income category..."
              value={newIncomeCat}
              onChange={(e) => setNewIncomeCat(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white"
            />
            <button
              onClick={() => {
                addCategory('income', newIncomeCat);
                setNewIncomeCat('');
              }}
              className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 rounded-lg"
            >
              Add
            </button>
          </div>
        </div>

        {/* Investment Categories */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Investment Categories
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(categories.investment || []).map((cat) => (
              <span
                key={cat}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300"
              >
                {cat}
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-sm pt-1">
            <input
              type="text"
              placeholder="Add investment category..."
              value={newInvestCat}
              onChange={(e) => setNewInvestCat(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white"
            />
            <button
              onClick={() => {
                addCategory('investment', newInvestCat);
                setNewInvestCat('');
              }}
              className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 rounded-lg"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* 4. Cloud Database & Sync (Firebase) */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cloud size={18} className="text-emerald-400" />
              Cloud Data Persistence
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFirebaseConfigured
                ? currentUser
                  ? `Synchronized with Firestore for ${currentUser.email}`
                  : 'Firebase is connected. Log in to sync across devices.'
                : 'Currently running locally. Connect Firebase for multi-device sync.'}
            </p>
          </div>
          <button
            onClick={onOpenFirebaseConfig}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold border border-slate-700 transition-colors"
          >
            Firebase Config
          </button>
        </div>
      </div>

      {/* 5. Backup, Export & Restore */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Download size={18} className="text-sky-400" />
            Data Export & Backup
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Export spreadsheets or download complete JSON backups that can be restored on any device
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportToCSV(transactions, accounts)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            <FileSpreadsheet size={16} className="text-emerald-400" />
            Export CSV Spreadsheet
          </button>

          <button
            onClick={() =>
              exportToJSON({
                accounts,
                transactions,
                categories,
                budget,
                investmentsValuation,
              })
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            <Download size={16} className="text-sky-400" />
            Export JSON Backup
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors">
            <Upload size={16} className="text-purple-400" />
            Restore from JSON
            <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
          </label>
        </div>

        {restoreMessage && (
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <Check size={14} /> {restoreMessage}
          </p>
        )}
        {restoreError && (
          <p className="text-xs text-rose-400 flex items-center gap-1">
            <AlertTriangle size={14} /> {restoreError}
          </p>
        )}

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-400 block">Clear Transaction History</span>
            <span className="text-[11px] text-slate-500">
              Permanently delete all transaction entries while keeping your accounts intact at ₹0.
            </span>
          </div>
          <button
            onClick={() => {
              if (
                confirm(
                  '⚠️ Are you sure you want to delete all transaction records? Your accounts will remain intact.'
                )
              ) {
                clearAllTransactions();
              }
            }}
            className="px-3.5 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg transition-colors"
          >
            Clear History
          </button>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-400 block">Reset Everything</span>
            <span className="text-[11px] text-slate-500">
              Clear all transactions and restore default Slice, SBI, Kotak accounts at ₹0.
            </span>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all transactions and accounts? This cannot be undone.')) {
                resetAllData();
              }
            }}
            className="px-3.5 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}
