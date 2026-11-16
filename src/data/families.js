// Families, membership and invite codes.
import { arrayRemove, arrayUnion, collection, deleteField, doc, getDoc, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
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

/**
 * Looks the code up (needs a connection) and asks to join. Returns the family id; the family shows up in
 * watchMyFamilies once the server accepts (the caller then selects it). Throws Error with a Hebrew message
 * when the code is unknown.
 */
export async function joinFamily(user, rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (code.length !== INVITE_CODE_LENGTH) throw new Error('קוד הזמנה הוא 6 תווים');
  let inv;
  try {
    inv = await withTimeout(getDoc(inviteDoc(code)), 10000);
  } catch {
    throw new Error('אין חיבור לאינטרנט. נסה שוב');
  }
  if (!inv.exists()) throw new Error('הקוד לא נמצא. בדוק שהקלדת נכון');
  const { familyId } = inv.data();
  // A non-member can't read the family, so the update is built blindly; the rules check that it only
  // appends us and that the code is valid.
  background(
    updateDoc(familyDoc(familyId), {
      members: arrayUnion(user.uid),
      [`memberInfo.${user.uid}`]: memberInfoOf(user),
      lastJoinCode: code,
    }),
    'join family',
  );
  return familyId;
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
