import { Gift, CheckCheck, ShoppingBag } from 'lucide-react';
import { cx } from '@/ui';
import { money } from '@/domain/format';
import { isMoney, isUsed } from '@/domain/coupon';

/** The left "stub" of the ticket: what the coupon is worth. */
export function TicketStub({ coupon, dim }) {
  if (isUsed(coupon)) {
    return (
      <div className="flex flex-col items-center gap-1 text-mute/50">
        <CheckCheck className="h-5 w-5" strokeWidth={1.75} />
        <span className="text-[11px] font-semibold tracking-wide">מומש</span>
      </div>
    );
  }
  if (isMoney(coupon)) {
    const partial = coupon.balance != null && coupon.value > 0 && coupon.balance < coupon.value;
    return (
      <div className="flex w-full flex-col items-center">
        <span className="text-[10px] font-light text-mute/50">{partial ? 'נותר' : 'שווי'}</span>
        <span dir="ltr" className={cx('text-[19px] font-semibold leading-tight tracking-tight', dim ? 'text-mute/60' : 'text-navy')}>
          {money(coupon.balance ?? coupon.value)}
        </span>
        {partial && (
          <>
            <span className="mt-0.5 text-[10px] font-light text-mute/45">מתוך {money(coupon.value)}</span>
            <span className="mt-1.5 h-1 w-14 overflow-hidden rounded-full bg-navy/10">
              <span className="block h-full rounded-full bg-gradient-to-l from-accent to-gold" style={{ width: `${Math.max(4, (coupon.balance / coupon.value) * 100)}%` }} />
            </span>
          </>
        )}
      </div>
    );
  }
  if (coupon.type === 'percent' && coupon.value) {
    return (
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-light text-mute/50">הנחה</span>
        <span dir="ltr" className={cx('text-[22px] font-semibold leading-tight', dim ? 'text-mute/60' : 'text-gold-dark')}>
          {coupon.value}%
        </span>
      </div>
    );
  }
  const product = coupon.type === 'product';
  const Icon = product ? ShoppingBag : Gift;
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className={cx('h-6 w-6', dim ? 'text-mute/40' : 'text-gold-dark')} strokeWidth={1.5} />
      <span className="text-[10px] font-light text-mute/50">{product ? 'מוצר' : 'קופון'}</span>
    </div>
  );
}
