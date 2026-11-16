import { useMemo, useState } from 'react';
import { Search, X, Ticket, Plus, SlidersHorizontal, Hand } from 'lucide-react';
import CouponTicket from '../components/CouponTicket';
import { SummaryCard, ExpiringCard, FilterPanel, ActiveFilters } from '../components/HomeCards';
import { Button, EmptyState, cx } from '../ui/primitives';
import { NO_CATEGORY } from '../constants';
import { daysLeft, isActive, money, sortByExpiry } from '../lib';

const NO_FILTERS = { cats: new Set(), types: new Set(), soon: false };

export default function Home({ coupons, family, onOpen, onAdd, onUse, onDelete }) {
  const alertDays = family.alertDays ?? 14;
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [panel, setPanel] = useState(false);

  const active = useMemo(() => coupons.filter((c) => isActive(c)).sort(sortByExpiry), [coupons]);
  const expiringIds = useMemo(
    () => new Set(active.filter((c) => daysLeft(c) !== null && daysLeft(c) <= alertDays).map((c) => c.id)),
    [active, alertDays],
  );
  const expiring = active.filter((c) => expiringIds.has(c.id));
  const moneyCoupons = active.filter((c) => c.type === 'money');
  const balance = moneyCoupons.reduce((s, c) => s + (c.balance ?? c.value ?? 0), 0);

  // Categories (tags) present on active coupons, with counts.
  const cats = useMemo(() => {
    const m = new Map();
    for (const c of active) m.set(c.category || NO_CATEGORY, (m.get(c.category || NO_CATEGORY) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'he'));
  }, [active]);
  const typeCounts = useMemo(() => active.reduce((acc, c) => ({ ...acc, [c.type]: (acc[c.type] || 0) + 1 }), {}), [active]);

  const filterCount = filters.cats.size + filters.types.size + (filters.soon ? 1 : 0);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return active.filter((c) => {
      if (filters.cats.size && !filters.cats.has(c.category || NO_CATEGORY)) return false;
      if (filters.types.size && !filters.types.has(c.type)) return false;
      if (filters.soon && !expiringIds.has(c.id)) return false;
      if (!s) return true;
      return [c.title, c.store, c.source, c.notes, c.code, c.category].some((v) => v && v.toLowerCase().includes(s));
    });
  }, [active, q, filters, expiringIds]);
  const shownBalance = shown.filter((c) => c.type === 'money').reduce((s, c) => s + (c.balance ?? c.value ?? 0), 0);
  const filtering = !!(filterCount || q.trim());

  if (active.length === 0) {
    return (
      <EmptyState
        icon={Ticket}
        title="אין קופונים פעילים"
        text="הוסיפו את הקופון הראשון של המשפחה"
        action={
          <Button variant="primary" icon={Plus} onClick={onAdd}>
            הוספת קופון
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <SummaryCard balance={balance} activeCount={active.length} expiringCount={expiring.length} moneyCount={moneyCoupons.length} />

      {expiring.length > 0 && <ExpiringCard coupons={expiring} alertDays={alertDays} onOpen={onOpen} />}

      <div className="space-y-3 pt-1">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute/40" strokeWidth={1.5} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="חיפוש לפי שם, חנות או קוד"
              className="field pl-10 pr-10"
              aria-label="חיפוש"
              enterKeyHint="search"
            />
            {q && (
              <button type="button" className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-mute/50" onClick={() => setQ('')} aria-label="נקה חיפוש">
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPanel((p) => !p)}
            aria-label="סינון"
            aria-expanded={panel}
            data-testid="filter-button"
            className={cx(
              'relative flex w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] transition-colors',
              filterCount || panel ? 'glass-navy text-gold' : 'glass-card text-navy/60',
            )}
          >
            {(filterCount || panel) && <span className="sheen" />}
            <SlidersHorizontal className="relative h-[18px] w-[18px]" strokeWidth={1.75} />
            {filterCount > 0 && (
              <span className="absolute -left-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy ring-2 ring-white/80" data-testid="filter-count">
                {filterCount}
              </span>
            )}
          </button>
        </div>

        {panel ? (
          <FilterPanel
            cats={cats}
            typeCounts={typeCounts}
            soonCount={expiring.length}
            filters={filters}
            onChange={setFilters}
            resultCount={shown.length}
            onClose={() => setPanel(false)}
          />
        ) : (
          <ActiveFilters filters={filters} onChange={setFilters} />
        )}
      </div>

      <div className="flex items-baseline justify-between px-0.5">
        <h2 className="section-title">
          {filterCount ? 'תוצאות הסינון' : 'כל הקופונים'} <span className="text-gold-dark">· {shown.length}</span>
        </h2>
        {filtering && shownBalance > 0 && (
          <span className="text-[12px] font-light text-mute/60" data-testid="filtered-balance">
            יתרה: <b className="font-semibold text-navy">{money(shownBalance)}</b>
          </span>
        )}
      </div>

      <div className="space-y-3" data-testid="coupon-list">
        {shown.map((c) => (
          <CouponTicket key={c.id} coupon={c} alertDays={alertDays} onClick={() => onOpen(c)} onUse={onUse} onDelete={onDelete} />
        ))}
        {shown.length === 0 && <p className="py-10 text-center text-sm font-light text-mute/40">לא נמצאו קופונים</p>}
        {shown.length > 0 && (
          <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px] font-light text-mute/40">
            <Hand className="h-3.5 w-3.5" strokeWidth={1.5} /> החליקו קופון הצידה לניצול או מחיקה
          </p>
        )}
      </div>
    </div>
  );
}
