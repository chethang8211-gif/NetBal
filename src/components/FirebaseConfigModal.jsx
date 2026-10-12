import React, { useState } from 'react';
import { X, Cloud, Key, CheckCircle, AlertCircle, Database, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFirebaseConfig } from '../services/firebase';

export function FirebaseConfigModal({ isOpen, onClose }) {
  const { isFirebaseConfigured, currentUser, reloadFirebase, enableLocalMode, useLocalMode } = useAuth();
  
  const existingConfig = getFirebaseConfig() || {};
  const [configJson, setConfigJson] = useState(
    existingConfig.apiKey ? JSON.stringify(existingConfig, null, 2) : ''
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const parseConfigInput = (rawText) => {
    let cleaned = rawText.trim();
    // Strip variable declaration like "const firebaseConfig =" or "var config ="
    cleaned = cleaned.replace(/^(?:const|let|var)\s+[\w$]+\s*=\s*/i, '');
    // Strip trailing semicolon
    cleaned = cleaned.replace(/;\s*$/, '').trim();

    // 1. Try standard JSON.parse
    try {
      return JSON.parse(cleaned);
    } catch {
      // 2. If it has unquoted keys or JS object syntax, parse safely using Function constructor
      try {
        const parseFunc = new Function(`"use strict"; return (${cleaned});`);
        const result = parseFunc();
        if (result && typeof result === 'object') {
          return result;
        }
      } catch (err) {
        throw new Error('Could not parse configuration. Please ensure you paste the full config object.');
      }
    }
    throw new Error('Invalid configuration object.');
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const parsed = parseConfigInput(configJson);
      if (!parsed.apiKey || !parsed.projectId) {
        setError('Configuration must include at least "apiKey" and "projectId".');
        return;
      }
      reloadFirebase(parsed);
      setSuccess('Firebase configuration applied! Page will reload.');
    } catch (err) {
      setError(err.message || 'Failed to parse Firebase configuration.');
    }
  };


  const sampleFirebaseConfig = `{
  "apiKey": "AIzaSy...",
  "authDomain": "your-app.firebaseapp.com",
  "projectId": "your-app-id",
  "storageBucket": "your-app.firebasestorage.app",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef"
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 text-left my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Cloud size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Cloud Database & Sync</h3>
              <p className="text-xs text-slate-400">Firebase Firestore & Authentication setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Status Pill */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database size={18} className={isFirebaseConfigured ? 'text-emerald-400' : 'text-amber-400'} />
            <div>
              <div className="text-xs font-bold text-white">
                {isFirebaseConfigured
                  ? currentUser
                    ? `Connected to Firebase as ${currentUser.email}`
                    : 'Firebase Initialized (Please log in or register)'
                  : 'Running in Local Offline Mode'}
              </div>
              <div className="text-[11px] text-slate-400">
                {isFirebaseConfigured
                  ? 'All changes sync in real-time between your phone and laptop.'
                  : 'Data is saved securely in your browser localStorage.'}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Firebase Web SDK Config (JSON)
              </label>
              <button
                type="button"
                onClick={() => setConfigJson(sampleFirebaseConfig)}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                Insert Template
              </button>
            </div>
            <textarea
              rows={7}
              placeholder={sampleFirebaseConfig}
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              className="w-full p-3 font-mono text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              You can get this from your Firebase Console → Project Settings → General → Your apps → SDK setup/configuration.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                enableLocalMode();
                onClose();
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Continue with Local Mode
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-400 text-slate-950 rounded-xl hover:bg-emerald-300 shadow-md shadow-emerald-500/20"
            >
              Save & Connect Firebase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
