import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, Check, AlertCircle, Edit2 } from 'lucide-react';
import { parseQuickEntry } from '../services/nlpParser';
import { formatINR } from '../utils/formatters';

export function QuickEntryModal({
  isOpen,
  onClose,
  onSave,
  accounts = [],
  categories = {},
}) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const samplePrompts = [
    'spent 250 slice food lunch',
    'freelance 15000 sbi from acme website design',
    'lent 500 slice to rahul',
    'received 20000 sbi salary',
    'transfer 5000 sbi to slice',
    'invested 1000 slice mutual fund monthly sip',
    'spent 1500 kotak shopping clothes',
  ];

  const handleParse = (textToParse = input) => {
    setError('');
    if (!textToParse.trim()) {
      setError('Please enter a quick transaction note.');
      return;
    }

    const result = parseQuickEntry(textToParse, accounts, categories);
    if (!result || !result.amount) {
      setError('Could not detect an amount. Please specify an amount, e.g. "spent 250 slice food" or "lent 500 to rahul" or "freelance 15000 sbi"');
      return;
    }
    setParsed(result);
  };

  const handleSampleClick = (prompt) => {
    setInput(prompt);
    handleParse(prompt);
  };

  const handleConfirmSave = async () => {
    if (!parsed) return;
    try {
      await onSave({
        type: parsed.type,
        amount: Number(parsed.amount),
        accountId: parsed.accountId,
        fromAccountId: parsed.fromAccountId,
        toAccountId: parsed.toAccountId,
        category: parsed.category,
        person: parsed.person || '',
        status: parsed.status || ((parsed.type === 'Lent' || parsed.type === 'WorkPending') ? 'Pending' : undefined),
        date: parsed.date,
        time: parsed.time,
        note: parsed.note,
      });
      setInput('');
      setParsed(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction.');
    }
  };

  const getAccountName = (accId) => {
    const acc = accounts.find((a) => a.id === accId);
    return acc ? acc.name : accId;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 text-left my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Quick Natural-Language Entry</h3>
              <p className="text-xs text-slate-400">Type naturally and review parsed transaction before saving</p>
            </div>
          </div>
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

        <div className="mt-4 space-y-4">
          {/* Input text */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Enter Sentence
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. spent 250 slice food lunch"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleParse();
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-sm placeholder-slate-600 focus:outline-none focus:border-amber-400"
                autoFocus
              />
              <button
                type="button"
                onClick={() => handleParse()}
                className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold text-sm hover:bg-amber-300 transition-colors"
              >
                Parse
              </button>
            </div>
          </div>

          {/* Quick sample chips */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Try these examples:</span>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSampleClick(s)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Parsed Result Card (Confirmation before saving) */}
          {parsed && (
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check size={14} /> Parsed Transaction Preview
                </span>
                <span className="text-[11px] text-slate-400">Review before confirming</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Type</span>
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded font-bold ${
                      parsed.type === 'Spent'
                        ? 'bg-rose-500/20 text-rose-400'
                        : parsed.type === 'Received'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : parsed.type === 'Invested'
                        ? 'bg-purple-500/20 text-purple-400'
                        : parsed.type === 'Lent'
                        ? 'bg-amber-500/20 text-amber-400'
                        : parsed.type === 'WorkPending'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-sky-500/20 text-sky-400'
                    }`}
                  >
                    {parsed.type === 'Lent'
                      ? 'People Owe Me (Lent)'
                      : parsed.type === 'WorkPending'
                      ? 'Work / Freelance (Pending)'
                      : parsed.type}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Amount</span>
                  <span className="text-white font-bold text-base">
                    {formatINR(parsed.amount)}
                  </span>
                </div>

                {parsed.type === 'Transfer' ? (
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Transfer</span>
                    <div className="flex items-center gap-2 text-white font-medium mt-0.5">
                      <span className="px-2 py-0.5 bg-slate-800 rounded">{getAccountName(parsed.fromAccountId)}</span>
                      <ArrowRight size={14} className="text-slate-400" />
                      <span className="px-2 py-0.5 bg-slate-800 rounded">{getAccountName(parsed.toAccountId)}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      {parsed.type === 'Lent'
                        ? 'Paid From'
                        : parsed.type === 'WorkPending'
                        ? 'Receiving Bank'
                        : 'Account'}
                    </span>
                    <span className="text-white font-semibold">{getAccountName(parsed.accountId)}</span>
                  </div>
                )}

                {(parsed.type === 'Lent' || parsed.type === 'WorkPending') && (
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      {parsed.type === 'WorkPending' ? 'Client / Company' : 'Who Owes You'}
                    </span>
                    <span className={`font-bold ${parsed.type === 'WorkPending' ? 'text-cyan-300' : 'text-amber-300'}`}>
                      {parsed.person || 'Not specified'}
                    </span>
                  </div>
                )}

                {parsed.type !== 'Transfer' && (
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Category</span>
                    <span className="text-white font-semibold">{parsed.category || 'General'}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Date</span>
                  <span className="text-white">{parsed.date}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Note</span>
                  <span className="text-slate-300 italic">{parsed.note || 'None'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setParsed(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="px-4 py-2 text-xs font-bold bg-emerald-400 text-slate-950 rounded-lg hover:bg-emerald-300 flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Check size={14} strokeWidth={2.5} /> Confirm & Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
