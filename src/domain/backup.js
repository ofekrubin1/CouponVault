// The backup file: every family of the user and all their coupons (archived ones too), as plain JSON.
// Pure functions; reading the data and saving the file happen elsewhere.
import { membersOf } from './family';

export const BACKUP_VERSION = 1;

/** Firestore values → plain JSON (timestamps become ISO dates). */
function plain(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]));
  return v;
}

export function buildBackup({ user, families, couponsByFamily, now = new Date() }) {
  return {
    app: 'CouponVault',
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    exportedBy: { name: user.displayName || '', email: user.email || '' },
    families: families.map((f) => ({
      id: f.id,
      name: f.name,
      members: membersOf(f).map(({ name, email }) => ({ name, email: email || '' })),
      customCategories: f.customCategories || [],
      alertDays: f.alertDays ?? null,
      coupons: (couponsByFamily[f.id] || []).map(plain),
    })),
  };
}

/**
 * The file's text: readable JSON, starting with the UTF-8 byte-order mark. Without it Notepad, Excel and
 * browsers opening a local file may not read it as UTF-8, and the Hebrew shows as gibberish.
 * (Reading it back: drop a leading "﻿" before JSON.parse.)
 */
export const backupText = (backup) => `﻿${JSON.stringify(backup, null, 2)}`;

const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const backupFileName = (now = new Date()) => `couponvault-backup-${isoDay(now)}.json`;
