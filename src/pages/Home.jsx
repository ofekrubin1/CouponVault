import { useMemo, useState } from 'react';
import { Search, X, Ticket, Plus } from 'lucide-react';
import CouponTicket from '../components/CouponTicket';
import { SummaryCard, ExpiringCard, CategoryChips } from '../components/HomeCards';
import { Button, EmptyState } from '../ui/primitives';
import { NO_CATEGORY } from '../constants';
import { daysLeft, isActive, money, sortByExpiry } from '../lib';

export default function Home({ coupons, family, onOpen, onAdd }) {
  const alertDays = family.alertDays ?? 14;
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(null);

  const active = useMemo(() => coupons.filter((c) => isActive(c)).sort(sortByExpiry), [coupons]);
  const expiring = useMemo(
    () => active.filter((c) => {
      const d = daysLeft(c);
      return d !== null && d <= alertDays;
    }),
    [active, alertDays],
  );
  const moneyCoupons = active.filter((c) => c.type === 'money');
  const balance = moneyCoupons.reduce((s, c) => s + (c.balance ?? c.value ?? 0), 0);

  const cats = useMemo(() => {
    const m = new Map();
    for (const c of active) {
      const k = c.category || NO_CATEGORY;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'he'));
  }, [active]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return active.filter((c) => {
      if (cat && (c.category || NO_CATEGORY) !== cat) return false;
      if (!s) return true;
      return [c.title, c.store, c.source, c.notes, c.code, c.category].some((v) => v && v.toLowerCase().includes(s));
    });
  }, [active, q, cat]);
  const shownBalance = shown.filter((c) => c.type === 'money').reduce((s, c) => s + (c.balance ?? c.value ?? 0), 0);
  const filtering = !!(cat || q.trim());

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
        <div className="relative">
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
        {cats.length > 1 && <CategoryChips cats={cats} total={active.length} value={cat} onChange={setCat} />}
      </div>

      <div className="flex items-baseline justify-between px-0.5">
        <h2 className="section-title">
          {cat ? (cat === NO_CATEGORY ? 'ללא קטגוריה' : cat) : 'כל הקופונים'} <span className="text-gold-dark">· {shown.length}</span>
        </h2>
        {filtering && shownBalance > 0 && (
          <span className="text-[12px] font-light text-mute/60" data-testid="filtered-balance">
            יתרה: <b className="font-semibold text-navy">{money(shownBalance)}</b>
          </span>
        )}
      </div>

      <div className="space-y-3" data-testid="coupon-list">
        {shown.map((c) => (
          <CouponTicket key={c.id} coupon={c} alertDays={alertDays} onClick={() => onOpen(c)} />
        ))}
        {shown.length === 0 && <p className="py-10 text-center text-sm font-light text-mute/40">לא נמצאו קופונים</p>}
      </div>
    </div>
  );
}
