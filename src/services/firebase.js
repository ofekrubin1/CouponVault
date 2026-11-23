import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator,
} from 'firebase/firestore';

// Two modes never touch production; they talk to Firebase emulators on this computer:
// - `vite --mode emulator`: the automated tests (ports 9099 / 8080, wiped every run).
// - `vite --mode sandbox`: the test environment for trying changes by hand (`npm run local`, ports 9095 / 8085,
//   fictional users and coupons).
export const LOCAL = import.meta.env.MODE === 'sandbox'; // Vite doesn't allow a mode called "local"
export const EMULATOR = import.meta.env.MODE === 'emulator' || LOCAL;
const DEMO_PROJECT = LOCAL ? 'demo-couponvault-local' : 'demo-couponvault';
// The emulators run on the computer that serves the page, so a phone on the same Wi-Fi reaches them too.
const emulatorHost = () => (window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname);

// Web config is public by design; access is enforced by firestore.rules.
const firebaseConfig = EMULATOR
  ? { apiKey: 'demo-key', authDomain: `${DEMO_PROJECT}.firebaseapp.com`, projectId: DEMO_PROJECT, appId: 'demo-app' }
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
  const host = emulatorHost();
  connectAuthEmulator(auth, `http://${host}:${LOCAL ? 9095 : 9099}`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, LOCAL ? 8085 : 8080);
}
