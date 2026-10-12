import { getTodayDateString } from './formatters.js';

/**
 * Calculates current balances for all accounts based on:
 * Current Balance = Starting Balance + Received - Spent - Invested + Transfers In - Transfers Out
 * Overall Balance = Sum of all account balances.
 * 
 * @param {Array} accounts - Array of account objects: [{ id, name, startingBalance, purpose }]
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} { accountBalances: { [id]: number }, overallBalance: number, totalInvested: number }
 */
export function calculateBalances(accounts = [], transactions = []) {
  const accountBalances = {};
  
  // Initialize with starting balances
  accounts.forEach((acc) => {
    accountBalances[acc.id] = Number(acc.startingBalance) || 0;
  });

  let totalInvested = 0;
  let totalPendingReceivable = 0;
  const pendingDues = [];

  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    if (amount <= 0) return;

    if (tx.type === 'Received') {
      if (accountBalances[tx.accountId] !== undefined) {
        accountBalances[tx.accountId] += amount;
      }
    } else if (tx.type === 'Spent') {
      if (accountBalances[tx.accountId] !== undefined) {
        accountBalances[tx.accountId] -= amount;
      }
    } else if (tx.type === 'Invested') {
      if (accountBalances[tx.accountId] !== undefined) {
        accountBalances[tx.accountId] -= amount;
      }
      totalInvested += amount;
    } else if (tx.type === 'Lent') {
      if (accountBalances[tx.accountId] !== undefined) {
        accountBalances[tx.accountId] -= amount;
      }
      if (tx.status !== 'Settled') {
        totalPendingReceivable += amount;
        pendingDues.push(tx);
      }
    } else if (tx.type === 'WorkPending') {
      // Freelance / Client work due: money was NOT deducted from bank accounts!
      // Only tracked as pending receivable until client pays.
      if (tx.status !== 'Settled') {
        totalPendingReceivable += amount;
        pendingDues.push(tx);
      }
    } else if (tx.type === 'Transfer') {
      const fromAcc = tx.fromAccountId || tx.accountId;
      const toAcc = tx.toAccountId;

      if (fromAcc && accountBalances[fromAcc] !== undefined) {
        accountBalances[fromAcc] -= amount;
      }
      if (toAcc && accountBalances[toAcc] !== undefined) {
        accountBalances[toAcc] += amount;
      }
    }
  });

  const overallBalance = Object.values(accountBalances).reduce((sum, val) => sum + val, 0);
  const totalBalanceWithPending = overallBalance + totalPendingReceivable;

  return {
    accountBalances,
    overallBalance,
    totalInvested,
    totalPendingReceivable,
    totalBalanceWithPending,
    pendingDues,
  };
}


/**
 * Calculates summary metrics for Today and This Month
 */
export function calculateSummaryMetrics(transactions = []) {
  const todayStr = getTodayDateString();
  const currentYearMonth = todayStr.substring(0, 7); // "YYYY-MM"

  const today = {
    spent: 0,
    received: 0,
    invested: 0,
    transfers: 0,
    lent: 0,
    workPending: 0,
  };

  const monthly = {
    spent: 0,
    received: 0,
    invested: 0,
    transfers: 0,
    lent: 0,
    workPending: 0,
  };

  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    if (amount <= 0) return;

    const txDate = tx.date || '';
    const isToday = txDate === todayStr;
    const isThisMonth = txDate.startsWith(currentYearMonth);

    if (tx.type === 'Spent') {
      if (isToday) today.spent += amount;
      if (isThisMonth) monthly.spent += amount;
    } else if (tx.type === 'Received') {
      if (isToday) today.received += amount;
      if (isThisMonth) monthly.received += amount;
    } else if (tx.type === 'Invested') {
      if (isToday) today.invested += amount;
      if (isThisMonth) monthly.invested += amount;
    } else if (tx.type === 'Lent') {
      if (isToday) today.lent += amount;
      if (isThisMonth) monthly.lent += amount;
    } else if (tx.type === 'WorkPending') {
      if (isToday) today.workPending += amount;
      if (isThisMonth) monthly.workPending += amount;
    } else if (tx.type === 'Transfer') {
      if (isToday) today.transfers += amount;
      if (isThisMonth) monthly.transfers += amount;
    }
  });


  return { today, monthly };
}

/**
 * Groups transactions by category for a specific month (YYYY-MM) and type (Spent, Received, etc.)
 */
export function getCategoryBreakdown(transactions = [], yearMonth, type = 'Spent') {
  const breakdown = {};
  let total = 0;

  transactions.forEach((tx) => {
    if (tx.type !== type) return;
    if (yearMonth && !tx.date?.startsWith(yearMonth)) return;

    const amount = Number(tx.amount) || 0;
    const category = tx.category || 'Other';

    breakdown[category] = (breakdown[category] || 0) + amount;
    total += amount;
  });

  return { breakdown, total };
}

/**
 * Calculates monthly trends for the last 6 months (Received, Spent, Invested)
 */
export function getMonthlyTrends(transactions = [], numberOfMonths = 6) {
  const labels = [];
  const spentData = [];
  const receivedData = [];
  const investedData = [];

  const now = new Date();

  for (let i = numberOfMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });

    labels.push(label);

    let spent = 0;
    let received = 0;
    let invested = 0;

    transactions.forEach((tx) => {
      if (!tx.date?.startsWith(yearMonth)) return;
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'Spent') spent += amount;
      else if (tx.type === 'Received') received += amount;
      else if (tx.type === 'Invested') invested += amount;
    });

    spentData.push(spent);
    receivedData.push(received);
    investedData.push(invested);
  }

  return { labels, spentData, receivedData, investedData };
}
