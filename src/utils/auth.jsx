import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase';
import { syncAccount } from './accountSync';

const AuthContext = createContext();
const SYNCED_USER_KEY = 'optiroute.syncedUser';

/* global __OPTIROUTE_PROXY_API__ */
export const API_BASE = __OPTIROUTE_PROXY_API__
  ? `${window.location.origin}/optiroute-api`
  : import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [syncedUid, setSyncedUid] = useState(() => sessionStorage.getItem(SYNCED_USER_KEY));
  const [loading, setLoading] = useState(true);
  const user = firebaseUser && firebaseUser.uid === syncedUid ? firebaseUser : null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        sessionStorage.removeItem(SYNCED_USER_KEY);
        setSyncedUid(null);
      }
      setFirebaseUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signOut = () => {
    sessionStorage.removeItem(SYNCED_USER_KEY);
    setSyncedUid(null);
    return firebaseSignOut(auth);
  };

  const completeSignIn = async (account, organizationName) => {
    sessionStorage.removeItem(SYNCED_USER_KEY);
    setSyncedUid(null);
    try {
      const token = await account.getIdToken(true);
      await syncAccount(`${API_BASE}/api/auth/sync`, token, organizationName);
      if (auth.currentUser !== account) {
        throw new Error('Your sign-in session changed. Please sign in again.');
      }
      sessionStorage.setItem(SYNCED_USER_KEY, account.uid);
      setFirebaseUser(account);
      setSyncedUid(account.uid);
    } catch (error) {
      if (auth.currentUser === account) await signOut().catch(() => {});
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, completeSignIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export async function getAuthHeaders() {
  const account = auth.currentUser;
  if (!account || account.uid !== sessionStorage.getItem(SYNCED_USER_KEY)) return {};
  const token = await account.getIdToken();
  if (auth.currentUser !== account || account.uid !== sessionStorage.getItem(SYNCED_USER_KEY)) return {};
  return { 'Authorization': `Bearer ${token}` };
}

export function handleFirebaseError(error) {
  switch (error.code) {
    case 'auth/invalid-credential':
      return 'Incorrect email or password. If you signed up with Google, use "Sign in with Google".';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/user-not-found':
      return 'User with this email does not exist. Please sign up first.';
    case 'auth/email-already-in-use':
      return 'User with this email already exist try log in';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled. Please try again.';
    case 'auth/popup-timeout':
      return 'Google sign-in took too long. Please try again.';
    default:
      return error.message;
  }
}

export async function apiCall(url, options = {}) {
  const headers = await getAuthHeaders();
  const mergedHeaders = { ...headers, ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers: mergedHeaders });
  if (res.status === 401) {
    sessionStorage.removeItem(SYNCED_USER_KEY);
    firebaseSignOut(auth);
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  return res;
}

