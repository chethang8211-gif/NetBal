import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  getLocalState,
  saveLocalState,
  syncUserDataToFirestore,
  addTransactionToCloud,
  updateTransactionInCloud,
  deleteTransactionFromCloud,
  clearUserTransactionsInCloud,
  subscribeToUserData,
} from '../services/storageService';
import {
  calculateBalances,
  calculateSummaryMetrics,
  getMonthlyTrends,
} from '../utils/calculations';

const FinanceContext = createContext();

export function useFinance() {
  return useContext(FinanceContext);
}

export function FinanceProvider({ children }) {
  const { currentUser, isFirebaseConfigured } = useAuth();

  // Load initial local state
  const initialLocal = useMemo(() => getLocalState(), []);

  const [accounts, setAccounts] = useState(initialLocal.accounts);
  const [transactions, setTransactions] = useState(initialLocal.transactions);
  const [categories, setCategories] = useState(initialLocal.categories);
  const [budget, setBudget] = useState(initialLocal.budget);
  const [investmentsValuation, setInvestmentsValuation] = useState(initialLocal.investmentsValuation);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const isRemoteUpdateRef = useRef(false);
  const lastSyncedProfileRef = useRef('');

  const recordLocalEdit = () => {
    const now = Date.now();
    try {
      localStorage.setItem('tracker_last_local_edit', String(now));
    } catch (e) {
      // ignore
    }
  };

  // Synchronize state with Firestore if authenticated
  useEffect(() => {
    if (currentUser?.uid && isFirebaseConfigured) {
      setIsSyncing(true);
      const unsubscribe = subscribeToUserData(
        currentUser.uid,
        (data) => {
          setSyncError(null);
          isRemoteUpdateRef.current = true;

          const remoteTime = data.updatedAt ? new Date(data.updatedAt).getTime() : 0;
          const lastLocalEdit = Number(localStorage.getItem('tracker_last_local_edit') || 0);
          const shouldUpdateProfile = remoteTime >= lastLocalEdit || lastLocalEdit === 0;

          if (data.accounts && shouldUpdateProfile) {
            setAccounts(data.accounts);
          }
          if (data.categories && shouldUpdateProfile) {
            setCategories(data.categories);
          }
          if (data.budget !== undefined && shouldUpdateProfile) {
            setBudget(data.budget);
          }
          if (data.investmentsValuation !== undefined && shouldUpdateProfile) {
            setInvestmentsValuation(data.investmentsValuation);
          }

          if (Array.isArray(data.transactions)) {
            const deletedIds = new Set(
              JSON.parse(localStorage.getItem('tracker_deleted_tx_ids') || '[]')
            );
            const clearedAt = Number(localStorage.getItem('tracker_cleared_at') || 0);

            setTransactions((prevLocal) => {
              const map = new Map();
              data.transactions.forEach((tx) => {
                if (!deletedIds.has(tx.id) && !deletedIds.has(tx.cloudDocId)) {
                  const txTime = tx.createdAt ? new Date(tx.createdAt).getTime() : 0;
                  if (txTime >= clearedAt) {
                    map.set(tx.id, tx);
                  }
                }
              });
              // Keep local transactions created offline
              prevLocal.forEach((tx) => {
                if (!deletedIds.has(tx.id) && !deletedIds.has(tx.cloudDocId)) {
                  if (!map.has(tx.id)) {
                    map.set(tx.id, tx);
                  }
                }
              });
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'))
              );
            });
          }
          setIsSyncing(false);
        },
        (error) => {
          if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota exceeded')) {
            console.warn('Firestore daily quota reached. Running safely in local storage mode.');
            setSyncError('quota_exceeded');
          } else {
            console.error('Firestore subscription error:', error);
            setSyncError(error?.message || 'sync_error');
          }
          setIsSyncing(false);
        }
      );

      return () => unsubscribe();
    }
  }, [currentUser?.uid, isFirebaseConfigured]);

  // Persist locally on state change, and sync to Firestore only when locally modified
  useEffect(() => {
    saveLocalState({
      accounts,
      transactions,
      categories,
      budget,
      investmentsValuation,
    });

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    if (currentUser?.uid && isFirebaseConfigured) {
      const currentPayload = JSON.stringify({
        accounts,
        categories,
        budget,
        investmentsValuation,
      });

      if (lastSyncedProfileRef.current === currentPayload) {
        return;
      }

      lastSyncedProfileRef.current = currentPayload;
      syncUserDataToFirestore(currentUser.uid, {
        accounts,
        categories,
        budget,
        investmentsValuation,
      });
    }
  }, [accounts, transactions, categories, budget, investmentsValuation, currentUser?.uid, isFirebaseConfigured]);

  // Derived calculations
  const {
    accountBalances,
    overallBalance,
    totalInvested,
    totalPendingReceivable,
    totalBalanceWithPending,
    pendingDues,
  } = useMemo(() => {
    return calculateBalances(accounts, transactions);
  }, [accounts, transactions]);

  const summaryMetrics = useMemo(() => {
    return calculateSummaryMetrics(transactions);
  }, [transactions]);

  const monthlyTrends = useMemo(() => {
    return getMonthlyTrends(transactions, 6);
  }, [transactions]);

  // Add Transaction
  const addTransaction = async (txData) => {
    recordLocalEdit();
    const newTx = {
      ...txData,
      id: txData.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    if (currentUser?.uid && isFirebaseConfigured) {
      try {
        const cloudId = await addTransactionToCloud(currentUser.uid, newTx);
        if (cloudId) {
          newTx.id = cloudId;
        }
      } catch (err) {
        console.warn('Error saving transaction to cloud:', err.message);
      }
    }

    setTransactions((prev) => {
      const updated = [newTx, ...prev];
      saveLocalState({
        accounts,
        transactions: updated,
        categories,
        budget,
        investmentsValuation,
        updatedAt: Date.now(),
      });
      return updated;
    });
    return newTx;
  };

  // Update Transaction
  const updateTransaction = async (id, updatedFields) => {
    recordLocalEdit();
    if (currentUser?.uid && isFirebaseConfigured) {
      try {
        await updateTransactionInCloud(currentUser.uid, id, updatedFields);
      } catch (err) {
        console.warn('Error updating transaction in cloud:', err.message);
      }
    }

    setTransactions((prev) => {
      const updated = prev.map((tx) =>
        tx.id === id ? { ...tx, ...updatedFields, updatedAt: new Date().toISOString() } : tx
      );
      saveLocalState({
        accounts,
        transactions: updated,
        categories,
        budget,
        investmentsValuation,
        updatedAt: Date.now(),
      });
      return updated;
    });
  };

  // Delete Transaction
  const deleteTransaction = async (txOrId) => {
    recordLocalEdit();
    const id = typeof txOrId === 'object' ? txOrId?.id : txOrId;
    const cloudDocId = typeof txOrId === 'object' ? (txOrId?.cloudDocId || txOrId?.id) : id;

    // Track deleted IDs in localStorage so stale cloud snapshots will not re-add them
    try {
      const deletedIds = JSON.parse(localStorage.getItem('tracker_deleted_tx_ids') || '[]');
      if (id) deletedIds.push(id);
      if (cloudDocId) deletedIds.push(cloudDocId);
      localStorage.setItem('tracker_deleted_tx_ids', JSON.stringify(Array.from(new Set(deletedIds))));
    } catch (e) {
      // ignore
    }

    // Immediately remove from local state and update local storage
    setTransactions((prev) => {
      const updated = prev.filter(
        (tx) => tx.id !== id && tx.id !== cloudDocId && tx.cloudDocId !== id && tx.cloudDocId !== cloudDocId
      );
      saveLocalState({
        accounts,
        transactions: updated,
        categories,
        budget,
        investmentsValuation,
        updatedAt: Date.now(),
      });
      return updated;
    });

    if (currentUser?.uid && isFirebaseConfigured) {
      try {
        await deleteTransactionFromCloud(currentUser.uid, id, cloudDocId);
      } catch (err) {
        console.warn('Error deleting transaction in cloud:', err.message);
      }
    }
  };

  // Settle a pending due (repayment received)
  const settleDue = async (txId, receivingAccountId) => {
    const dueTx = transactions.find((t) => t.id === txId);
    if (!dueTx) return;

    const accId = receivingAccountId || dueTx.accountId || (accounts[0]?.id || 'slice');
    const person = dueTx.person || dueTx.note || 'contact';
    const isWork = dueTx.type === 'WorkPending';

    // 1. Mark transaction as Settled
    await updateTransaction(txId, {
      status: 'Settled',
      settledAt: new Date().toISOString(),
    });

    // 2. Automatically record Received transaction into the account
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const hh = String(today.getHours()).padStart(2, '0');
    const mm = String(today.getMinutes()).padStart(2, '0');

    await addTransaction({
      type: 'Received',
      amount: Number(dueTx.amount) || 0,
      accountId: accId,
      category: isWork ? (dueTx.category || 'Freelance') : 'Debt Repayment',
      date: `${y}-${m}-${d}`,
      time: `${hh}:${mm}`,
      note: isWork
        ? `Payment received from client ${person}${dueTx.note ? ` (${dueTx.note})` : ''}`
        : `Repayment received from ${person}`,
    });
  };


  // Update Account
  const updateAccount = (id, updatedFields) => {
    recordLocalEdit();
    setAccounts((prev) => {
      const updated = prev.map((acc) => (acc.id === id ? { ...acc, ...updatedFields } : acc));
      saveLocalState({
        accounts: updated,
        transactions,
        categories,
        budget,
        investmentsValuation,
        updatedAt: Date.now(),
      });
      return updated;
    });
  };

  // Add Account
  const addAccount = (newAccount) => {
    recordLocalEdit();
    const acc = {
      ...newAccount,
      id: newAccount.id || `acc_${Date.now()}`,
      startingBalance: Number(newAccount.startingBalance) || 0,
    };
    setAccounts((prev) => {
      const updated = [...prev, acc];
      saveLocalState({
        accounts: updated,
        transactions,
        categories,
        budget,
        investmentsValuation,
        updatedAt: Date.now(),
      });
      return updated;
    });
  };

  // Delete Account
  const deleteAccount = (id) => {
    if (accounts.length <= 1) {
      alert('You must have at least one account.');
      return;
    }
    const hasTransactions = transactions.some(
      (tx) => tx.accountId === id || tx.fromAccountId === id || tx.toAccountId === id
    );
    if (hasTransactions) {
      if (!confirm('This account has transactions associated with it. Deleting it will affect balances. Are you sure?')) {
        return;
      }
    }
    recordLocalEdit();
    setAccounts((prev) => {
      const updated = prev.filter((acc) => acc.id !== id);
      saveLocalState({
        accounts: updated,
        transactions,
        categories,
        budget,
        investmentsValuation,
        updatedAt: Date.now(),
      });
      return updated;
    });
  };

  // Add Category
  const addCategory = (type, categoryName) => {
    if (!categoryName || !categoryName.trim()) return;
    recordLocalEdit();
    const cat = categoryName.trim();
    setCategories((prev) => {
      const list = prev[type] || [];
      if (list.includes(cat)) return prev;
      const updated = {
        ...prev,
        [type]: [...list, cat],
      };
      saveLocalState({
        accounts,
        transactions,
        categories: updated,
        budget,
        investmentsValuation,
        updatedAt: Date.now(),
      });
      return updated;
    });
  };

  // Update Budget
  const updateBudget = (newBudget) => {
    recordLocalEdit();
    const val = Number(newBudget) || 0;
    setBudget(val);
    saveLocalState({
      accounts,
      transactions,
      categories,
      budget: val,
      investmentsValuation,
      updatedAt: Date.now(),
    });
  };

  // Update Investments Valuation
  const updateInvestmentsValuation = (valuation) => {
    recordLocalEdit();
    const val = Number(valuation) || 0;
    setInvestmentsValuation(val);
    saveLocalState({
      accounts,
      transactions,
      categories,
      budget,
      investmentsValuation: val,
      updatedAt: Date.now(),
    });
  };

  // Restore Backup
  const restoreBackup = (backupData) => {
    recordLocalEdit();
    if (Array.isArray(backupData.accounts)) setAccounts(backupData.accounts);
    if (Array.isArray(backupData.transactions)) setTransactions(backupData.transactions);
    if (backupData.categories) setCategories(backupData.categories);
    if (backupData.budget !== undefined) setBudget(Number(backupData.budget) || 0);
    if (backupData.investmentsValuation !== undefined) {
      setInvestmentsValuation(Number(backupData.investmentsValuation) || 0);
    }
    saveLocalState({
      accounts: Array.isArray(backupData.accounts) ? backupData.accounts : accounts,
      transactions: Array.isArray(backupData.transactions) ? backupData.transactions : transactions,
      categories: backupData.categories || categories,
      budget: backupData.budget !== undefined ? Number(backupData.budget) : budget,
      investmentsValuation: backupData.investmentsValuation !== undefined ? Number(backupData.investmentsValuation) : investmentsValuation,
      updatedAt: Date.now(),
    });
  };

  // Reset to clean zero state
  const resetAllData = async () => {
    recordLocalEdit();
    try {
      localStorage.setItem('tracker_cleared_at', String(Date.now()));
    } catch (e) {
      // ignore
    }
    const cleanAccounts = DEFAULT_ACCOUNTS.map((acc) => ({ ...acc, startingBalance: 0 }));
    setAccounts(cleanAccounts);
    setTransactions([]);
    setCategories(DEFAULT_CATEGORIES);
    setBudget(0);
    setInvestmentsValuation(0);

    saveLocalState({
      accounts: cleanAccounts,
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      budget: 0,
      investmentsValuation: 0,
      updatedAt: Date.now(),
    });

    if (currentUser?.uid && isFirebaseConfigured) {
      try {
        await clearUserTransactionsInCloud(currentUser.uid);
        await syncUserDataToFirestore(currentUser.uid, {
          accounts: cleanAccounts,
          categories: DEFAULT_CATEGORIES,
          budget: 0,
          investmentsValuation: 0,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not reset data in cloud:', err.message);
      }
    }
  };

  // Clear all transaction history
  const clearAllTransactions = async () => {
    recordLocalEdit();
    try {
      localStorage.setItem('tracker_cleared_at', String(Date.now()));
    } catch (e) {
      // ignore
    }
    setTransactions([]);
    saveLocalState({
      accounts,
      transactions: [],
      categories,
      budget,
      investmentsValuation,
      updatedAt: Date.now(),
    });

    if (currentUser?.uid && isFirebaseConfigured) {
      try {
        await clearUserTransactionsInCloud(currentUser.uid);
      } catch (err) {
        console.warn('Could not clear cloud transactions:', err.message);
      }
    }
  };

  const value = {
    accounts,
    transactions,
    categories,
    budget,
    investmentsValuation,
    accountBalances,
    overallBalance,
    totalInvested,
    totalPendingReceivable,
    totalBalanceWithPending,
    pendingDues,
    summaryMetrics,
    monthlyTrends,
    isSyncing,
    syncError,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    settleDue,
    updateAccount,
    addAccount,
    deleteAccount,
    addCategory,
    updateBudget,
    updateInvestmentsValuation,
    restoreBackup,
    resetAllData,
  };


  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}
