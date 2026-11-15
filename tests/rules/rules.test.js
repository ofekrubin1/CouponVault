// Security rules, run against the Firestore emulator (`npm run test:rules`).
import { readFileSync } from 'node:fs';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, setDoc, getDoc, updateDoc, writeBatch, collection, query, where, getDocs, arrayUnion, addDoc, deleteDoc, increment,
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
  // alice owns family f1 with invite AAA111 and one coupon
  const A = db('alice');
  const b = writeBatch(A);
  b.set(doc(A, 'families/f1'), { name: 'F', members: ['alice'], memberInfo: { alice: {} }, inviteCode: 'AAA111' });
  b.set(doc(A, 'invites/AAA111'), { familyId: 'f1' });
  await b.commit();
  await setDoc(doc(A, 'families/f1/coupons/c1'), { title: 'x', type: 'money', value: 200, balance: 200 });
});

const join = (uid, code) =>
  updateDoc(doc(db(uid), 'families/f1'), { members: arrayUnion(uid), [`memberInfo.${uid}`]: {}, lastJoinCode: code });

describe('families', () => {
  it('a user can create a family with only themselves as member', () =>
    assertSucceeds(setDoc(doc(db('bob'), 'families/fb'), { name: 'B', members: ['bob'] })));
  it('cannot create a family that lists someone else', () =>
    assertFails(setDoc(doc(db('bob'), 'families/fx'), { name: 'X', members: ['alice'] })));
  it('a non-member cannot read a family', () => assertFails(getDoc(doc(db('bob'), 'families/f1'))));
  it('signed-out users cannot read anything', () => assertFails(getDoc(doc(db(null), 'families/f1'))));
  it('a member can list their families with array-contains', () =>
    assertSucceeds(getDocs(query(collection(db('alice'), 'families'), where('members', 'array-contains', 'alice')))));
  it('nobody can list all families', () => assertFails(getDocs(collection(db('bob'), 'families'))));
  it('families cannot be deleted', () => assertFails(deleteDoc(doc(db('alice'), 'families/f1'))));
});

describe('invites', () => {
  it('signed-in users can look up a code', () => assertSucceeds(getDoc(doc(db('bob'), 'invites/AAA111'))));
  it('signed-out users cannot', () => assertFails(getDoc(doc(db(null), 'invites/AAA111'))));
  it('nobody can list codes', () => assertFails(getDocs(collection(db('bob'), 'invites'))));
  it('a non-member cannot create a code for a family', () =>
    assertFails(setDoc(doc(db('carol'), 'invites/CCC333'), { familyId: 'f1' })));
  it('a non-member cannot delete a code', () => assertFails(deleteDoc(doc(db('carol'), 'invites/AAA111'))));
  it('a member can rotate the code', async () => {
    const A = db('alice');
    const b = writeBatch(A);
    b.set(doc(A, 'invites/BBB222'), { familyId: 'f1' });
    b.delete(doc(A, 'invites/AAA111'));
    b.update(doc(A, 'families/f1'), { inviteCode: 'BBB222' });
    await assertSucceeds(b.commit());
  });
});

describe('joining', () => {
  it('joining with a wrong code fails', () => assertFails(join('bob', 'ZZZ999')));
  it('joining while changing other fields fails', () =>
    assertFails(updateDoc(doc(db('bob'), 'families/f1'), { members: arrayUnion('bob'), lastJoinCode: 'AAA111', name: 'hacked' })));
  it('cannot add someone else while joining', () =>
    assertFails(updateDoc(doc(db('bob'), 'families/f1'), { members: arrayUnion('mallory'), lastJoinCode: 'AAA111' })));
  it('joining with the right code works and gives access to coupons', async () => {
    await assertSucceeds(join('bob', 'AAA111'));
    await assertSucceeds(getDocs(collection(db('bob'), 'families/f1/coupons')));
  });
  it('re-joining as an existing member is harmless', async () => {
    await join('bob', 'AAA111');
    await assertSucceeds(join('bob', 'AAA111'));
  });
  it('an old code stops working after rotation', async () => {
    const A = db('alice');
    const b = writeBatch(A);
    b.set(doc(A, 'invites/BBB222'), { familyId: 'f1' });
    b.delete(doc(A, 'invites/AAA111'));
    b.update(doc(A, 'families/f1'), { inviteCode: 'BBB222' });
    await b.commit();
    await assertFails(join('carol', 'AAA111'));
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
    await join('bob', 'AAA111');
    await updateDoc(doc(db('alice'), 'families/f1'), { members: ['alice'] });
    await assertFails(getDocs(collection(db('bob'), 'families/f1/coupons')));
  });
});

describe('user settings', () => {
  it('own user doc is readable and writable', () => assertSucceeds(setDoc(doc(db('carol'), 'users/carol'), { currentFamilyId: 'f1' })));
  it("someone else's is not", () => assertFails(getDoc(doc(db('carol'), 'users/alice'))));
});
