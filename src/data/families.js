// Families, membership and invite codes.
import { arrayRemove, arrayUnion, collection, deleteField, doc, getDocFromServer, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { DEFAULT_ALERT_DAYS, INVITE_CODE_LENGTH } from '@/domain/constants';
import { makeInviteCode, memberInfoOf } from '@/domain/family';
import { background, liveSnapshot, withTimeout } from './sync';
import { setCurrentFamily } from './users';

const familyDoc = (id) => doc(db, 'families', id);
const inviteDoc = (code) => doc(db, 'invites', code);

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
    alertDays: DEFAULT_ALERT_DAYS,
    customCategories: [],
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  });
  batch.set(inviteDoc(code), { familyId: ref.id });
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

const JOIN_CONFIRM_MS = 30000;

/**
 * Join a family with an invite code. Resolves { id, name } once the server has really added us, or throws an
 * Error with a Hebrew message. Doesn't depend on the families listener (which can lag on a cold start); it
 * asks the server directly: as soon as we're a member we're allowed to read the family.
 */
export async function joinFamily(user, rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (code.length !== INVITE_CODE_LENGTH) throw new Error('קוד הזמנה הוא 6 תווים');

  let inv;
  try {
    inv = await readFromServer(inviteDoc(code));
  } catch {
    throw new Error('אין חיבור לאינטרנט. נסה שוב');
  }
  if (!inv.exists()) throw new Error('הקוד לא נמצא. בדוק שהקלדת נכון');
  const { familyId } = inv.data();
  const ref = familyDoc(familyId);

  // Already a member (e.g. a second tap)? Then there's nothing to write.
  try {
    const mine = await withTimeout(getDocFromServer(ref), 8000);
    if (mine.exists()) return { id: familyId, name: mine.data().name };
  } catch {
    /* not a member yet (permission denied) or slow: go on and join */
  }

  // A non-member can't read the family, so the update is built blindly; the rules check that it only
  // appends us and that the code is valid.
  let rejected = null;
  updateDoc(ref, { members: arrayUnion(user.uid), [`memberInfo.${user.uid}`]: memberInfoOf(user), lastJoinCode: code }).catch((e) => {
    rejected = e;
  });

  const deadline = Date.now() + JOIN_CONFIRM_MS;
  while (Date.now() < deadline) {
    if (rejected) {
      console.error('[join family]', rejected);
      throw new Error(rejected.code === 'permission-denied' ? 'הקוד כבר לא בתוקף. בקש קוד חדש' : 'ההצטרפות נכשלה. נסה שוב');
    }
    try {
      const snap = await withTimeout(getDocFromServer(ref), 8000);
      if (snap.exists()) return { id: familyId, name: snap.data().name };
    } catch {
      /* not accepted yet: keep checking */
    }
    await sleep(700);
  }
  throw new Error('החיבור איטי. ההצטרפות תושלם לבד כשהחיבור ישתפר');
}

export const updateFamily = (familyId, data) => background(updateDoc(familyDoc(familyId), data), 'update family');

export const renameFamily = (familyId, name) => updateFamily(familyId, { name: name.trim() });
export const setAlertDays = (familyId, days) => updateFamily(familyId, { alertDays: days });
export const addCategory = (familyId, name) => updateFamily(familyId, { customCategories: arrayUnion(name) });
export const removeCategory = (familyId, name) => updateFamily(familyId, { customCategories: arrayRemove(name) });

export function regenerateInvite(family) {
  const code = makeInviteCode();
  const batch = writeBatch(db);
  batch.set(inviteDoc(code), { familyId: family.id });
  if (family.inviteCode) batch.delete(inviteDoc(family.inviteCode));
  batch.update(familyDoc(family.id), { inviteCode: code });
  background(batch.commit(), 'regenerate invite');
  return code;
}

export const removeMember = (familyId, uid) =>
  background(updateDoc(familyDoc(familyId), { members: arrayRemove(uid), [`memberInfo.${uid}`]: deleteField() }), 'remove member');
