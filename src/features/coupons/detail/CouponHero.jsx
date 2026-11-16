import { Store, Gift, Clock, CheckCheck } from 'lucide-react';
import { cx } from '@/ui';
import { balanceOf, expiryLabel, isExpired, isMoney, isUsed, urgency } from '@/domain/coupon';
import { formatDate, money } from '@/domain/format';
import { categoryStyle } from '../categoryStyle';

// Side notches cut out of the card (a mask, so whatever is behind shows through).
const NOTCHES = 'radial-gradient(circle 12px at 0 50%, transparent 11.5px, #000 12px), radial-gradient(circle 12px at 100% 50%, transparent 11.5px, #000 12px)';
const MASK = { WebkitMaskImage: NOTCHES, maskImage: NOTCHES, WebkitMaskComposite: 'source-in', maskComposite: 'intersect' };

function ExpiryPill({ coupon, alertDays }) {
  const u = urgency(coupon, alertDays);
  const tone = isExpired(coupon) ? 'bg-white/10 text-white/60' : u === 'red' ? 'bg-danger text-white' : u === 'gold' ? 'bg-gold text-navy' : 'bg-white/10 text-white/80';
  return (
    <span className={cx('flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium', tone)}>
      <Clock className="h-3.5 w-3.5" strokeWidth={2} />
      {expiryLabel(coupon)}
    </span>
  );
}

function Value({ coupon }) {
  if (isMoney(coupon)) {
    const pct = coupon.value > 0 ? Math.max(0, Math.min(100, (balanceOf(coupon) / coupon.value) * 100)) : 0;
    return (
      <>
        <p className="text-[11px] font-light tracking-[0.06em] text-white/50">{isUsed(coupon) ? 'נוצל במלואו' : 'יתרה לניצול'}</p>
        <p dir="ltr" className="text-right text-[40px] font-semibold leading-none tracking-tight" data-testid="hero-balance">
          {money(coupon.balance ?? coupon.value)}
        </p>
        {coupon.balance !== coupon.value && <p className="mt-1 text-xs font-light text-white/50">מתוך {money(coupon.value)}</p>}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-gradient-to-l from-gold to-[#E6CB8B] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </>
    );
  }
  if (coupon.type === 'percent' && coupon.value) {
    return (
      <>
        <p className="text-[11px] font-light tracking-[0.06em] text-white/50">הנחה</p>
        <p dir="ltr" className="text-right text-[40px] font-semibold leading-none tracking-tight text-champagne-light">
          {coupon.value}%
        </p>
      </>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Gift className="h-9 w-9 text-champagne" strokeWidth={1.25} />
      <p className="text-lg font-medium">{coupon.title}</p>
    </div>
  );
}

/** The coupon as a soft-blue ticket card: category, store, value, expiry. */
export function CouponHero({ coupon, alertDays }) {
  const { icon: CatIcon } = categoryStyle(coupon.category);
  const used = isUsed(coupon);
  return (
    <div className="rounded-[22px] shadow-hero">
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-accent-from via-accent-via to-accent-to p-5 text-white" style={MASK} data-testid="coupon-hero">
        <span className="pointer-events-none absolute -left-10 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(201,164,91,0.35),transparent_68%)]" />
        <span className="pointer-events-none absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(110,150,230,0.3),transparent_68%)]" />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[22px] bg-gradient-to-b from-white/[0.12] to-transparent" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold/70 to-transparent" />

        <div className="relative flex items-center gap-2 text-white/70">
          <CatIcon className="h-4 w-4 text-champagne" strokeWidth={1.5} />
          <span className="truncate text-xs font-light">{coupon.category || 'קופון'}</span>
          <span className="mx-1 text-white/30">·</span>
          <Store className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span className="truncate text-xs font-light">{coupon.store}</span>
        </div>

        <div className="relative mt-4">
          <Value coupon={coupon} />
        </div>

        <div className="relative mt-4 flex items-center justify-between border-t border-dashed border-white/15 pt-3 text-xs">
          {used ? (
            <span className="flex items-center gap-1.5 text-white/70">
              <CheckCheck className="h-3.5 w-3.5 text-champagne" strokeWidth={2} />
              מומש {coupon.usedAt ? `ב-${formatDate(coupon.usedAt)}` : ''}
              {coupon.usedByName ? ` ע״י ${coupon.usedByName}` : ''}
            </span>
          ) : (
            <ExpiryPill coupon={coupon} alertDays={alertDays} />
          )}
          {coupon.expiry && !used && <span className="font-light text-white/40">{formatDate(coupon.expiry)}</span>}
        </div>
      </div>
    </div>
  );
}
