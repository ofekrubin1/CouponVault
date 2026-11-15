import { useMemo, useState } from 'react';
import { AlertTriangle, Search, X, Ticket } from 'lucide-react';
import CouponCard from '../components/CouponCard';
import { daysLeft, expiryLabel, isActive, money, sortByExpiry, urgency } from '../lib';

export default function Home({ coupons, family, onOpen, onAdd }) {
  const alertDays = family.alertDays ?? 14;
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(null);

  const active = useMemo(() => coupons.filter(isActive).sort(sortByExpiry), [coupons]);

  const expiring = useMemo(
    () => active.filter((c) => { const d = daysLeft(c); return d !== null && d <= alertDays; }),
    [active, alertDays],
  );

  // Category chips, with a count for each (only categories that have active coupons).
  const cats = useMemo(() => {
    const m = new Map();
    for (const c of active) {
      const k = c.category || 'ללא קטגוריה';
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [active]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return active.filter((c) => {
      if (cat && (c.category || 'ללא קטגוריה') !== cat) return false;
      if (!s) return true;
      return [c.title, c.store, c.source, c.notes, c.code, c.category].some((v) => v && v.toLowerCase().includes(s));
    });
  }, [active, q, cat]);

  const moneyLeft = shown.filter((c) => c.type === 'money').reduce((s, c) => s + (c.balance || 0), 0);

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 pt-20 text-center">
        <div className="mb-4 rounded-full bg-brand-50 p-6"><Ticket size={48} className="text-brand-500" /></div>
        <h2 className="text-xl font-bold">אין קופונים פעילים</h2>
        <p className="mt-1 text-slate-500">לחץ על ה-+ כדי להוסיף את הקופון הראשון</p>
        <button className="btn-primary mt-6" onClick={onAdd}>הוספת קופון</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pt-3">
      {expiring.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <h2 className="mb-2 flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle size={18} /> עומדים לפוג ({expiring.length})
          </h2>
          <ul className="space-y-1.5">
            {expiring.map((c) => {
              const red = urgency(c, alertDays) === 'red';
              return (
                <li key={c.id}>
                  <button onClick={() => onOpen(c)} className="flex w-full items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-right shadow-sm">
                    <span className="min-w-0 truncate">
                      <b>{c.title}</b> <span className="text-sm text-slate-500">· {c.store}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${red ? 'bg-red-500 text-white' : 'bg-amber-200 text-amber-900'}`}>
                      {expiryLabel(c)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="relative">
        <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pr-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לפי שם, חנות, קוד…" />
        {q && (
          <button className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setQ('')} aria-label="נקה">
            <X size={18} />
          </button>
        )}
      </div>

      {cats.length > 1 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <button className={`chip ${!cat ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`} onClick={() => setCat(null)}>
            הכול · {active.length}
          </button>
          {cats.map(([name, n]) => (
            <button
              key={name}
              className={`chip ${cat === name ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
              onClick={() => setCat(cat === name ? null : name)}
            >
              {name} · {n}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-baseline justify-between text-sm text-slate-500">
        <span>{shown.length} קופונים{cat ? ` ב${cat}` : ''}</span>
        {moneyLeft > 0 && <span>יתרה בשוברים: <b className="text-slate-700">{money(moneyLeft)}</b></span>}
      </div>

      <div className="space-y-2.5">
        {shown.map((c) => <CouponCard key={c.id} coupon={c} alertDays={alertDays} onClick={() => onOpen(c)} />)}
        {shown.length === 0 && <p className="py-10 text-center text-slate-400">לא נמצאו קופונים</p>}
      </div>
    </div>
  );
}
