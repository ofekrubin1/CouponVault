import { Store, CheckCheck, Trash2, CreditCard } from 'lucide-react';
import { cx } from '@/ui';
import { couponCategories, isExpired, isPhysical, isUsed } from '@/domain/coupon';
import { displayStore } from '@/domain/links';
import { BrandLogo } from '../BrandLogo';
import { ExpiryBadge } from '../ExpiryBadge';
import { TicketStub } from './TicketStub';
import { useSwipeToReveal } from './useSwipeToReveal';

const STUB_W = 98;
const NOTCH = 8;
const DELETE_W = 64; // how far the row slides open to show the small delete button

// Real cut-out notches (a mask), so the page's gradient shows through them like a punched ticket.
const NOTCH_MASK = [
  `radial-gradient(circle ${NOTCH}px at ${STUB_W}px 0, transparent ${NOTCH - 0.5}px, #000 ${NOTCH}px)`,
  `radial-gradient(circle ${NOTCH}px at ${STUB_W}px 100%, transparent ${NOTCH - 0.5}px, #000 ${NOTCH}px)`,
].join(', ');
const MASK_STYLE = { WebkitMaskImage: NOTCH_MASK, maskImage: NOTCH_MASK, WebkitMaskComposite: 'source-in', maskComposite: 'intersect' };

/**
 * A coupon drawn as a glass ticket: details on the right, a perforated stub with the value on the left.
 * With onDelete it can be swiped either way to reveal a small delete button.
 */
export function CouponTicket({ coupon, alertDays, onClick, onDelete }) {
  const used = isUsed(coupon);
  const dim = used || isExpired(coupon);
  const swipeable = !!onDelete;
  const swipe = useSwipeToReveal(coupon.id, DELETE_W, swipeable);

  return (
    <div className="relative" data-testid="coupon-row" data-title={coupon.title}>
      {swipeable && (
        <div
          ref={swipe.actions}
          className={cx('absolute inset-0 flex items-center px-3', !swipe.open && 'pointer-events-none')}
          style={{ opacity: 0 }}
          data-testid="swipe-actions"
          aria-hidden={!swipe.open}
        >
          <button
            type="button"
            tabIndex={swipe.open ? 0 : -1}
            onClick={() => {
              swipe.close();
              onDelete(coupon);
            }}
            aria-label="מחיקה"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-danger/15 bg-white/80 text-danger shadow-[0_4px_14px_rgba(192,57,43,0.14)] transition-transform duration-150 active:scale-90"
          >
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        </div>
      )}

      {/* the moving part: a soft shadow layer (a mask would clip a box-shadow) + the masked glass ticket */}
      <div
        ref={swipe.slider}
        className="relative rounded-[18px] shadow-[0_8px_24px_rgba(10,31,68,0.07),0_1px_3px_rgba(10,31,68,0.05)]"
        style={{ willChange: swipeable ? 'transform' : undefined }}
      >
        <button
          type="button"
          onClick={swipe.guardClick(onClick)}
          onPointerDown={swipe.onPointerDown}
          data-testid="coupon-ticket"
          data-title={coupon.title}
          className="relative flex w-full select-none items-stretch rounded-[18px] text-right transition-opacity duration-150 active:opacity-90"
          style={{
            ...MASK_STYLE,
            touchAction: swipeable ? 'pan-y' : undefined,
            background: 'rgba(255,255,255,0.74)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.85), inset 0 1px 0 #fff',
          }}
        >
          <div className={cx('min-w-0 flex-1 py-3.5 pl-3 pr-4', dim && 'opacity-60')}>
            <div className="flex items-center gap-3">
              <BrandLogo coupon={coupon} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-ink">{coupon.title}</p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-light text-mute/70">
                  <Store className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{displayStore(coupon.store)}</span>
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
              {isPhysical(coupon) && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold-deep" data-testid="physical-badge">
                  <CreditCard className="h-3 w-3" strokeWidth={2} /> פיזי
                </span>
              )}
              {couponCategories(coupon).length > 0 && <span className="min-w-0 truncate text-[11px] font-light text-mute/45">{couponCategories(coupon).join(' · ')}</span>}
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
            <TicketStub coupon={coupon} dim={dim} />
          </div>
        </button>
      </div>
    </div>
  );
}
