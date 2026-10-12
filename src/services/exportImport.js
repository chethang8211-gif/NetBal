import { getTodayDateString } from '../utils/formatters';

/**
 * Exports transactions to CSV file
 */
export function exportToCSV(transactions = [], accounts = []) {
  if (!transactions.length) {
    alert('No transactions to export.');
    return;
  }

  const accountMap = {};
  accounts.forEach((acc) => {
    accountMap[acc.id] = acc.name;
  });

  const headers = ['ID', 'Date', 'Time', 'Type', 'Amount (₹)', 'Account', 'From Account', 'To Account', 'Category', 'Note'];

  const rows = transactions.map((tx) => {
    const fromName = tx.fromAccountId ? (accountMap[tx.fromAccountId] || tx.fromAccountId) : '';
    const toName = tx.toAccountId ? (accountMap[tx.toAccountId] || tx.toAccountId) : '';
    const accName = tx.accountId ? (accountMap[tx.accountId] || tx.accountId) : '';

    return [
      `"${tx.id || ''}"`,
      `"${tx.date || ''}"`,
      `"${tx.time || ''}"`,
      `"${tx.type || ''}"`,
      Number(tx.amount) || 0,
      `"${accName}"`,
      `"${fromName}"`,
      `"${toName}"`,
      `"${tx.category || ''}"`,
      `"${(tx.note || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `money_tracker_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports full data to a JSON backup file
 */
export function exportToJSON(data) {
  const backupObject = {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: data.accounts || [],
    transactions: data.transactions || [],
    categories: data.categories || {},
    budget: data.budget || 0,
    investmentsValuation: data.investmentsValuation || 0,
  };

  const jsonString = JSON.stringify(backupObject, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `money_tracker_backup_${getTodayDateString()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reads and validates a JSON backup file
 * @param {File} file
 * @returns {Promise<Object>}
 */
export function readBackupJSON(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON structure.');
        }
        if (!Array.isArray(parsed.accounts) || !Array.isArray(parsed.transactions)) {
          throw new Error('Invalid backup file: missing accounts or transactions array.');
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse backup JSON: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}
