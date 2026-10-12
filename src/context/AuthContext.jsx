import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, getFirebaseConfig, initializeFirebaseApp } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);
  const [useLocalMode, setUseLocalMode] = useState(() => {
    return localStorage.getItem('tracker_local_mode') === 'true';
  });

  useEffect(() => {
    const config = getFirebaseConfig();
    if (config && config.apiKey) {
      setIsFirebaseConfigured(true);
      if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
          setLoading(false);
        });
        return unsubscribe;
      }
    } else {
      setIsFirebaseConfigured(false);
      setLoading(false);
    }
  }, []);

  const login = (email, password) => {
    if (!auth) throw new Error('Firebase Auth is not initialized. Please configure Firebase in Settings.');
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = (email, password) => {
    if (!auth) throw new Error('Firebase Auth is not initialized. Please configure Firebase in Settings.');
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    if (auth) {
      return signOut(auth);
    }
    setCurrentUser(null);
  };

  const resetPassword = (email) => {
    if (!auth) throw new Error('Firebase Auth is not initialized. Please configure Firebase in Settings.');
    return sendPasswordResetEmail(auth, email);
  };

  const enableLocalMode = () => {
    setUseLocalMode(true);
    localStorage.setItem('tracker_local_mode', 'true');
  };

  const disableLocalMode = () => {
    setUseLocalMode(false);
    localStorage.removeItem('tracker_local_mode');
  };

  const reloadFirebase = (newConfig) => {
    try {
      localStorage.setItem('tracker_firebase_config', JSON.stringify(newConfig));
      const result = initializeFirebaseApp(newConfig);
      setIsFirebaseConfigured(result.isConfigured);
      window.location.reload();
    } catch (err) {
      console.error('Error reloading Firebase:', err);
    }
  };

  const value = {
    currentUser,
    loading,
    isFirebaseConfigured,
    useLocalMode,
    enableLocalMode,
    disableLocalMode,
    login,
    signup,
    logout,
    resetPassword,
    reloadFirebase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
