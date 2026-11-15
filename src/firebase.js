import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Web config is public by design; access is enforced by firestore.rules.
const firebaseConfig = {
  apiKey: 'AIzaSyArBUgDvKBwKUSycK6SjKk2NLJ3pvhEv0U',
  authDomain: 'couponvault-2026.firebaseapp.com',
  projectId: 'couponvault-2026',
  storageBucket: 'couponvault-2026.firebasestorage.app',
  messagingSenderId: '746724456805',
  appId: '1:746724456805:web:f27a81c5bf66133b44898c',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
