import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDrYLILdDHLuw7xaQB61wgIgeWIAXUX_Bw",
  authDomain: "tracker-24c57.firebaseapp.com",
  projectId: "tracker-24c57",
  storageBucket: "tracker-24c57.firebasestorage.app",
  messagingSenderId: "769751382871",
  appId: "1:769751382871:web:b6ab75c0c973b2b3d29c12",
  measurementId: "G-437XGT20YW"
};


/**
 * Retrieves Firebase configuration from environment or localStorage
 */
export function getFirebaseConfig() {
  // 1. Check custom configuration saved in localStorage
  try {
    const savedConfig = localStorage.getItem('tracker_firebase_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      // Discard invalid or outdated keys
      if (!parsed.apiKey || parsed.apiKey.includes('...') || parsed.apiKey !== DEFAULT_FIREBASE_CONFIG.apiKey) {
        localStorage.removeItem('tracker_firebase_config');
      } else if (parsed.apiKey && parsed.apiKey.length > 20 && parsed.projectId) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading saved firebase config:', err);
  }



  // 2. Check Vite environment variables
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  // 3. Project default configuration (auto-connected for all devices)
  return DEFAULT_FIREBASE_CONFIG;
}


let app = null;
let auth = null;
let db = null;

export function initializeFirebaseApp(customConfig = null) {
  const config = customConfig || getFirebaseConfig();

  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, auth: null, db: null, isConfigured: false };
  }

  try {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(config);
    }
    auth = getAuth(app);
    db = getFirestore(app);
    return { app, auth, db, isConfigured: true };
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    return { app: null, auth: null, db: null, isConfigured: false, error: err.message };
  }
}

// Initial attempt
const initResult = initializeFirebaseApp();
app = initResult.app;
auth = initResult.auth;
db = initResult.db;

export { app, auth, db };
