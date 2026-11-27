// Fictional users, families and coupons for the local test environment (`npm run local`).
// Writes straight to the emulators started from firebase.local.json; never to production. Fixed ids, so
// running it again resets these records to how they start (coupons you added yourself stay).

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = 'demo-couponvault-local';
const AUTH = 'http://127.0.0.1:9095/identitytoolkit.googleapis.com/v1';
const DB = `http://127.0.0.1:8085/v1/projects/${PROJECT}/databases/(default)/documents`;

// The first one is who "Sign in with Google" signs in as (see LOCAL_TEST_USER in src/services/auth.js).
const USERS = {
  me: { sub: 'local-test-user', email: 'test@couponvault.local', name: 'משתמש בדיקה' },
  dana: { sub: 'local-dana', email: 'dana@couponvault.local', name: 'דנה בדיקה' },
  yossi: { sub: 'local-yossi', email: 'yossi@couponvault.local', name: 'יוסי בדיקה' },
  ronit: { sub: 'local-ronit', email: 'ronit@couponvault.local', name: 'רונית בדיקה' }, // asks to join (see below)
};

async function call(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${init?.method || 'GET'} ${url} → ${res.status} ${await res.text()}`);
  return res.json();
}

/** Signs a test user in on the Auth emulator (creating it the first time) and returns its uid. */
async function ensureUser(u) {
  const idToken = JSON.stringify({ sub: u.sub, email: u.email, name: u.name, email_verified: true });
  const r = await call(`${AUTH}/accounts:signInWithIdp?key=demo-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestUri: 'http://localhost', postBody: `id_token=${encodeURIComponent(idToken)}&providerId=google.com`, returnSecureToken: true }),
  });
  await call(`${AUTH}/accounts:update?key=demo-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: r.idToken, displayName: u.name }),
  });
  return r.localId;
}

/** A JS value in Firestore's REST encoding. */
function enc(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (v instanceof Uint8Array) return { bytesValue: Buffer.from(v).toString('base64') };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } };
  return { stringValue: String(v) };
}

/** Writes a whole document as the emulator's admin ("owner"), past the security rules. */
const put = (path, data) =>
  call(`${DB}/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ fields: enc(data).mapValue.fields }),
  });

