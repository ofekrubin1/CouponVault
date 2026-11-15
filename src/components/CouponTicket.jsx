import { Store, Clock, Gift, CheckCheck } from 'lucide-react';
import { CategoryTile, cx } from '../ui/primitives';
import { daysLeft, expiryLabel, isExpired, money, urgency } from '../lib';

const BADGE = {
  red: 'bg-danger/10 text-danger',
  gold: 'bg-gold/15 text-gold-deep',
  normal: 'bg-navy/5 text-navy/60',
  none: 'bg-canvas text-mute/50',
  dead: 'bg-canvas text-mute/50',
};

export function ExpiryBadge({ coupon, alertDays, className }) {
  const expired = isExpired(coupon);
  const u = urgency(coupon, alertDays);
  const tone = expired ? 'dead' : u || (daysLeft(coupon) === null ? 'none' : 'normal');
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium', BADGE[tone], className)}>
      <Clock className="h-3 w-3" strokeWidth={2} />
      {expiryLabel(coupon)}
    </span>
  );
}

/** The left "stub" of the ticket: what the coupon is worth. */
function Stub({ coupon, dim }) {
  const isMoney = coupon.type === 'money';
  const partial = isMoney && coupon.balance != null && coupon.value > 0 && coupon.balance < coupon.value;
  if (coupon.status === 'used') {
    return (
      <div className="flex flex-col items-center gap-1 text-mute/50">
        <CheckCheck className="h-5 w-5" strokeWidth={1.75} />
        <span className="text-[11px] font-semibold tracking-wide">מומש</span>
      </div>
    );
  }
  if (isMoney) {
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
              <span
                className="block h-full rounded-full bg-gradient-to-l from-navy to-gold"
                style={{ width: `${Math.max(4, (coupon.balance / coupon.value) * 100)}%` }}
              />
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
  return (
    <div className="flex flex-col items-center gap-1">
      <Gift className={cx('h-6 w-6', dim ? 'text-mute/40' : 'text-gold-dark')} strokeWidth={1.5} />
      <span className="text-[10px] font-light text-mute/50">קופון</span>
    </div>
  );
}

const STUB_W = 98;

/** A coupon drawn as a ticket: details on the right, a perforated stub with the value on the left. */
export default function CouponTicket({ coupon, alertDays, onClick }) {
  const used = coupon.status === 'used';
  const expired = isExpired(coupon);
  const dim = used || expired;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="coupon-ticket"
      data-title={coupon.title}
      className="group relative flex w-full items-stretch rounded-[14px] bg-white text-right shadow-card transition-transform duration-150 active:scale-[0.985]"
    >
      <div className={cx('min-w-0 flex-1 py-3.5 pl-3 pr-4', dim && 'opacity-60')}>
        <div className="flex items-center gap-3">
          <CategoryTile category={coupon.category} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ink">{coupon.title}</p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-light text-mute/70">
              <Store className="h-3 w-3 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{coupon.store}</span>
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {used ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-mute/60">
              <CheckCheck className="h-3 w-3" strokeWidth={2} /> מומש{coupon.usedByName ? ` ע״י ${coupon.usedByName.split(' ')[0]}` : ''}
            </span>
          ) : (
            <ExpiryBadge coupon={coupon} alertDays={alertDays} />
          )}
          {coupon.category && <span className="truncate text-[11px] font-light text-mute/45">{coupon.category}</span>}
        </div>
      </div>

      {/* notches where the stub tears off */}
      <span
        className="pointer-events-none absolute -top-[8px] z-[1] h-4 w-4 rounded-full bg-canvas shadow-[inset_0_-2px_3px_rgba(10,31,68,0.06)]"
        style={{ left: STUB_W - 8 }}
      />
      <span
        className="pointer-events-none absolute -bottom-[8px] z-[1] h-4 w-4 rounded-full bg-canvas shadow-[inset_0_2px_3px_rgba(10,31,68,0.06)]"
        style={{ left: STUB_W - 8 }}
      />

      <div
        className={cx('relative flex shrink-0 items-center justify-center rounded-l-[14px] px-2', dim ? 'bg-canvas/60' : 'bg-gradient-to-b from-soft to-[#F1F2F5]')}
        style={{ width: STUB_W }}
      >
        {/* perforation: a dashed line drawn as a repeating gradient (renders the same in every engine) */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-3.5 right-0 top-3.5 w-[1.5px]"
          style={{ backgroundImage: 'repeating-linear-gradient(to bottom, rgba(80,83,90,0.28) 0 5px, transparent 5px 10px)' }}
        />
        <Stub coupon={coupon} dim={dim} />
      </div>
    </button>
  );
}
