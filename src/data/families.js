// Families, membership and invite codes.
import { arrayRemove, arrayUnion, collection, deleteDoc, deleteField, doc, getDocFromServer, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { DEFAULT_ALERT_DAYS, INVITE_CODE_LENGTH, INVITE_VALID_DAYS } from '@/domain/constants';
import { makeInviteCode, memberInfoOf } from '@/domain/family';
import { background, liveSnapshot, withTimeout } from './sync';
import { setCurrentFamily, setPendingJoin } from './users';

const familyDoc = (id) => doc(db, 'families', id);
const inviteDoc = (code) => doc(db, 'invites', code);
const requestDoc = (familyId, uid) => doc(db, 'families', familyId, 'requests', uid);
const requestsCol = (familyId) => collection(db, 'families', familyId, 'requests');

/**
 * My families. `synced` is false while a family exists only on this phone (just created, not yet confirmed
 * by the server); listening to its coupons before that would be rejected by the security rules.
 */
export function watchMyFamilies(uid, cb, onError) {
  const q = query(collection(db, 'families'), where('members', 'array-contains', uid));
  // Tests can make this listener lag (like a phone on a slow first connection). Not in production builds.
  if (import.meta.env.MODE === 'emulator' && window.__cvFamiliesDelay) {
    const deliver = cb;
    cb = (list) => setTimeout(() => deliver(list), window.__cvFamiliesDelay);
  }
  return liveSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data(), synced: !d.metadata.hasPendingWrites }))),
    onError,
  );
}

/** Creates the family locally at once (it syncs in the background) and selects it. Returns its id. */
export function createFamily(user, name) {
  const ref = doc(collection(db, 'families'));
  const code = makeInviteCode();
  const batch = writeBatch(db);
  batch.set(ref, {
    name: name.trim(),
    members: [user.uid],
    memberInfo: { [user.uid]: memberInfoOf(user) },
    inviteCode: code,
    inviteCreatedAt: serverTimestamp(),
    alertDays: DEFAULT_ALERT_DAYS,
    customCategories: [],
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });
  batch.set(inviteDoc(code), { familyId: ref.id, familyName: name.trim(), createdAt: serverTimestamp() });
  background(batch.commit(), 'create family');
  setCurrentFamily(user.uid, ref.id);
  return ref.id;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Read a document from the server (never a possibly stale local copy), retrying a slow connection. */
async function readFromServer(ref, attempts = 3) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await withTimeout(getDocFromServer(ref), 8000);
    } catch (e) {
      last = e;
      if (e?.code === 'permission-denied') throw e;
      await sleep(600);
    }
  }
  throw last;
}

/**
 * Ask to join a family with an invite code. A member has to approve (firestore.rules lets nobody add themselves).
 * Resolves { id, name, already } once the request is on the server (already: you're a member anyway), or throws
 * an Error with a Hebrew message.
 */
export async function requestToJoin(user, rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (code.length !== INVITE_CODE_LENGTH) throw new Error(`קוד הזמנה הוא ${INVITE_CODE_LENGTH} תווים`);

  let inv;
  try {
    inv = await readFromServer(inviteDoc(code));
  } catch {
    throw new Error('אין חיבור לאינטרנט. נסה שוב');
  }
  if (!inv.exists()) throw new Error('הקוד לא נמצא. בדוק שהקלדת נכון');
  const { familyId, familyName = '', createdAt } = inv.data();
  if (!createdAt || Date.now() > createdAt.toMillis() + INVITE_VALID_DAYS * 864e5) throw new Error('הקוד כבר לא בתוקף. בקש קוד חדש');

  // Already a member (e.g. a second tap)? Then there's nothing to ask.
  try {
    const mine = await withTimeout(getDocFromServer(familyDoc(familyId)), 8000);
    if (mine.exists()) return { id: familyId, name: mine.data().name, already: true };
  } catch {
    /* not a member (permission denied) or slow: ask */
  }

  try {
    await withTimeout(
      setDoc(requestDoc(familyId, user.uid), { ...memberInfoOf(user), code, status: 'pending', createdAt: serverTimestamp() }),
      15000,
    );
  } catch (e) {
    console.error('[join request]', e);
    throw new Error(e?.code === 'permission-denied' ? 'הקוד כבר לא בתוקף. בקש קוד חדש' : 'שליחת הבקשה נכשלה. נסה שוב');
  }
  setPendingJoin(user.uid, { familyId, familyName, at: new Date().toISOString() });
  return { id: familyId, name: familyName, already: false };
}

/** My own request (to show "waiting" / "approved" / "declined"); cb(null) when there is none. */
export const watchMyRequest = (familyId, uid, cb) =>
  liveSnapshot(requestDoc(familyId, uid), {}, (s) => cb(s.exists() ? s.data() : null), () => cb(null));

/** Withdraw my request (or clear it once it's been answered). */
export function clearMyRequest(familyId, uid) {
  background(deleteDoc(requestDoc(familyId, uid)), 'clear join request');
  setPendingJoin(uid, null);
}

/** Pending join requests of a family (members only). */
export const watchJoinRequests = (familyId, cb) =>
  liveSnapshot(query(requestsCol(familyId), where('status', '==', 'pending')), {}, (snap) => cb(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))), () => cb([]));

/** A member lets them in: added to the family, and their request marked approved (they see it and clean up). */
export function approveRequest(familyId, req) {
  const batch = writeBatch(db);
  batch.update(familyDoc(familyId), { members: arrayUnion(req.uid), [`memberInfo.${req.uid}`]: { name: req.name || 'משתמש', email: req.email || '', photo: req.photo || '' } });
  batch.update(requestDoc(familyId, req.uid), { status: 'approved' });
  background(batch.commit(), 'approve join request');
}

export const declineRequest = (familyId, uid) => background(updateDoc(requestDoc(familyId, uid), { status: 'declined' }), 'decline join request');

export const updateFamily = (familyId, data) => background(updateDoc(familyDoc(familyId), data), 'update family');

export const renameFamily = (familyId, name) => updateFamily(familyId, { name: name.trim() });
export const addCategory = (familyId, name) => updateFamily(familyId, { customCategories: arrayUnion(name) });
export const removeCategory = (familyId, name) => updateFamily(familyId, { customCategories: arrayRemove(name) });

export function regenerateInvite(family) {
  const code = makeInviteCode();
  const batch = writeBatch(db);
  batch.set(inviteDoc(code), { familyId: family.id, familyName: family.name, createdAt: serverTimestamp() });
  if (family.inviteCode) batch.delete(inviteDoc(family.inviteCode));
  batch.update(familyDoc(family.id), { inviteCode: code, inviteCreatedAt: serverTimestamp() });
  background(batch.commit(), 'regenerate invite');
  return code;
}

export const removeMember = (familyId, uid) =>
  background(updateDoc(familyDoc(familyId), { members: arrayRemove(uid), [`memberInfo.${uid}`]: deleteField() }), 'remove member');