/** YYYY-MM-DD, `days` from today (local time). */
function dayIn(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function seedLocal() {
  const uid = {};
  for (const [k, u] of Object.entries(USERS)) uid[k] = await ensureUser(u);
  const info = (k) => ({ name: USERS[k].name, email: USERS[k].email, photo: '' });
  const now = new Date();

  const families = [
    { id: 'fam-test', name: 'משפחת בדיקה', members: ['me', 'dana', 'yossi'], code: 'BDKTEST2', custom: ['בית'] },
    { id: 'fam-friends', name: 'חברים לבדיקה', members: ['me', 'yossi'], code: 'FRNTEST3' },
  ];
  for (const f of families) {
    await put(`families/${f.id}`, {
      name: f.name,
      members: f.members.map((k) => uid[k]),
      memberInfo: Object.fromEntries(f.members.map((k) => [uid[k], info(k)])),
      inviteCode: f.code,
      inviteCreatedAt: now,
      alertDays: 14,
      customCategories: f.custom || [],
      createdBy: uid.me,
      createdAt: now,
    });
    await put(`invites/${f.code}`, { familyId: f.id, familyName: f.name, createdAt: now });
  }
  await put(`users/${uid.me}`, { currentFamilyId: 'fam-test' });
  // a fictional person waiting for a member to let them in (Settings → חברים, and the banner on home)
  await put(`families/fam-test/requests/${uid.ronit}`, { ...info('ronit'), code: 'BDKTEST2', status: 'pending', createdAt: now });
  await put(`users/${uid.ronit}`, { pendingJoin: { familyId: 'fam-test', familyName: 'משפחת בדיקה', at: now.toISOString() } });

  const coupon = (c, by = 'me') => {
    const categories = c.categories || [c.category];
    return {
      title: c.title, store: c.store, categories, category: categories[0] || '',
      type: c.type, format: c.format || 'digital', value: c.value ?? null, expiry: c.expiry ?? null,
      code: c.code || '', cvv: c.cvv || '', source: c.source || '', notes: c.notes || '',
      balance: c.type === 'money' ? c.balance ?? c.value : null,
      status: c.status || 'active', usages: c.usages || [], hasPhoto: !!c.photo,
      ...(c.status === 'used' ? { usedAt: c.usedAt, usedByName: c.usedByName } : {}),
      createdBy: uid[by], createdByName: USERS[by].name, createdAt: now, updatedAt: now,
    };
  };
  const ago = (days) => new Date(now.getTime() - days * 864e5).toISOString();

  const famTest = [
    { title: 'שובר מתנה ליום הולדת', store: 'Buyme', category: 'כללי', type: 'money', value: 400, balance: 250, code: 'BM-48213', expiry: dayIn(3), source: 'מתנה מהעבודה',
      usages: [{ at: ago(6), by: uid.dana, byName: USERS.dana.name, amount: 150 }] },
    { title: 'ארוחת מקרויאל', store: 'מקדונלדס', category: 'אוכל', type: 'product', code: 'MC-77120', expiry: dayIn(9) },
    { title: 'קפה ומאפה', store: 'ארומה', category: 'אוכל', type: 'product', code: 'AR-3301', expiry: dayIn(180) },
    { title: 'ארוחה זוגית', store: 'Food Appeal', category: 'אוכל', type: 'money', value: 300, code: 'FA-99102', cvv: '412', expiry: dayIn(60) },
    { title: 'תו הזהב', store: 'שופרסל', category: 'סופרמרקט', type: 'money', value: 990, code: '8801-5523-14', format: 'physical', expiry: dayIn(40), notes: 'להביא את הכרטיס לקופה', photo: true },
    { title: 'שובר קניות', store: 'רמי לוי', category: 'סופרמרקט', type: 'money', value: 500, code: 'RL-20931', expiry: dayIn(140) },
    { title: '20% הנחה על הכול', store: 'קסטרו', category: 'ביגוד', type: 'percent', value: 20, code: 'CAS20', expiry: dayIn(55) },
    { title: 'בגדי תינוקות', store: 'מיננה', category: 'ביגוד', type: 'money', value: 200, code: 'MN-5521', expiry: dayIn(90) },
    { title: 'דרים קארד מהעבודה', store: 'דרים קארד', category: 'כללי', type: 'money', value: 300, code: '4580 1123 9987', cvv: '731', expiry: dayIn(100) },
    { title: 'אוזניות', store: 'KSP', category: 'כללי', type: 'money', value: 150, code: 'KSP-5510' },
    // "בית" is the family's own category (an old built-in name: it must stay "בית", never turn into כללי)
    { title: 'כלים לבית', store: 'נעמן', category: 'בית', type: 'money', value: 250, code: 'NM-8812', expiry: dayIn(200) },
    { title: 'מצעים', store: 'ורדינון', category: 'בית', type: 'money', value: 180, code: 'VR-1203', expiry: dayIn(75) },
    { title: 'גיפט קארד לקניון', store: 'קניוני עזריאלי', category: 'כללי', type: 'money', value: 500, code: 'AZ-660021', expiry: dayIn(300) },
    { title: 'מתנות קטנות', store: 'Flying Tiger', category: 'כללי', type: 'money', value: 100, code: 'FT-3020', expiry: dayIn(12) },
    // archive: one expired, one used up
    { title: 'סרט זוגי', store: 'הוט סינמה', category: 'כללי', type: 'other', code: 'HC-1180', expiry: dayIn(-5) },
    { title: 'פיצה משפחתית', store: 'דומינוס', category: 'אוכל', type: 'money', value: 120, balance: 0, code: 'DOM-4410', status: 'used', usedAt: ago(3), usedByName: USERS.yossi.name,
      usages: [{ at: ago(3), by: uid.yossi, byName: USERS.yossi.name, amount: 120 }] },
  ];
  const voucherPhoto = new Uint8Array(readFileSync('tests/e2e/fixtures/voucher.jpg'));
  for (const [i, c] of famTest.entries()) {
    const id = `demo-${String(i + 1).padStart(2, '0')}`;
    await put(`families/fam-test/coupons/${id}`, coupon(c, i % 3 === 1 ? 'dana' : 'me'));
    // a voucher photo (with a barcode) on the coupons marked `photo`
    if (c.photo) await put(`families/fam-test/coupons/${id}/media/photo`, { data: voucherPhoto, type: 'image/jpeg', w: 800, h: 560, updatedAt: now });
  }

  const famFriends = [
    { title: 'נעליים', store: 'פוט לוקר', category: 'ביגוד', type: 'money', value: 350, code: 'FL-7710', expiry: dayIn(70) },
    { title: 'ערב בבר', store: 'Buyme', category: 'כללי', type: 'money', value: 200, code: 'BM-90311', expiry: dayIn(30) },
  ];
  for (const [i, c] of famFriends.entries()) await put(`families/fam-friends/coupons/demo-${String(i + 1).padStart(2, '0')}`, coupon(c, 'yossi'));

  return { users: Object.keys(USERS).length, coupons: famTest.length + famFriends.length };
}

// Run directly: node scripts/seed-local.mjs (with the local emulators already running)
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  seedLocal()
    .then((r) => console.log(`seeded ${r.users} test users and ${r.coupons} coupons`))
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
