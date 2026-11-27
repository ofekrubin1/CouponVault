// Test-only helpers (loaded only in `vite --mode emulator`): sign in without the Google popup and seed data.
import { GoogleAuthProvider, signInWithCredential, signOut, updateProfile } from 'firebase/auth';
import { doc, collection, setDoc, getDocs, getDocFromCache } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import * as data from '@/data';

window.__cv = {
  auth,
  db,
  data,
  async login(email, name) {
    // The Auth emulator accepts an unsigned Google ID token.
    const cred = GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, name, email_verified: true }));
    const { user } = await signInWithCredential(auth, cred);
    if (name && user.displayName !== name) await updateProfile(user, { displayName: name });
    return user.uid;
  },
  logout: () => signOut(auth),
  /** Write a coupon with arbitrary fields (status, usages, past expiry, …). Resolves when the server has it. */
  async seedCoupon(familyId, fields) {
    const ref = doc(collection(db, 'families', familyId, 'coupons'));
    await setDoc(ref, {
      code: '', source: '', notes: '', category: '', status: 'active', usages: [], createdBy: auth.currentUser.uid,
      createdByName: auth.currentUser.displayName || '', ...fields,
      balance: fields.balance !== undefined ? fields.balance : fields.type === 'money' ? fields.value : null,
    });
    return ref.id;
  },
  /** Is the coupon's photo saved on this device (Firestore's offline copy)? */
  async photoOnDevice(familyId, couponId) {
    try {
      await getDocFromCache(doc(db, 'families', familyId, 'coupons', couponId, 'media', 'photo'));
      return true;
    } catch {
      return false;
    }
  },
  async serverCoupons(familyId) {
    const snap = await getDocs(collection(db, 'families', familyId, 'coupons'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
};
window.dispatchEvent(new Event('cv-test-ready'));
