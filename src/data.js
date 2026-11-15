import {
  collection, doc, getDoc, onSnapshot, query, where, writeBatch, updateDoc, setDoc,
  addDoc, deleteDoc, serverTimestamp, arrayRemove, arrayUnion, deleteField,
} from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_ALERT_DAYS } from './constants';
import { makeInviteCode } from './lib';

const memberInfoOf = (user) => ({
  name: user.displayName || user.email || 'משתמש',
  email: user.email || '',
  photo: user.photoURL || '',
});

// ---------- user settings ----------
export const watchUserDoc = (uid, cb) =>
  onSnapshot(doc(db, 'users', uid), (s) => cb(s.exists() ? s.data() : {}), () => cb({}));

export const setCurrentFamily = (uid, familyId) =>
  setDoc(doc(db, 'users', uid), { currentFamilyId: familyId }, { merge: true });

// ---------- families ----------
export function watchMyFamilies(uid, cb, onError) {
  const q = query(collection(db, 'families'), where('members', 'array-contains', uid));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export async function createFamily(user, name) {
  const famRef = doc(collection(db, 'families'));
  const code = makeInviteCode();
  const batch = writeBatch(db);
  batch.set(famRef, {
    name: name.trim(),
    members: [user.uid],
    memberInfo: { [user.uid]: memberInfoOf(user) },
    inviteCode: code,
    alertDays: DEFAULT_ALERT_DAYS,
    customCategories: [],
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'invites', code), { familyId: famRef.id });
  await batch.commit();
  await setCurrentFamily(user.uid, famRef.id);
  return famRef.id;
}

/** Returns the joined familyId, or throws Error with a Hebrew message. */
export async function joinFamily(user, rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (!code) throw new Error('יש להזין קוד');
  let inv;
  try {
    inv = await getDoc(doc(db, 'invites', code));
  } catch {
    throw new Error('אין חיבור. נסה שוב.');
  }
  if (!inv.exists()) throw new Error('קוד לא נמצא. בדוק שהקלדת נכון.');
  const familyId = inv.data().familyId;
  try {
    // A non-member can't read the family doc, so the update is built blindly.
    // The rules check that it only appends us and that the code is valid.
    await updateDoc(doc(db, 'families', familyId), {
      members: arrayUnion(user.uid),
      [`memberInfo.${user.uid}`]: memberInfoOf(user),
      lastJoinCode: code,
    });
  } catch {
    throw new Error('ההצטרפות נכשלה. ייתכן שהקוד הוחלף.');
  }
  await setCurrentFamily(user.uid, familyId);
  return familyId;
}

export const updateFamily = (familyId, data) => updateDoc(doc(db, 'families', familyId), data);

export async function regenerateInvite(family) {
  const code = makeInviteCode();
  const batch = writeBatch(db);
  batch.set(doc(db, 'invites', code), { familyId: family.id });
  if (family.inviteCode) batch.delete(doc(db, 'invites', family.inviteCode));
  batch.update(doc(db, 'families', family.id), { inviteCode: code });
  await batch.commit();
}

export const removeMember = (familyId, uid) =>
  updateDoc(doc(db, 'families', familyId), {
    members: arrayRemove(uid),
    [`memberInfo.${uid}`]: deleteField(),
  });

// ---------- coupons ----------
const couponsCol = (familyId) => collection(db, 'families', familyId, 'coupons');
const couponDoc = (familyId, id) => doc(db, 'families', familyId, 'coupons', id);

export const watchCoupons = (familyId, cb, onError) =>
  onSnapshot(couponsCol(familyId), (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);

export const addCoupon = (familyId, user, data) =>
  addDoc(couponsCol(familyId), {
    ...data,
    balance: data.type === 'money' ? data.value : null,
    status: 'active',
    usages: [],
    createdBy: user.uid,
    createdByName: user.displayName || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const updateCoupon = (familyId, id, data) =>
  updateDoc(couponDoc(familyId, id), { ...data, updatedAt: serverTimestamp() });

export const deleteCoupon = (familyId, id) => deleteDoc(couponDoc(familyId, id));

const round2 = (n) => Math.round(n * 100) / 100;

/** amount = null means "used it all". */
export function redeemCoupon(familyId, user, coupon, amount) {
  const usage = {
    at: new Date().toISOString(),
    by: user.uid,
    byName: user.displayName || '',
    amount: amount ?? (coupon.type === 'money' ? coupon.balance : null),
  };
  const usages = [...(coupon.usages || []), usage];
  const done = { status: 'used', usedAt: usage.at, usedByName: usage.byName };

  if (amount != null && coupon.type === 'money') {
    const balance = Math.max(0, round2(coupon.balance - amount));
    return updateCoupon(familyId, coupon.id, { balance, usages, ...(balance === 0 ? done : {}) });
  }
  return updateCoupon(familyId, coupon.id, {
    usages,
    ...done,
    ...(coupon.type === 'money' ? { balance: 0 } : {}),
  });
}

/** Undo the most recent usage (restores the balance and reactivates). */
export function undoLastUsage(familyId, coupon) {
  const usages = [...(coupon.usages || [])];
  const last = usages.pop();
  if (!last) return Promise.resolve();
  const patch = { usages, status: 'active', usedAt: null, usedByName: null };
  if (coupon.type === 'money') patch.balance = round2((coupon.balance || 0) + (last.amount || 0));
  return updateCoupon(familyId, coupon.id, patch);
}

export const restoreCoupon = (familyId, coupon) =>
  updateCoupon(familyId, coupon.id, {
    status: 'active',
    usedAt: null,
    usedByName: null,
    ...(coupon.type === 'money' && !coupon.balance ? { balance: coupon.value } : {}),
  });
