// Sign-in / sign-out. Screens use these instead of calling Firebase Auth directly.
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut as fbSignOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export const watchAuth = (cb) => onAuthStateChanged(auth, cb);

/** Google sign-in. Resolves false when the user closed the popup; throws on real errors. */
export async function signInWithGoogle() {
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

export const signOut = () => fbSignOut(auth);
