/**
 * Firebase Client Configuration
 * Used for authentication with the Flask backend
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let authInstance;
let googleProviderInstance;

// Firebase Auth depends on browser APIs. Initialize it lazily so importing
// this module during Next.js server rendering/prerendering is safe.
export function getFirebaseAuth() {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be initialized in the browser.');
  }

  if (!authInstance) {
    const missingConfig = Object.entries(firebaseConfig)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingConfig.length > 0) {
      throw new Error(`Missing Firebase configuration: ${missingConfig.join(', ')}`);
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    authInstance = getAuth(app);
  }

  return authInstance;
}

export function getGoogleProvider() {
  if (!googleProviderInstance) {
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({ prompt: 'select_account' });
  }

  return googleProviderInstance;
}

export { signInWithPopup, signOut, onAuthStateChanged };
