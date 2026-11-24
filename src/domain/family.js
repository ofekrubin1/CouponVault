// Families and invites. Pure functions.
import { DEFAULT_ALERT_DAYS, DEFAULT_CATEGORIES, INVITE_CODE_LENGTH, INVITE_VALID_DAYS } from './constants';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

export function makeInviteCode() {
  let s = '';
  for (const n of crypto.getRandomValues(new Uint32Array(INVITE_CODE_LENGTH))) s += INVITE_ALPHABET[n % INVITE_ALPHABET.length];
  return s;
}

/** What a user typed → a clean code (upper case, letters/digits only). */
export const normalizeInviteCode = (raw) => raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, INVITE_CODE_LENGTH);

const toDate = (t) => (t && typeof t.toDate === 'function' ? t.toDate() : t ? new Date(t) : null);

/** When the family's invite code stops working (null while a just-made code waits for the server's time). */
export function inviteExpiry(family) {
  const made = toDate(family.inviteCreatedAt);
  return made ? new Date(made.getTime() + INVITE_VALID_DAYS * 864e5) : null;
}

/** True once the code no longer works: 7 days old, or a code from before codes had a date (6 characters). */
export function isInviteExpired(family, now = new Date()) {
  if ((family.inviteCode || '').length !== INVITE_CODE_LENGTH) return true;
  const until = inviteExpiry(family);
  if (until) return now > until;
  return family.inviteCreatedAt !== null; // null: just made, the server's time is on its way; missing: an undated code
}

export const joinLink = (origin, code) => `${origin}/?join=${code}`;

export const inviteMessage = (family, origin) =>
  `מצטרפים למשפחת הקופונים "${family.name}" ב-CouponVault.\nקוד הזמנה: ${family.inviteCode}\n${joinLink(origin, family.inviteCode)}`;

/** Default + the family's own categories (exactly as the family named them), without duplicates. */
export const familyCategories = (family) => [...new Set([...DEFAULT_CATEGORIES, ...(family.customCategories || [])])];

export const membersOf = (family) => family.members.map((uid) => ({ uid, ...(family.memberInfo?.[uid] || { name: 'משתמש' }) }));

export const memberInfoOf = (user) => ({
  name: user.displayName || user.email || 'משתמש',
  email: user.email || '',
  photo: user.photoURL || '',
});

/**
 * How many days before expiry a coupon counts as "about to expire" for this user: their own setting, else the
 * family's (the setting used to be shared), else the default.
 */
export const alertDaysFor = (userDoc, family) => userDoc?.alertDays ?? family?.alertDays ?? DEFAULT_ALERT_DAYS;

/** The family to show: the selected one, else the first. */
export const pickCurrentFamily = (families, currentId) => families.find((f) => f.id === currentId) || families[0];
