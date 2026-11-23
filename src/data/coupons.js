// Coupons of a family and the writes that change them. The rules (how much is left, when a voucher is used
// up) come from domain/coupon.js; this file only turns them into Firestore writes.
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { balanceAfterUndo, isMoney, planRedemption } from '@/domain/coupon';
import { background, docsOf, liveSnapshot } from './sync';

const couponsCol = (familyId) => collection(db, 'families', familyId, 'coupons');
const couponDoc = (familyId, id) => doc(db, 'families', familyId, 'coupons', id);

export const watchCoupons = (familyId, cb, onError) => liveSnapshot(couponsCol(familyId), {}, (snap) => cb(docsOf(snap)), onError);

/** Returns the new coupon's id right away. */
export function addCoupon(familyId, user, data) {
  const ref = doc(couponsCol(familyId));
  background(
    setDoc(ref, {
      ...data,
      balance: data.type === 'money' ? data.value : null,
      status: 'active',
      usages: [],
      createdBy: user.uid,
      createdByName: user.displayName || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    'add coupon',
  );
  return ref.id;
}

export const updateCoupon = (familyId, id, data) =>
  background(updateDoc(couponDoc(familyId, id), { ...data, updatedAt: serverTimestamp() }), 'update coupon');

export const deleteCoupon = (familyId, id) => background(deleteDoc(couponDoc(familyId, id)), 'delete coupon');

/**
 * Redeem (amount = null means "used it all"). Balance changes use increment() and the history arrayUnion(),
 * so two family members redeeming at the same time (or offline) don't overwrite each other.
 * Returns the plan ({ left, finished } or { error }).
 */
export function redeemCoupon(familyId, user, coupon, amount = null) {
  const plan = planRedemption(coupon, amount);
  if (plan.error) return plan;
  const usage = { at: new Date().toISOString(), by: user.uid, byName: user.displayName || '', amount: plan.spend };
  updateCoupon(familyId, coupon.id, {
    usages: arrayUnion(usage),
    ...(isMoney(coupon) ? { balance: increment(-plan.spend) } : {}),
    ...(plan.finished ? { status: 'used', usedAt: usage.at, usedByName: usage.byName } : {}),
  });
  return plan;
}

/** Undo the most recent usage: puts the amount back (up to the face value) and reactivates the coupon. */
export function undoLastUsage(familyId, coupon) {
  const usages = coupon.usages || [];
  const last = usages[usages.length - 1];
  if (!last) return;
  updateCoupon(familyId, coupon.id, {
    usages: arrayRemove(last),
    status: 'active',
    usedAt: null,
    usedByName: null,
    ...(isMoney(coupon) ? { balance: balanceAfterUndo(coupon) } : {}),
  });
}

export const restoreCoupon = (familyId, coupon) =>
  updateCoupon(familyId, coupon.id, {
    status: 'active',
    usedAt: null,
    usedByName: null,
    ...(isMoney(coupon) && !(coupon.balance > 0) ? { balance: coupon.value } : {}),
  });
