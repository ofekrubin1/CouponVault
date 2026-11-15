import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator,
} from 'firebase/firestore';

// `vite --mode emulator` (used by the automated tests) talks to the local Firebase emulators instead of production.
export const EMULATOR = import.meta.env.MODE === 'emulator';

// Web config is public by design; access is enforced by firestore.rules.
const firebaseConfig = EMULATOR
  ? { apiKey: 'demo-key', authDomain: 'demo-couponvault.firebaseapp.com', projectId: 'demo-couponvault', appId: 'demo-app' }
  : {
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

// Offline cache: coupons open without signal (e.g. at the checkout); writes sync when back online.
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
