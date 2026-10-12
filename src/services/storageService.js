import { db } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

export const DEFAULT_ACCOUNTS = [
  { id: 'slice', name: 'Slice', purpose: 'Primary UPI', startingBalance: 0 },
  { id: 'sbi', name: 'SBI', purpose: 'Money Received', startingBalance: 0 },
  { id: 'kotak', name: 'Kotak', purpose: 'Debit Card', startingBalance: 0 },
];

export const DEFAULT_CATEGORIES = {
  expense: [
    'Food',
    'Travel',
    'Shopping',
    'Bills',
    'Education',
    'Entertainment',
    'Health',
    'Electronics',
    'Personal',
    'Other',
  ],
  income: [
    'Salary',
    'Freelance',
    'Gift',
    'Refund',
    'Other',
  ],
  investment: [
    'Mutual Fund',
    'Stocks',
    'SIP',
    'Fixed Deposit',
    'Gold',
    'Other',
  ],
};

const LOCAL_STORAGE_KEY = 'money_tracker_local_state';
const RESET_VERSION = 'v4_pure_zero_clean_slate';

/**
 * Loads cached data from localStorage
 */
export function getLocalState() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        accounts: parsed.accounts && parsed.accounts.length ? parsed.accounts : DEFAULT_ACCOUNTS,
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        categories: parsed.categories || DEFAULT_CATEGORIES,
        budget: parsed.budget || 0,
        investmentsValuation: parsed.investmentsValuation || 0,
        updatedAt: parsed.updatedAt || 0,
      };
    }
  } catch (err) {
    console.error('Error loading local state:', err);
  }

  return {
    accounts: DEFAULT_ACCOUNTS,
    transactions: [],
    categories: DEFAULT_CATEGORIES,
    budget: 0,
    investmentsValuation: 0,
    updatedAt: 0,
  };
}

/**
 * Saves current data to localStorage
 */
export function saveLocalState(state) {
  try {
    const payload = {
      ...state,
      updatedAt: state.updatedAt || Date.now(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Error saving local state:', err);
  }
}

/**
 * Syncs entire user document to Firestore
 */
export async function syncUserDataToFirestore(userId, state) {
  if (!db || !userId) return;
  try {
    const userDocRef = doc(db, 'users', userId, 'data', 'profile');
    await setDoc(userDocRef, {
      accounts: state.accounts,
      categories: state.categories,
      budget: state.budget,
      investmentsValuation: state.investmentsValuation,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Profile cloud sync skipped:', err.message);
  }
}

/**
 * Adds a transaction to Firestore or local state
 */
export async function addTransactionToCloud(userId, transaction) {
  if (db && userId) {
    try {
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const docRef = await addDoc(transactionsRef, {
        ...transaction,
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (err) {
      console.warn('Transaction cloud add skipped:', err.message);
    }
  }
  return null;
}

/**
 * Updates a transaction in Firestore
 */
export async function updateTransactionInCloud(userId, transactionId, updatedFields) {
  if (db && userId && transactionId) {
    try {
      const docRef = doc(db, 'users', userId, 'transactions', transactionId);
      await updateDoc(docRef, {
        ...updatedFields,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Transaction cloud update skipped:', err.message);
    }
  }
}

export async function deleteTransactionFromCloud(userId, transactionId, cloudDocId) {
  if (!db || !userId) return;

  const ids = Array.from(new Set([transactionId, cloudDocId].filter(Boolean)));

  // 1. Try deleting directly by document ID for all candidate IDs
  for (const docId of ids) {
    try {
      const docRef = doc(db, 'users', userId, 'transactions', docId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn(`Direct delete for doc ${docId} skipped:`, err.message);
    }
  }

  // 2. Also search if a document was stored with id field matching either candidate
  for (const targetId of ids) {
    try {
      const txCollectionRef = collection(db, 'users', userId, 'transactions');
      const q = query(txCollectionRef, where('id', '==', targetId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (err) {
      console.warn(`Query delete for id ${targetId} skipped:`, err.message);
    }
  }
}

/**
 * Deletes all transactions for a user in Firestore (for reset)
 */
export async function clearUserTransactionsInCloud(userId) {
  if (!db || !userId) return;
  try {
    const txCollectionRef = collection(db, 'users', userId, 'transactions');
    const snap = await getDocs(txCollectionRef);
    if (!snap.empty) {
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + 400);
        chunk.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
  } catch (err) {
    console.warn('Clear user transactions skipped:', err.message);
  }
}

/**
 * Subscribes to real-time updates from Firestore for authenticated user
 */
export function subscribeToUserData(userId, onDataUpdate, onError) {
  if (!db || !userId) return () => {};

  // 1. Subscribe to profile/settings
  const profileDocRef = doc(db, 'users', userId, 'data', 'profile');
  const unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
    // Ignore snapshot if it reflects a local uncommitted write to prevent infinite feedback loops
    if (docSnap.exists() && !docSnap.metadata?.hasPendingWrites) {
      const data = docSnap.data();
      onDataUpdate({
        accounts: data.accounts,
        categories: data.categories,
        budget: data.budget,
        investmentsValuation: data.investmentsValuation,
        updatedAt: data.updatedAt,
      });
    }
  }, onError);

  // 2. Subscribe to transactions collection
  const txCollectionRef = collection(db, 'users', userId, 'transactions');
  const txQuery = query(txCollectionRef, orderBy('date', 'desc'));
  const unsubscribeTx = onSnapshot(txQuery, (querySnapshot) => {
    if (querySnapshot.metadata?.hasPendingWrites) return;
    const txList = [];
    querySnapshot.forEach((docSnap) => {
      txList.push({
        ...docSnap.data(),
        id: docSnap.id,
        cloudDocId: docSnap.id,
      });
    });
    onDataUpdate({ transactions: txList });
  }, onError);

  return () => {
    unsubscribeProfile();
    unsubscribeTx();
  };
}
