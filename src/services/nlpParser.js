import { getTodayDateString, getCurrentTimeString } from '../utils/formatters.js';

/**
 * Parses a natural language sentence into transaction components.
 * Examples:
 * - "spent 250 slice food lunch with friends"
 * - "received 20000 sbi salary monthly credit"
 * - "transfer 5000 sbi to slice"
 * - "invested 1000 slice mutual fund monthly sip"
 * 
 * @param {string} input - Raw text string
 * @param {Array} accounts - Available accounts list [{ id, name }]
 * @param {Object} categories - Available categories { expense: [], income: [], investment: [] }
 * @returns {Object} Parsed transaction object
 */
export function parseQuickEntry(input = '', accounts = [], categories = { expense: [], income: [], investment: [] }) {
  if (!input || !input.trim()) {
    return null;
  }

  let text = input.trim();
  const lowerText = text.toLowerCase();

  // 1. Determine Type
  let type = 'Spent'; // default
  let detectedType = null;

  if (/\b(transfer|transferred|moved|move|sent to)\b/i.test(lowerText)) {
    type = 'Transfer';
    detectedType = 'Transfer';
  } else if (/\b(freelance|freelancing|client due|work pending|client owe|client owes|project payment|work payment)\b/i.test(lowerText)) {
    type = 'WorkPending';
    detectedType = 'WorkPending';
  } else if (/\b(invested|invest|investment|sip|stocks|mutual fund|fd|fixed deposit|gold)\b/i.test(lowerText)) {
    type = 'Invested';
    detectedType = 'Invested';
  } else if (/\b(lent|lend|loan|borrowed by|owe|owes|pending payment|due from|gave to)\b/i.test(lowerText)) {
    type = 'Lent';
    detectedType = 'Lent';
  } else if (/\b(received|got|credited|credit|earned|salary|refund|gift|income)\b/i.test(lowerText)) {
    type = 'Received';
    detectedType = 'Received';
  } else if (/\b(spent|spend|paid|buy|bought|payment|debit|withdrew|expense)\b/i.test(lowerText)) {
    type = 'Spent';
    detectedType = 'Spent';
  }

  // 2. Extract Amount
  // Match patterns like: 250, 250.50, 20,000, 5k, ₹500
  let amount = '';
  const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|lakh|l)?\b/i);
  let matchedAmountString = '';

  if (amountMatch) {
    matchedAmountString = amountMatch[0];
    let numStr = amountMatch[1].replace(/,/g, '');
    let val = parseFloat(numStr);
    const multiplier = amountMatch[2]?.toLowerCase();

    if (multiplier === 'k') {
      val *= 1000;
    } else if (multiplier === 'l' || multiplier === 'lakh') {
      val *= 100000;
    }

    if (!isNaN(val) && val > 0) {
      amount = val;
    }
  }

  // 3. Extract Accounts
  let accountId = '';
  let fromAccountId = '';
  let toAccountId = '';

  const matchedAccounts = [];
  accounts.forEach((acc) => {
    const accName = acc.name.toLowerCase();
    const regex = new RegExp(`\\b${accName}\\b`, 'i');
    const match = text.match(regex);
    if (match) {
      matchedAccounts.push({
        account: acc,
        index: match.index,
        matchText: match[0],
      });
    }
  });

  // Sort matched accounts by position in string
  matchedAccounts.sort((a, b) => a.index - b.index);

  if (type === 'Transfer') {
    // Look for "from X to Y" or "X to Y"
    const transferPattern = /from\s+(\w+)\s+to\s+(\w+)|(\w+)\s+to\s+(\w+)/i;
    const match = text.match(transferPattern);

    if (match) {
      const fromName = (match[1] || match[3] || '').toLowerCase();
      const toName = (match[2] || match[4] || '').toLowerCase();

      const fromAcc = accounts.find((a) => a.name.toLowerCase() === fromName);
      const toAcc = accounts.find((a) => a.name.toLowerCase() === toName);

      if (fromAcc) fromAccountId = fromAcc.id;
      if (toAcc) toAccountId = toAcc.id;
    } else if (matchedAccounts.length >= 2) {
      fromAccountId = matchedAccounts[0].account.id;
      toAccountId = matchedAccounts[1].account.id;
    } else if (matchedAccounts.length === 1) {
      fromAccountId = matchedAccounts[0].account.id;
      const otherAcc = accounts.find((a) => a.id !== fromAccountId);
      if (otherAcc) toAccountId = otherAcc.id;
    }
  } else {
    if (matchedAccounts.length > 0) {
      accountId = matchedAccounts[0].account.id;
    } else if (accounts.length > 0) {
      // Default to Slice or first account
      const sliceAcc = accounts.find((a) => a.name.toLowerCase().includes('slice'));
      accountId = sliceAcc ? sliceAcc.id : accounts[0].id;
    }
  }

  // 4. Extract Category & Person
  let category = '';
  let person = '';
  let activeCategoryList = [];
  if (type === 'Spent') activeCategoryList = categories.expense || [];
  else if (type === 'Received') activeCategoryList = categories.income || [];
  else if (type === 'Invested') activeCategoryList = categories.investment || [];
  else if (type === 'Lent') {
    category = 'Pending Payment';
    const personMatch = text.match(/(?:to|due from|given to|lent|gave)\s+([A-Za-z]+)/i);
    if (personMatch) {
      const candidate = personMatch[1];
      const isAccount = accounts.some((a) => a.name.toLowerCase() === candidate.toLowerCase());
      const isKeyword = ['to', 'from', 'due', 'money', 'rs', 'inr'].includes(candidate.toLowerCase());
      if (!isAccount && !isKeyword) {
        person = candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
      }
    }
  } else if (type === 'WorkPending') {
    category = 'Freelance Project';
    const clientMatch = text.match(/(?:from|client|for|by)\s+([A-Za-z]+)/i);
    if (clientMatch) {
      const candidate = clientMatch[1];
      const isAccount = accounts.some((a) => a.name.toLowerCase() === candidate.toLowerCase());
      const isKeyword = ['to', 'from', 'due', 'money', 'rs', 'inr', 'work', 'freelance', 'freelancing', 'client', 'payment', 'project'].includes(candidate.toLowerCase());
      if (!isAccount && !isKeyword) {
        person = candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
      }
    }
  }

  let matchedCategoryWord = '';
  for (const cat of activeCategoryList) {
    const catLower = cat.toLowerCase();
    const regex = new RegExp(`\\b${catLower}\\b`, 'i');
    if (regex.test(text)) {
      category = cat;
      matchedCategoryWord = cat;
      break;
    }
  }

  // Fallbacks if not matched
  if (!category && activeCategoryList.length > 0) {
    category = activeCategoryList[0];
  }

  // 5. Date & Time
  let date = getTodayDateString();
  const time = getCurrentTimeString();

  if (/\byesterday\b/i.test(text)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getDate()).padStart(2, '0');
    date = `${yYear}-${yMonth}-${yDay}`;
  }

  // 6. Remaining words become Note
  let note = text;
  // Remove matched keywords
  const removeWords = [
    'spent', 'spend', 'paid', 'buy', 'bought', 'payment', 'debit',
    'received', 'got', 'credited', 'credit', 'earned', 'income',
    'transfer', 'transferred', 'move', 'moved', 'from', 'to',
    'invested', 'invest', 'investment', 'yesterday', 'today',
    'lent', 'lend', 'loan', 'owe', 'owes', 'due', 'gave', 'given',
    'freelance', 'freelancing', 'client', 'work'
  ];

  if (matchedAmountString) {
    note = note.replace(matchedAmountString, '');
  }

  matchedAccounts.forEach((m) => {
    note = note.replace(new RegExp(`\\b${m.matchText}\\b`, 'gi'), '');
  });

  if (matchedCategoryWord) {
    note = note.replace(new RegExp(`\\b${matchedCategoryWord}\\b`, 'gi'), '');
  }

  if (person) {
    note = note.replace(new RegExp(`\\b${person}\\b`, 'gi'), '');
  }

  removeWords.forEach((w) => {
    note = note.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
  });

  // Clean note
  note = note.replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();

  return {
    type,
    amount: amount || '',
    accountId: type === 'Transfer' ? '' : accountId,
    fromAccountId: type === 'Transfer' ? fromAccountId : '',
    toAccountId: type === 'Transfer' ? toAccountId : '',
    category: type === 'Transfer' ? '' : category,
    person: person || '',
    status: (type === 'Lent' || type === 'WorkPending') ? 'Pending' : undefined,
    date,
    time,
    note,
    originalInput: input,
  };
}
