import {
  collection, doc, getDoc, onSnapshot, query, where, writeBatch, updateDoc, setDoc, deleteDoc,
  serverTimestamp, arrayRemove, arrayUnion, deleteField, increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_ALERT_DAYS } from './constants';
import { makeInviteCode, round2 } from './lib';

// Firestore resolves a write only once the server confirms it. On a phone with weak signal (or a stalled
// connection on iOS) that can take forever, so screens never wait for it: the change shows up locally at
// once and syncs in the background. A write the server rejects is reported through the error reporter.
let reportError = (message) => console.error(message);
export const setErrorReporter = (fn) => {
  reportError = fn;
};

export function errorMessage(err) {
  switch (err?.code) {
    case 'permission-denied':
      return 'אין הרשאה לפעולה הזו';
    case 'unavailable':
    case 'deadline-exceeded':
      return 'אין חיבור לאינטרנט. נסה שוב';
    default:
      return 'הפעולה נכשלה. נסה שוב';
  }
}

const background = (promise, what) => {
  promise.catch((err) => {
    console.error(`[${what}]`, err);
    reportError(errorMessage(err));
  });
};

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'deadline-exceeded' })), ms)),
  ]);

const memberInfoOf = (user) => ({
  name: user.displayName || user.email || 'משתמש',
  email: user.email || '',
  photo: user.photoURL || '',
});

/**
 * onSnapshot that survives errors. A Firestore listener dies on its first error (e.g. a permission error in
 * the moment between joining a family and the server knowing about it), and a dead listener means a screen
 * that silently stops updating. This one re-subscribes with backoff until it's unsubscribed.
 */
function liveSnapshot(target, options, onNext, onFirstError) {
  let unsub = () => {};
  let stopped = false;
  let timer = 0;
  let delay = 1000;
  let reported = false;
  const start = () => {
    unsub = onSnapshot(
      target,
      options,
      (snap) => {
        delay = 1000;
        onNext(snap);
      },
      (err) => {
        console.warn('[listener] retrying after', err.code || err);
        if (!reported) {
          reported = true;
          onFirstError?.(err);
        }
        if (stopped) return;
        timer = setTimeout(() => !stopped && start(), delay);
        delay = Math.min(delay * 2, 30000);
      },
    );
  };
  start();
  return () => {
    stopped = true;
    clearTimeout(timer);
    unsub();
  };
}

// ---------- user settings ----------
export const watchUserDoc = (uid, cb) =>
  liveSnapshot(doc(db, 'users', uid), {}, (s) => cb(s.exists() ? s.data() : {}), () => cb({}));

export const setCurrentFamily = (uid, familyId) =>
  background(setDoc(doc(db, 'users', uid), { currentFamilyId: familyId }, { merge: true }), 'set current family');

// ---------- families ----------
/**
 * My families. `synced` is false while a family exists only on this phone (just created, not yet confirmed
 * by the server); listening to its coupons before that would be rejected by the security rules.
 */
export function watchMyFamilies(uid, cb, onError) {
  const q = query(collection(db, 'families'), where('members', 'array-contains', uid));
  return liveSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data(), synced: !d.metadata.hasPendingWrites }))),
    onError,
  );
}

/** Creates the family locally at once (it syncs in the background) and selects it. Returns its id. */
export function createFamily(user, name) {
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
  background(batch.commit(), 'create family');
  setCurrentFamily(user.uid, famRef.id);
  return famRef.id;
}

/**
 * Looks the code up (needs a connection) and asks to join. Returns the family id; the family shows up in
 * watchMyFamilies once the server accepts (the caller then selects it). Throws Error with a Hebrew message
 * when the code is unknown.
 */
export async function joinFamily(user, rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (code.length !== 6) throw new Error('קוד הזמנה הוא 6 תווים');
  let inv;
  try {
    inv = await withTimeout(getDoc(doc(db, 'invites', code)), 10000);
  } catch {
    throw new Error('אין חיבור לאינטרנט. נסה שוב');
  }
  if (!inv.exists()) throw new Error('הקוד לא נמצא. בדוק שהקלדת נכון');
  const familyId = inv.data().familyId;
  // A non-member can't read the family, so the update is built blindly; the rules check that it only
  // appends us and that the code is valid.
  background(
    updateDoc(doc(db, 'families', familyId), {
      members: arrayUnion(user.uid),
      [`memberInfo.${user.uid}`]: memberInfoOf(user),
      lastJoinCode: code,
    }),
    'join family',
  );
  return familyId;
}

export const updateFamily = (familyId, data) =>
  background(updateDoc(doc(db, 'families', familyId), data), 'update family');

export function regenerateInvite(family) {
  const code = makeInviteCode();
  const batch = writeBatch(db);
  batch.set(doc(db, 'invites', code), { familyId: family.id });
  if (family.inviteCode) batch.delete(doc(db, 'invites', family.inviteCode));
  batch.update(doc(db, 'families', family.id), { inviteCode: code });
  background(batch.commit(), 'regenerate invite');
  return code;
}

export const removeMember = (familyId, uid) =>
  background(
    updateDoc(doc(db, 'families', familyId), {
      members: arrayRemove(uid),
      [`memberInfo.${uid}`]: deleteField(),
    }),
    'remove member',
  );

// ---------- coupons ----------
const couponsCol = (familyId) => collection(db, 'families', familyId, 'coupons');
const couponDoc = (familyId, id) => doc(db, 'families', familyId, 'coupons', id);

export const watchCoupons = (familyId, cb, onError) =>
  liveSnapshot(couponsCol(familyId), {}, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);

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
 * amount = null means "used it all". Balance changes use increment() and the history arrayUnion(), so two
 * family members redeeming at the same time (or offline) don't overwrite each other.
 */
export function redeemCoupon(familyId, user, coupon, amount) {
  const isMoney = coupon.type === 'money';
  const spend = isMoney ? (amount ?? coupon.balance ?? 0) : null;
  const usage = { at: new Date().toISOString(), by: user.uid, byName: user.displayName || '', amount: spend };
  const left = isMoney ? round2((coupon.balance ?? 0) - spend) : 0;
  const finished = !isMoney || amount == null || left <= 0;
  updateCoupon(familyId, coupon.id, {
    usages: arrayUnion(usage),
    ...(isMoney ? { balance: increment(-spend) } : {}),
    ...(finished ? { status: 'used', usedAt: usage.at, usedByName: usage.byName } : {}),
  });
  return { left, finished };
}

/** Undo the most recent usage: puts the amount back and reactivates the coupon. */
export function undoLastUsage(familyId, coupon) {
  const usages = coupon.usages || [];
  const last = usages[usages.length - 1];
  if (!last) return;
  updateCoupon(familyId, coupon.id, {
    usages: arrayRemove(last),
    status: 'active',
    usedAt: null,
    usedByName: null,
    ...(coupon.type === 'money' ? { balance: increment(Number(last.amount) || 0) } : {}),
  });
}

export const restoreCoupon = (familyId, coupon) =>
  updateCoupon(familyId, coupon.id, {
    status: 'active',
    usedAt: null,
    usedByName: null,
    ...(coupon.type === 'money' && !(coupon.balance > 0) ? { balance: coupon.value } : {}),
  });
