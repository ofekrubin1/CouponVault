// Security rules, run against the Firestore emulator (`npm run test:rules`).
import { readFileSync } from 'node:fs';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, setDoc, getDoc, updateDoc, writeBatch, collection, query, where, getDocs, arrayUnion, addDoc, deleteDoc, increment,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';

let env;
const db = (uid) => (uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore());

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-couponvault',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  // alice owns family f1 with invite AAA11111 (fresh) and one coupon; OLD22222 is 8 days old
  const A = db('alice');
  const b = writeBatch(A);
  b.set(doc(A, 'families/f1'), { name: 'F', members: ['alice'], memberInfo: { alice: {} }, inviteCode: 'AAA11111' });
  b.set(doc(A, 'invites/AAA11111'), { familyId: 'f1', familyName: 'F', createdAt: serverTimestamp() });
  await b.commit();
  await env.withSecurityRulesDisabled((ctx) =>
    setDoc(doc(ctx.firestore(), 'invites/OLD22222'), { familyId: 'f1', familyName: 'F', createdAt: Timestamp.fromMillis(Date.now() - 8 * 864e5) }),
  );
  await setDoc(doc(A, 'families/f1/coupons/c1'), { title: 'x', type: 'money', value: 200, balance: 200 });
});

const request = (uid, code, extra = {}) =>
  setDoc(doc(db(uid), `families/f1/requests/${uid}`), { name: uid, email: '', photo: '', code, status: 'pending', createdAt: serverTimestamp(), ...extra });
const selfJoin = (uid, code) =>
  updateDoc(doc(db(uid), 'families/f1'), { members: arrayUnion(uid), [`memberInfo.${uid}`]: {}, lastJoinCode: code });
const approve = (memberUid, uid) => {
  const M = db(memberUid);
  const w = writeBatch(M);
  w.update(doc(M, 'families/f1'), { members: arrayUnion(uid), [`memberInfo.${uid}`]: {} });
  w.update(doc(M, `families/f1/requests/${uid}`), { status: 'approved' });
  return w.commit();
};
const rotate = async () => {
  const A = db('alice');
  const b = writeBatch(A);
  b.set(doc(A, 'invites/BBB22222'), { familyId: 'f1', familyName: 'F', createdAt: serverTimestamp() });
  b.delete(doc(A, 'invites/AAA11111'));
  b.update(doc(A, 'families/f1'), { inviteCode: 'BBB22222' });
  return b.commit();
};

describe('invites', () => {
  it('signed-in users can look up a code', () => assertSucceeds(getDoc(doc(db('bob'), 'invites/AAA11111'))));
  it('signed-out users cannot', () => assertFails(getDoc(doc(db(null), 'invites/AAA11111'))));
  it('nobody can list codes', () => assertFails(getDocs(collection(db('bob'), 'invites'))));
  it('a non-member cannot create a code for a family', () =>
    assertFails(setDoc(doc(db('carol'), 'invites/CCC33333'), { familyId: 'f1', familyName: 'F', createdAt: serverTimestamp() })));
  it('a non-member cannot delete a code', () => assertFails(deleteDoc(doc(db('carol'), 'invites/AAA11111'))));
  it('a member can rotate the code', () => assertSucceeds(rotate()));
  it('a code must carry the real server time (no dating it ahead) and be 8 characters', async () => {
    const A = db('alice');
    await assertFails(setDoc(doc(A, 'invites/DDD44444'), { familyId: 'f1', familyName: 'F', createdAt: Timestamp.fromMillis(Date.now() + 365 * 864e5) }));
    await assertFails(setDoc(doc(A, 'invites/EEE555'), { familyId: 'f1', familyName: 'F', createdAt: serverTimestamp() }));
  });
});

