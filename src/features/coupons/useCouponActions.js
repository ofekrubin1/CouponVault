// User-facing coupon actions: ask when needed, write, and say what happened. Shared by every screen so a
// "delete" or "used it" behaves (and reads) the same everywhere.
import { useMemo } from 'react';
import { useConfirm, useToast } from '@/ui';
import { addCategory, addCoupon, deleteCoupon, redeemCoupon, restoreCoupon, undoLastUsage, updateCoupon } from '@/data';
import { balanceOf, isMoney } from '@/domain/coupon';
import { money } from '@/domain/format';

export function useCouponActions(family, user) {
  const confirm = useConfirm();
  const toast = useToast();

  return useMemo(
    () => ({
      /** Asks first. Resolves true when deleted. */
      async remove(c) {
        const ok = await confirm({
          title: 'מחיקת קופון',
          message: `למחוק את "${c.title}"${isMoney(c) ? ` (יתרה ${money(balanceOf(c))})` : ''} לצמיתות?`,
          confirmText: 'מחק',
          danger: true,
        });
        if (!ok) return false;
        deleteCoupon(family.id, c.id);
        toast('הקופון נמחק');
        return true;
      },

      /** Mark fully used (asks first). Resolves true when done. */
      async useAll(c) {
        const ok = await confirm({
          title: 'לסמן כמומש?',
          message: isMoney(c) ? `כל היתרה (${money(balanceOf(c))}) תסומן כנוצלה והקופון יעבור לארכיון.` : 'הקופון יעבור לארכיון. אפשר להחזיר אותו משם.',
          confirmText: 'כן, מימשתי',
        });
        if (!ok) return false;
        redeemCoupon(family.id, user, c, null);
        toast('סומן כמומש ועבר לארכיון');
        return true;
      },

      /** Partial redemption of a voucher. Returns { error } or { left, finished }. */
      usePartial(c, amount) {
        const r = redeemCoupon(family.id, user, c, amount);
        if (!r.error) toast(r.finished ? 'השובר נוצל במלואו' : `נוצלו ${money(amount)} · נותרו ${money(r.left)}`);
        return r;
      },

      restore(c) {
        restoreCoupon(family.id, c);
        toast('הקופון הוחזר לפעילים');
      },

      undoLast(c) {
        undoLastUsage(family.id, c);
        toast('השימוש האחרון בוטל');
      },

      /** Save the form result; adds a new category to the family when needed. */
      save(data, existing, knownCategories) {
        if (data.category && !knownCategories.includes(data.category)) addCategory(family.id, data.category);
        if (existing) {
          updateCoupon(family.id, existing.id, data);
          toast('השינויים נשמרו');
        } else {
          addCoupon(family.id, user, data);
          toast('הקופון נוסף');
        }
      },
    }),
    [family.id, user, confirm, toast],
  );
}
