import { AlertTriangle, ChevronLeft } from 'lucide-react';
import { Card, cx } from '@/ui';
import { balanceOf, expiryLabel, isMoney, urgency } from '@/domain/coupon';
import { money } from '@/domain/format';
import { CategoryTile } from '@/features/coupons';

const worth = (c) => (isMoney(c) ? ` · ${money(balanceOf(c))}` : c.type === 'percent' && c.value ? ` · ${c.value}%` : '');

/** "About to expire" list, most urgent first. */
export function ExpiringCard({ coupons, alertDays, onOpen }) {
  return (
    <Card className="!p-4" data-testid="expiring-card" style={{ borderColor: 'rgba(201,164,91,0.35)' }}>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-gold/15">
          <AlertTriangle className="h-4 w-4 text-gold-dark" strokeWidth={1.75} />
        </span>
        <h2 className="flex-1 text-sm font-semibold text-ink">עומדים לפוג</h2>
        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold-deep">{coupons.length}</span>
      </div>
      <ul className="divide-y divide-navy/[0.05]">
        {coupons.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => onOpen(c)} className="flex w-full items-center gap-3 py-2.5 text-right" data-testid="expiring-item">
              <CategoryTile category={c.category} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{c.title}</span>
                <span className="block truncate text-[11px] font-light text-mute/60">
                  {c.store}
                  {worth(c)}
                </span>
              </span>
              <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', urgency(c, alertDays) === 'red' ? 'bg-danger text-white' : 'bg-gold/15 text-gold-deep')}>
                {expiryLabel(c)}
              </span>
              <ChevronLeft className="h-4 w-4 shrink-0 text-mute/30" strokeWidth={1.75} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
