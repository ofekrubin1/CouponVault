import { Clock } from 'lucide-react';
import { cx } from '@/ui';
import { daysLeft, expiryLabel, isExpired, urgency } from '@/domain/coupon';

const TONES = {
  red: 'bg-danger/10 text-danger',
  gold: 'bg-gold/15 text-gold-deep',
  normal: 'bg-navy/5 text-navy/60',
  none: 'bg-white/60 text-mute/50',
  dead: 'bg-white/60 text-mute/50',
};

export function ExpiryBadge({ coupon, alertDays, className }) {
  const tone = isExpired(coupon) ? 'dead' : urgency(coupon, alertDays) || (daysLeft(coupon) === null ? 'none' : 'normal');
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium', TONES[tone], className)}>
      <Clock className="h-3 w-3" strokeWidth={2} />
      {expiryLabel(coupon)}
    </span>
  );
}