describe('joining needs a member to approve', () => {
  it('nobody can add themselves to a family any more, not even with a valid code', () => assertFails(selfJoin('bob', 'AAA11111')));
  it('with a valid code you can ask to join', () => assertSucceeds(request('bob', 'AAA11111')));
  it('a wrong or expired (7+ days) code cannot be used to ask', async () => {
    await assertFails(request('bob', 'ZZZZ9999'));
    await assertFails(request('bob', 'OLD22222'));
  });
  it('you can only ask for yourself, only as pending, with only the expected fields', async () => {
    await assertFails(setDoc(doc(db('bob'), 'families/f1/requests/mallory'), { name: 'm', email: '', photo: '', code: 'AAA11111', status: 'pending', createdAt: serverTimestamp() }));
    await assertFails(request('bob', 'AAA11111', { status: 'approved' }));
    await assertFails(request('bob', 'AAA11111', { admin: true }));
  });
  it('the asker sees their own request; nobody outside the family sees others', async () => {
    await request('bob', 'AAA11111');
    await assertSucceeds(getDoc(doc(db('bob'), 'families/f1/requests/bob')));
    await assertFails(getDoc(doc(db('carol'), 'families/f1/requests/bob')));
    await assertFails(getDocs(collection(db('bob'), 'families/f1/requests')));
  });
  it('the asker cannot approve themselves', async () => {
    await request('bob', 'AAA11111');
    await assertFails(updateDoc(doc(db('bob'), 'families/f1/requests/bob'), { status: 'approved' }));
    await assertFails(approve('bob', 'bob'));
  });
  it('a member lists the requests and approves: the asker then reads the coupons', async () => {
    await request('bob', 'AAA11111');
    await assertSucceeds(getDocs(query(collection(db('alice'), 'families/f1/requests'), where('status', '==', 'pending'))));
    await assertSucceeds(approve('alice', 'bob'));
    await assertSucceeds(getDocs(collection(db('bob'), 'families/f1/coupons')));
  });
  it('a member can decline (status only) and the asker can withdraw', async () => {
    await request('bob', 'AAA11111');
    await assertFails(updateDoc(doc(db('alice'), 'families/f1/requests/bob'), { status: 'declined', code: 'X' }));
    await assertSucceeds(updateDoc(doc(db('alice'), 'families/f1/requests/bob'), { status: 'declined' }));
    await assertSucceeds(deleteDoc(doc(db('bob'), 'families/f1/requests/bob')));
  });
  it('an old code stops working after rotation; the new one works', async () => {
    await rotate();
    await assertFails(request('carol', 'AAA11111'));
    await assertSucceeds(request('carol', 'BBB22222'));
  });
});

describe('coupons', () => {
  it('a non-member cannot read coupons', () => assertFails(getDocs(collection(db('bob'), 'families/f1/coupons'))));
  it('a non-member cannot add a coupon', () => assertFails(addDoc(collection(db('bob'), 'families/f1/coupons'), { title: 'spam' })));
  it('a non-member cannot change a coupon', () => assertFails(updateDoc(doc(db('bob'), 'families/f1/coupons/c1'), { balance: 0 })));
  it('a member can redeem with increment/arrayUnion', () =>
    assertSucceeds(updateDoc(doc(db('alice'), 'families/f1/coupons/c1'), { balance: increment(-80), usages: arrayUnion({ amount: 80 }) })));
  it('a member can delete a coupon', () => assertSucceeds(deleteDoc(doc(db('alice'), 'families/f1/coupons/c1'))));
  it('a removed member loses access', async () => {
    await request('bob', 'AAA11111');
    await approve('alice', 'bob');
    await updateDoc(doc(db('alice'), 'families/f1'), { members: ['alice'] });
    await assertFails(getDocs(collection(db('bob'), 'families/f1/coupons')));
  });
});

describe('user settings', () => {
  it('own user doc is readable and writable', () => assertSucceeds(setDoc(doc(db('carol'), 'users/carol'), { currentFamilyId: 'f1' })));
  it("someone else's is not", () => assertFails(getDoc(doc(db('carol'), 'users/alice'))));
});
