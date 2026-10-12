import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Investments } from './pages/Investments';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { AddTransactionModal } from './components/AddTransactionModal';
import { QuickEntryModal } from './components/QuickEntryModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AuthModal } from './components/AuthModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [defaultAccountForAdd, setDefaultAccountForAdd] = useState(null);

  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    transaction: null,
  });

  const {
    accounts,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
  } = useFinance();

  // Open add transaction modal
  const handleOpenAddModal = (accountId = null, initialType = 'Spent') => {
    setEditingTransaction(initialType !== 'Spent' ? { type: initialType } : null);
    setDefaultAccountForAdd(accountId);
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setIsAddModalOpen(true);
  };

  // Open delete confirmation
  const handleOpenDeleteModal = (transaction) => {
    setDeleteModalState({
      isOpen: true,
      transaction,
    });
  };

  // Save transaction handler (handles both add & update)
  const handleSaveTransaction = async (txData) => {
    if (editingTransaction && editingTransaction.id) {
      await updateTransaction(editingTransaction.id, txData);
    } else {
      await addTransaction(txData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Navbar & Mobile Bottom Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => handleOpenAddModal()}
        onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20 md:pb-12">
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenAddModal={handleOpenAddModal}
            onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToSettings={() => setActiveTab('settings')}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleOpenDeleteModal}
          />
        )}

        {activeTab === 'transactions' && (
          <Transactions
            onOpenAddModal={handleOpenAddModal}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleOpenDeleteModal}
          />
        )}

        {activeTab === 'investments' && (
          <Investments
            onOpenAddModal={handleOpenAddModal}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleOpenDeleteModal}
          />
        )}

        {activeTab === 'reports' && <Reports />}

        {activeTab === 'settings' && (
          <Settings onOpenFirebaseConfig={() => setIsFirebaseModalOpen(true)} />
        )}
      </main>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
          setDefaultAccountForAdd(null);
        }}
        onSave={handleSaveTransaction}
        accounts={accounts}
        categories={categories}
        onAddCategory={addCategory}
        initialData={editingTransaction}
        defaultAccountId={defaultAccountForAdd}
      />

      <QuickEntryModal
        isOpen={isQuickEntryOpen}
        onClose={() => setIsQuickEntryOpen(false)}
        onSave={addTransaction}
        accounts={accounts}
        categories={categories}
      />

      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, transaction: null })}
        onConfirm={deleteTransaction}
        transaction={deleteModalState.transaction}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenFirebaseConfig={() => setIsFirebaseModalOpen(true)}
      />

      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MainApp />
      </FinanceProvider>
    </AuthProvider>
  );
}
