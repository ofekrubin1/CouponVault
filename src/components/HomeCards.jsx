import { AlertTriangle, ChevronLeft, Wallet, X, Check } from 'lucide-react';
import { Card, CategoryTile, cx } from '../ui/primitives';
import { categoryStyle, COUPON_TYPES, NO_CATEGORY } from '../constants';
import { expiryLabel, money, urgency } from '../lib';

/** Hero card at the top of the home screen (TripFlow's trip summary card, liquid style). */
export function SummaryCard({ balance, activeCount, expiringCount, moneyCount }) {
  return (
    <Card className="overflow-hidden" data-testid="summary-card">
      {/* liquid glow inside the glass */}
      <span className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(201,164,91,0.32),transparent_68%)]" />
      <span className="pointer-events-none absolute -bottom-24 right-6 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(90,130,210,0.22),transparent_68%)]" />
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">יתרה בשוברים</p>
          <p dir="ltr" className="mt-1 text-right text-[34px] font-semibold leading-none tracking-tight text-navy" data-testid="summary-balance">
            {money(balance)}
          </p>
          <p className="mt-1.5 text-[11px] font-light text-mute/55">{moneyCount ? `ב-${moneyCount} שוברים כספיים` : 'אין שוברים כספיים פעילים'}</p>
        </div>
        <span className="glass-navy relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[16px]">
          <span className="sheen" />
          <Wallet className="relative h-5 w-5 text-white" strokeWidth={1.5} />
        </span>
      </div>
      <div className="relative mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-[14px] border border-white/70 bg-white/45 px-3 py-2.5">
          <p className="text-[19px] font-semibold text-ink">{activeCount}</p>
          <p className="text-[11px] font-light text-mute/55">קופונים פעילים</p>
        </div>
        <div className="rounded-[14px] border border-white/70 bg-white/45 px-3 py-2.5">
          <p className={cx('text-[19px] font-semibold', expiringCount ? 'text-gold-dark' : 'text-ink')}>{expiringCount}</p>
          <p className="text-[11px] font-light text-mute/55">פגים בקרוב</p>
        </div>
      </div>
    </Card>
  );
}

/** "About to expire" list. */
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
                <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', red ? 'bg-danger text-white' : 'bg-gold/15 text-gold-deep')}>
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

const chipCls = (on) =>
  cx(
    'flex items-center gap-1.5 whitespace-nowrap rounded-[12px] border px-3 py-2 text-[13px] font-medium transition-colors',
    on ? 'chip-on' : 'border-white/80 bg-white/55 text-mute',
  );

function Chip({ on, onClick, children, group, value }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={chipCls(on)} data-testid="filter-chip" data-group={group} data-value={value}>
      {on && <Check className="h-3.5 w-3.5 text-[#5C74AA]" strokeWidth={2.2} />}
      {children}
    </button>
  );
}

const toggle = (set, v) => {
  const n = new Set(set);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
};

/**
 * Filter panel: categories (the "tags" set on coupons) and types are multi-select, plus "expiring soon".
 * `filters` = { cats: Set, types: Set, soon: bool }.
 */
export function FilterPanel({ cats, typeCounts, soonCount, filters, onChange, resultCount, onClose }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  const any = filters.cats.size || filters.types.size || filters.soon;
  return (
    <Card className="animate-pop space-y-4 !p-4" data-testid="filter-panel">
      <div>
        <p className="section-title mb-2">קטגוריה</p>
        <div className="flex flex-wrap gap-1.5">
          {cats.map(([name, n]) => {
            const { icon: Icon, color } = categoryStyle(name);
            const on = filters.cats.has(name);
            return (
              <Chip key={name} on={on} onClick={() => set({ cats: toggle(filters.cats, name) })} group="cat" value={name}>
                {!on && <Icon className="h-3.5 w-3.5" style={{ color }} strokeWidth={1.75} />}
                {name === NO_CATEGORY ? 'ללא קטגוריה' : name}
                <span className={cx('text-[11px]', on ? 'text-[#5C74AA]/70' : 'text-mute/40')}>{n}</span>
              </Chip>
            );
          })}
        </div>
      </div>

      <div>
        <p className="section-title mb-2">סוג</p>
        <div className="flex flex-wrap gap-1.5">
          {COUPON_TYPES.filter((t) => typeCounts[t.key]).map((t) => (
            <Chip key={t.key} on={filters.types.has(t.key)} onClick={() => set({ types: toggle(filters.types, t.key) })} group="type" value={t.key}>
              {t.label}
              <span className={cx('text-[11px]', filters.types.has(t.key) ? 'text-[#5C74AA]/70' : 'text-mute/40')}>{typeCounts[t.key]}</span>
            </Chip>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border border-white/70 bg-white/45 px-3 py-2.5">
        <span className="text-sm text-ink">
          רק פגים בקרוב <span className="text-[11px] text-mute/50">({soonCount})</span>
        </span>
        <span dir="ltr" className="shrink-0">
          <button
            type="button"
            role="switch"
            aria-checked={filters.soon}
            aria-label="רק פגים בקרוב"
            onClick={() => set({ soon: !filters.soon })}
            className={cx('flex h-7 w-12 items-center rounded-full px-0.5 transition-colors duration-200', filters.soon ? 'bg-gold' : 'bg-navy/15')}
          >
            <span className={cx('h-6 w-6 rounded-full bg-white shadow-btn2 transition-transform duration-300', filters.soon ? 'translate-x-5' : 'translate-x-0')} />
          </button>
        </span>
      </label>

      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="glass-navy relative flex-1 overflow-hidden rounded-[14px] py-2.5 text-sm font-medium text-white">
          <span className="sheen" />
          <span className="relative">הצג {resultCount} קופונים</span>
        </button>
        {any ? (
          <button
            type="button"
            onClick={() => onChange({ cats: new Set(), types: new Set(), soon: false })}
            className="flex items-center gap-1 rounded-[14px] border border-white/80 bg-white/55 px-4 text-sm font-medium text-gold-dark"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} /> נקה
          </button>
        ) : null}
      </div>
    </Card>
  );
}

/** Active filters as removable chips (shown when the panel is closed). */
export function ActiveFilters({ filters, onChange }) {
  const items = [
    ...[...filters.cats].map((c) => ({ key: `c-${c}`, label: c === NO_CATEGORY ? 'ללא קטגוריה' : c, remove: () => onChange({ ...filters, cats: toggle(filters.cats, c) }) })),
    ...[...filters.types].map((t) => ({
      key: `t-${t}`,
      label: COUPON_TYPES.find((x) => x.key === t)?.label,
      remove: () => onChange({ ...filters, types: toggle(filters.types, t) }),
    })),
    ...(filters.soon ? [{ key: 'soon', label: 'פגים בקרוב', remove: () => onChange({ ...filters, soon: false }) }] : []),
  ];
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-testid="active-filters">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          onClick={it.remove}
          aria-label={`הסר סינון ${it.label}`}
          className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[12px] font-medium text-gold-deep"
        >
          {it.label}
          <X className="h-3 w-3" strokeWidth={2.2} />
        </button>
      ))}
    </div>
  );
}
