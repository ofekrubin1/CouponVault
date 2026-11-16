// Per-user settings (which family is selected).
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { background, liveSnapshot } from './sync';

const userDoc = (uid) => doc(db, 'users', uid);

export const watchUserDoc = (uid, cb) => liveSnapshot(userDoc(uid), {}, (s) => cb(s.exists() ? s.data() : {}), () => cb({}));

export const setCurrentFamily = (uid, familyId) =>
  background(setDoc(userDoc(uid), { currentFamilyId: familyId }, { merge: true }), 'set current family');
