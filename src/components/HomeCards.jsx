import { AlertTriangle, ChevronLeft, Wallet } from 'lucide-react';
import { Card, CategoryTile, cx } from '../ui/primitives';
import { categoryStyle, NO_CATEGORY } from '../constants';
import { expiryLabel, money, urgency } from '../lib';

/** Hero card at the top of the home screen (TripFlow's trip summary card). */
export function SummaryCard({ balance, activeCount, expiringCount, moneyCount }) {
  return (
    <Card gold className="overflow-hidden" data-testid="summary-card">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-t-[14px] bg-gradient-to-r from-navy via-gold/60 to-navy" />
      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <p className="eyebrow">יתרה בשוברים</p>
          <p dir="ltr" className="mt-1 text-right text-[32px] font-semibold leading-none tracking-tight text-navy" data-testid="summary-balance">
            {money(balance)}
          </p>
          <p className="mt-1.5 text-[11px] font-light text-mute/50">{moneyCount ? `ב-${moneyCount} שוברים כספיים` : 'אין שוברים כספיים פעילים'}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-gradient-to-b from-navy-light to-navy shadow-btn">
          <Wallet className="h-5 w-5 text-gold" strokeWidth={1.5} />
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 border-t border-line/40 pt-3">
        <div>
          <p className="text-[18px] font-semibold text-ink">{activeCount}</p>
          <p className="text-[11px] font-light text-mute/50">קופונים פעילים</p>
        </div>
        <div className="border-r border-line/40 pr-4">
          <p className={cx('text-[18px] font-semibold', expiringCount ? 'text-gold-dark' : 'text-ink')}>{expiringCount}</p>
          <p className="text-[11px] font-light text-mute/50">פגים בקרוב</p>
        </div>
      </div>
    </Card>
  );
}

/** "About to expire" list. */
export function ExpiringCard({ coupons, alertDays, onOpen }) {
  return (
    <Card className="border border-gold/25 !p-4" data-testid="expiring-card">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-gold/15">
          <AlertTriangle className="h-4 w-4 text-gold-dark" strokeWidth={1.75} />
        </span>
        <h2 className="flex-1 text-sm font-semibold text-ink">עומדים לפוג</h2>
        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold-deep">{coupons.length}</span>
      </div>
      <ul className="divide-y divide-canvas">
        {coupons.map((c) => {
          const red = urgency(c, alertDays) === 'red';
          return (
            <li key={c.id}>
              <button type="button" onClick={() => onOpen(c)} className="flex w-full items-center gap-3 py-2.5 text-right" data-testid="expiring-item">
                <CategoryTile category={c.category} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{c.title}</span>
                  <span className="block truncate text-[11px] font-light text-mute/60">
                    {c.store}
                    {c.type === 'money' ? ` · ${money(c.balance ?? c.value)}` : c.type === 'percent' && c.value ? ` · ${c.value}%` : ''}
                  </span>
                </span>
                <span
                  className={cx(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    red ? 'bg-danger text-white' : 'bg-gold/15 text-gold-deep',
                  )}
                >
                  {expiryLabel(c)}
                </span>
                <ChevronLeft className="h-4 w-4 shrink-0 text-mute/30" strokeWidth={1.75} />
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Horizontal category filter. `cats` = [[name, count], ...]. */
export function CategoryChips({ cats, total, value, onChange }) {
  const chip = (on) =>
    cx(
      'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-3 py-2 text-[13px] font-medium transition-colors',
      on ? 'border-navy bg-navy text-white shadow-btn' : 'border-line bg-white text-mute shadow-btn2',
    );
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="tablist" aria-label="סינון לפי קטגוריה">
      <button type="button" role="tab" aria-selected={!value} className={chip(!value)} onClick={() => onChange(null)} data-testid="category-chip" data-category="">
        הכול
        <span className={cx('text-[11px]', !value ? 'text-white/60' : 'text-mute/40')}>{total}</span>
      </button>
      {cats.map(([name, n]) => {
        const on = value === name;
        const { icon: Icon, color } = categoryStyle(name);
        return (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={on}
            className={chip(on)}
            onClick={() => onChange(on ? null : name)}
            data-testid="category-chip"
            data-category={name}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: on ? '#C9A45B' : color }} strokeWidth={1.75} />
            {name === NO_CATEGORY ? 'ללא' : name}
            <span className={cx('text-[11px]', on ? 'text-white/60' : 'text-mute/40')}>{n}</span>
          </button>
        );
      })}
    </div>
  );
}
