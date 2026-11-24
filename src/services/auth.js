// Sign-in / sign-out. Screens use these instead of calling Firebase Auth directly.
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signInWithRedirect, signOut as fbSignOut } from 'firebase/auth';
import { clearIndexedDbPersistence, terminate } from 'firebase/firestore';
import { auth, db, googleProvider, LOCAL } from './firebase';
import { forgetLock } from './deviceLock';

/** The fictional user of the local test environment (the same one scripts/seed-local.mjs puts in the families). */
export const LOCAL_TEST_USER = { sub: 'local-test-user', email: 'test@couponvault.local', name: 'משתמש בדיקה' };

export const watchAuth = (cb) => onAuthStateChanged(auth, cb);

/** Google sign-in. Resolves false when the user closed the popup; throws on real errors. */
export async function signInWithGoogle() {
  if (LOCAL) {
    // Test environment: no Google, straight in as the test user (the Auth emulator accepts an unsigned token).
    await signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ ...LOCAL_TEST_USER, email_verified: true })));
    return true;
  }
  try {
    await signInWithPopup(auth, googleProvider);
    return true;
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, googleProvider);
      return true;
    }
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return false;
    throw e;
  }
}

/**
 * Sign out and leave nothing on this device: Firestore keeps an offline copy of the coupons (IndexedDB) so they
 * open without signal; it's stopped and wiped here, then the page reloads with a clean slate.
 */
export async function signOut() {
  const uid = auth.currentUser?.uid;
  await fbSignOut(auth);
  if (uid) forgetLock(uid);
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch (e) {
    console.error('[sign out] could not clear the offline copy', e); // e.g. the app is open in another tab
  }
  window.location.reload();
}
