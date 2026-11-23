import { Trash2 } from 'lucide-react';
import { cx } from '@/ui';
import { balanceOf, daysLeft, expiryLabel, isMoney, isPhysical, urgency } from '@/domain/coupon';
import { displayStore } from '@/domain/links';
import { formatDate, money } from '@/domain/format';
import { BrandLogo } from '../BrandLogo';
import { useSwipeToReveal } from '../useSwipeToReveal';

const DELETE_W = 64; // how far the row slides open to show the delete button

/** What the coupon is worth, on the left of the first line. */
function Worth({ coupon }) {
  if (isMoney(coupon)) {
    return (
      <span dir="ltr" className="shrink-0 text-[14.5px] font-bold text-navy">
        {money(balanceOf(coupon))}
      </span>
    );
  }
  if (coupon.type === 'percent' && coupon.value) return <span className="shrink-0 text-[14.5px] font-bold text-gold-deep">{coupon.value}%</span>;
  if (coupon.type === 'product') return <span className="shrink-0 text-[12px] font-medium text-gold-deep">מוצר</span>;
  return null;
}

/** Expiry on the left of the second line: red pill when it's days away, amber inside the alert window, else the date. */
function Expiry({ coupon, alertDays }) {
  const u = urgency(coupon, alertDays);
  const text = u ? expiryLabel(coupon) : daysLeft(coupon) === null ? 'ללא תוקף' : formatDate(coupon.expiry);
  return (
    <span
      data-testid="row-expiry"
      data-urgency={u || undefined}
      className={cx(
        'shrink-0 whitespace-nowrap text-[11.5px]',
        u === 'red' ? 'rounded-full bg-danger px-[7px] font-semibold text-white' : u === 'gold' ? 'font-semibold text-[#B8862C]' : 'text-mute/50',
      )}
    >
      {text}
    </span>
  );
}

/**
 * A coupon as two compact lines, like a line in a notepad: name and worth, then store · code and expiry.
 * With onDelete it can be swiped either way to reveal a delete button.
 */
export function CouponRow({ coupon, alertDays, onClick, onDelete }) {
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
            className="flex h-9 w-9 items-center justify-center rounded-full border border-danger/15 bg-white text-danger shadow-[0_4px_14px_rgba(192,57,43,0.14)] transition-transform duration-150 active:scale-90"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      )}

      <div ref={swipe.slider} className="relative bg-white" style={{ willChange: swipeable ? 'transform' : undefined }}>
        <button
          type="button"
          onClick={swipe.guardClick(onClick)}
          onPointerDown={swipe.onPointerDown}
          data-testid="coupon-ticket"
          data-title={coupon.title}
          className="flex w-full select-none items-center gap-2.5 px-3 py-2.5 text-right active:bg-navy/[0.03]"
          style={{ touchAction: swipeable ? 'pan-y' : undefined }}
        >
          <BrandLogo coupon={coupon} size={30} />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-ink">{coupon.title}</span>
              <Worth coupon={coupon} />
            </span>
            <span className="mt-0.5 flex items-baseline gap-2">
              <span className="flex min-w-0 flex-1 items-baseline gap-1 truncate text-[12px] text-mute/55">
                <span className="truncate">{displayStore(coupon.store)}</span>
                {coupon.code && (
                  <>
                    <span aria-hidden>·</span>
                    <bdi dir="ltr" className="truncate font-mono text-[11.5px] tracking-wide text-mute/75">
                      {coupon.code}
                    </bdi>
                  </>
                )}
                {isPhysical(coupon) && (
                  <span className="shrink-0 rounded-full bg-gold/10 px-1.5 text-[10.5px] font-medium text-gold-deep" data-testid="physical-badge">
                    פיזי
                  </span>
                )}
              </span>
              <Expiry coupon={coupon} alertDays={alertDays} />
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
