import { Pencil, Share2, Trash2 } from 'lucide-react';
import { IconButton, Sheet } from '@/ui';
import { useCouponActions } from '../useCouponActions';
import { CouponHero } from './CouponHero';
import { CouponCode, CouponInfo } from './CouponInfo';
import { UsageHistory } from './UsageHistory';
import { RedeemBar } from './RedeemBar';
import { useCouponShare } from '../share/useCouponShare';

/**
 * A coupon's sheet: card, code, details, history and the redeem bar.
 * `onDone` is called after a redemption or deletion (the shell returns to the home screen).
 */
export function CouponDetailSheet({ coupon, family, user, alertDays, onClose, onEdit, onDone, startPartial = false }) {
  const actions = useCouponActions(family, user);
  const sharing = useCouponShare(coupon);
  const done = onDone || onClose;

  const partial = (amount) => {
    const r = actions.usePartial(coupon, amount);
    if (!r.error) done();
    return r;
  };
  const useAll = async () => (await actions.useAll(coupon)) && done();
  const remove = async () => (await actions.remove(coupon)) && done();

  return (
    <Sheet
      title={coupon.title}
      onClose={onClose}
      footer={
        <RedeemBar
          coupon={coupon}
          startPartial={startPartial}
          onUseAll={useAll}
          onPartial={partial}
          onRestore={() => actions.restore(coupon)}
          onEdit={onEdit}
        />
      }
      actions={
        <>
          <IconButton icon={Share2} label="שיתוף" onClick={sharing.share} disabled={!sharing.ready} className="disabled:opacity-40" data-testid="share-coupon" />
          <IconButton icon={Pencil} label="עריכה" onClick={onEdit} />
          <IconButton icon={Trash2} label="מחיקה" tone="danger" onClick={remove} />
        </>
      }
    >
      <div className="space-y-4">
        <CouponHero coupon={coupon} alertDays={alertDays} />
        {coupon.code && <CouponCode code={coupon.code} />}
        {coupon.cvv && <CouponCode code={coupon.cvv} label="קוד אימות" copied="קוד האימות הועתק" testId="copy-cvv" />}
        <CouponInfo coupon={coupon} />
        <UsageHistory coupon={coupon} onUndoLast={() => actions.undoLast(coupon)} />
      </div>
    </Sheet>
  );
}
