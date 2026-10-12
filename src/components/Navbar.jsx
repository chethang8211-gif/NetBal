import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  Zap,
  Cloud,
  CloudOff,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';

export function Navbar({ activeTab, setActiveTab, onOpenAddModal, onOpenQuickEntry, onOpenAuthModal, onOpenFirebaseModal }) {
  const { currentUser, isFirebaseConfigured, useLocalMode, logout } = useAuth();
  const { isSyncing, syncError } = useFinance();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Desktop / Tablet Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-xl font-black text-slate-950">₹</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                NetBal
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  OS
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">Cash • Receivables • Dues</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-850 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Entry Button */}
            <button
              onClick={onOpenQuickEntry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
              title="Quick Natural Language Entry (e.g. 'spent 250 slice food')"
            >
              <Zap size={15} className="fill-amber-400" />
              <span className="hidden sm:inline">Quick Entry</span>
            </button>

            {/* + Add Transaction Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add Transaction</span>
            </button>

            {/* Cloud Sync Status Button */}
            <button
              onClick={onOpenFirebaseModal}
              className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                syncError === 'quota_exceeded'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : isFirebaseConfigured && currentUser
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-sm'
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20'
              }`}
              title={
                syncError === 'quota_exceeded'
                  ? 'Operating in local offline storage (Firebase daily free quota reached; data is saved safely in browser)'
                  : isFirebaseConfigured && currentUser
                  ? `Synced to Firebase (${currentUser.email})`
                  : 'Click here to connect Firebase Cloud Sync'
              }
            >
              <Cloud
                size={16}
                className={
                  isSyncing
                    ? 'animate-pulse text-emerald-400'
                    : syncError === 'quota_exceeded'
                    ? 'text-amber-400'
                    : isFirebaseConfigured && currentUser
                    ? 'text-emerald-400'
                    : 'text-sky-400'
                }
              />
              <span className="font-semibold text-xs">
                {syncError === 'quota_exceeded'
                  ? 'Local Mode'
                  : isFirebaseConfigured && currentUser
                  ? 'Synced'
                  : 'Cloud Sync'}
              </span>
            </button>


            {/* Auth / Account Menu */}
            {isFirebaseConfigured && currentUser ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-300 hidden xl:inline max-w-[120px] truncate" title={currentUser.email}>
                  {currentUser.email}
                </span>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Account Login / Signup"
              >
                <User size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2 flex items-center justify-around safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
