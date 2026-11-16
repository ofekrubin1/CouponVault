import { useCallback, useEffect, useRef, useState } from 'react';
import { Store, Clock, Gift, CheckCheck, Trash2 } from 'lucide-react';
import { CategoryTile, cx } from '../ui/primitives';
import { daysLeft, expiryLabel, isExpired, money, urgency } from '../lib';

const BADGE = {
  red: 'bg-danger/10 text-danger',
  gold: 'bg-gold/15 text-gold-deep',
  normal: 'bg-navy/5 text-navy/60',
  none: 'bg-white/60 text-mute/50',
  dead: 'bg-white/60 text-mute/50',
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
const ACTIONS_W = 160;
const NOTCH = 8;

// Real cut-out notches (a mask), so the page's gradient shows through them like a punched ticket.
const NOTCH_MASK = [
  `radial-gradient(circle ${NOTCH}px at ${STUB_W}px 0, transparent ${NOTCH - 0.5}px, #000 ${NOTCH}px)`,
  `radial-gradient(circle ${NOTCH}px at ${STUB_W}px 100%, transparent ${NOTCH - 0.5}px, #000 ${NOTCH}px)`,
].join(', ');
const MASK_STYLE = { WebkitMaskImage: NOTCH_MASK, maskImage: NOTCH_MASK, WebkitMaskComposite: 'source-in', maskComposite: 'intersect' };

/**
 * A coupon drawn as a glass ticket: details on the right, a perforated stub with the value on the left.
 * With onUse/onDelete it can be swiped either way to reveal "ניצול" and "מחיקה" (one row open at a time).
 */
export default function CouponTicket({ coupon, alertDays, onClick, onUse, onDelete }) {
  const used = coupon.status === 'used';
  const expired = isExpired(coupon);
  const dim = used || expired;
  const swipeable = !!(onUse || onDelete);

  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const off = useRef(0);
  const swiped = useRef(false);
  const stop = useRef(null);

  const close = useCallback(() => {
    off.current = 0;
    setOffset(0);
  }, []);

  // Only one row open: opening this one closes the others.
  useEffect(() => {
    const onOpen = (e) => e.detail !== coupon.id && off.current && close();
    window.addEventListener('cv-swipe-open', onOpen);
    return () => {
      window.removeEventListener('cv-swipe-open', onOpen);
      stop.current?.();
    };
  }, [coupon.id, close]);

  // Horizontal drags swipe; vertical ones are left to the page (touch-action: pan-y).
  const onPointerDown = (e) => {
    if (!swipeable || e.button > 0) return;
    const sx = e.clientX;
    const sy = e.clientY;
    const base = off.current;
    let mode = null;
    swiped.current = false;
    const move = (ev) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!mode) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        mode = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        if (mode === 'h') {
          swiped.current = true;
          setDragging(true);
        }
      }
      if (mode !== 'h') return;
      const lim = ACTIONS_W + 36;
      off.current = Math.max(-lim, Math.min(lim, base + dx));
      setOffset(off.current);
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      stop.current = null;
      if (mode !== 'h') return;
      setDragging(false);
      const target = Math.abs(off.current) > ACTIONS_W / 2.5 ? Math.sign(off.current) * ACTIONS_W : 0;
      off.current = target;
      setOffset(target);
      if (target) window.dispatchEvent(new CustomEvent('cv-swipe-open', { detail: coupon.id }));
    };
    stop.current = end;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  const handleClick = () => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    if (off.current) close();
    else onClick?.();
  };

  const act = (fn) => () => {
    close();
    fn?.(coupon);
  };
  const reveal = Math.min(Math.abs(offset), ACTIONS_W + 36);

  return (
    <div className="relative" data-testid="coupon-row" data-title={coupon.title}>
      {swipeable && offset !== 0 && (
        <div
          className={cx('absolute inset-y-0 flex items-stretch gap-2 overflow-hidden py-1', offset > 0 ? 'left-0 pl-1' : 'right-0 pr-1')}
          style={{ width: reveal }}
          data-testid="swipe-actions"
        >
          <button
            type="button"
            onClick={act(onUse)}
            className="glass-navy relative flex min-w-[72px] flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-[18px] text-xs font-medium text-white"
          >
            <span className="sheen" />
            <CheckCheck className="relative h-5 w-5 text-gold" strokeWidth={1.75} />
            <span className="relative">ניצול</span>
          </button>
          <button
            type="button"
            onClick={act(onDelete)}
            className="relative flex min-w-[72px] flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-[18px] border border-white/30 bg-gradient-to-b from-[#D9534F] to-danger text-xs font-medium text-white shadow-danger"
          >
            <span className="sheen" />
            <Trash2 className="relative h-5 w-5" strokeWidth={1.75} />
            <span className="relative">מחיקה</span>
          </button>
        </div>
      )}

      {/* the moving part: a soft shadow layer (a mask would clip a box-shadow) + the masked glass ticket */}
      <div
        className="relative rounded-[18px] shadow-[0_8px_24px_rgba(10,31,68,0.07),0_1px_3px_rgba(10,31,68,0.05)]"
        style={{
          transform: offset ? `translateX(${offset}px)` : undefined,
          transition: dragging ? 'none' : 'transform 0.38s cubic-bezier(0.34, 1.3, 0.64, 1)',
        }}
      >
        <button
          type="button"
          onClick={handleClick}
          onPointerDown={onPointerDown}
          data-testid="coupon-ticket"
          data-title={coupon.title}
          className="relative flex w-full select-none items-stretch rounded-[18px] text-right transition-transform duration-150 active:scale-[0.985]"
          style={{
            ...MASK_STYLE,
            touchAction: swipeable ? 'pan-y' : undefined,
            background: 'rgba(255,255,255,0.74)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.85), inset 0 1px 0 #fff',
          }}
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
                <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-medium text-mute/60">
                  <CheckCheck className="h-3 w-3" strokeWidth={2} /> מומש{coupon.usedByName ? ` ע״י ${coupon.usedByName.split(' ')[0]}` : ''}
                </span>
              ) : (
                <ExpiryBadge coupon={coupon} alertDays={alertDays} />
              )}
              {coupon.category && <span className="truncate text-[11px] font-light text-mute/45">{coupon.category}</span>}
            </div>
          </div>

          <div
            className="relative flex shrink-0 items-center justify-center rounded-l-[18px] px-2"
            style={{
              width: STUB_W,
              background: dim ? 'rgba(255,255,255,0.35)' : 'linear-gradient(180deg, rgba(10,31,68,0.025) 0%, rgba(10,31,68,0.065) 100%)',
            }}
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
      </div>
    </div>
  );
}
