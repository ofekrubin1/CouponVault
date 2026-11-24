// Per-user settings (which family is selected).
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { background, liveSnapshot } from './sync';

const userDoc = (uid) => doc(db, 'users', uid);

export const watchUserDoc = (uid, cb) => liveSnapshot(userDoc(uid), {}, (s) => cb(s.exists() ? s.data() : {}), () => cb({}));

/** Personal expiry-alert setting (each family member chooses their own). */
export const setMyAlertDays = (uid, days) =>
  background(setDoc(userDoc(uid), { alertDays: days }, { merge: true }), 'set alert days');

export const setCurrentFamily = (uid, familyId) =>
  background(setDoc(userDoc(uid), { currentFamilyId: familyId }, { merge: true }), 'set current family');

/** The family I asked to join and am waiting for (null when none). One at a time. */
export const setPendingJoin = (uid, pending) =>
  background(setDoc(userDoc(uid), { pendingJoin: pending }, { merge: true }), 'set pending join');
