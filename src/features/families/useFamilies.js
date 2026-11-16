import { useEffect, useRef, useState } from 'react';
import { watchMyFamilies, watchUserDoc } from '@/data';
import { alertDaysFor, pickCurrentFamily } from '@/domain/family';

/**
 * The user's families and the selected one.
 * Returns { loading, families, family, ready, alertDays } — `ready` once the server has confirmed the selected family
 * (a brand-new family is local-only for a moment, and listening to its coupons then would be rejected).
 */
export function useFamilies(uid) {
  const [families, setFamilies] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const synced = useRef(new Set());

  useEffect(() => watchMyFamilies(uid, setFamilies, (e) => {
    console.error(e);
    setFamilies((f) => f ?? []);
  }), [uid]);
  useEffect(() => watchUserDoc(uid, setUserDoc), [uid]);

  if (!families || !userDoc) return { loading: true, families: [], family: null, ready: false, alertDays: alertDaysFor(null, null) };
  families.forEach((f) => f.synced && synced.current.add(f.id));
  const family = families.length ? pickCurrentFamily(families, userDoc.currentFamilyId) : null;
  return { loading: false, families, family, ready: !!family && synced.current.has(family.id), alertDays: alertDaysFor(userDoc, family) };
}
