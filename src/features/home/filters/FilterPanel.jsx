import { X } from 'lucide-react';
import { Card, Switch, ToggleChip, cx } from '@/ui';
import { COUPON_TYPES } from '@/domain/constants';
import { EMPTY_FILTERS, activeFilterCount, toggleIn } from '@/domain/filters';
import { CategoryIcon, categoryLabel } from '@/features/coupons';

const Count = ({ n, on }) => <span className={cx('text-[11px]', on ? 'text-accent/70' : 'text-mute/40')}>{n}</span>;

/**
 * Filter panel: categories (the "tags" set on coupons) and types are multi-select, plus "expiring soon".
 * `filters` = { cats: Set, types: Set, soon: bool }.
 */
export function FilterPanel({ cats, typeCounts, soonCount, filters, onChange, resultCount, onClose }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  return (
    <Card className="animate-pop space-y-4 !p-4" data-testid="filter-panel">
      <div>
        <p className="section-title mb-2">קטגוריה</p>
        <div className="flex flex-wrap gap-1.5">
          {cats.map(([name, n]) => {
            const on = filters.cats.has(name);
            return (
              <ToggleChip key={name} on={on} onClick={() => set({ cats: toggleIn(filters.cats, name) })} data-testid="filter-chip" data-group="cat" data-value={name}>
                {!on && <CategoryIcon category={name} />}
                {categoryLabel(name)}
                <Count n={n} on={on} />
              </ToggleChip>
            );
          })}
        </div>
      </div>

      <div>
        <p className="section-title mb-2">סוג</p>
        <div className="flex flex-wrap gap-1.5">
          {COUPON_TYPES.filter((t) => typeCounts[t.key]).map((t) => {
            const on = filters.types.has(t.key);
            return (
              <ToggleChip key={t.key} on={on} onClick={() => set({ types: toggleIn(filters.types, t.key) })} data-testid="filter-chip" data-group="type" data-value={t.key}>
                {t.label}
                <Count n={typeCounts[t.key]} on={on} />
              </ToggleChip>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-[14px] border border-white/70 bg-white/45 px-3 py-2.5">
        <span className="text-sm text-ink">
          רק פגים בקרוב <span className="text-[11px] text-mute/50">({soonCount})</span>
        </span>
        <Switch checked={filters.soon} onChange={(soon) => set({ soon })} label="רק פגים בקרוב" />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="glass-navy relative flex-1 overflow-hidden rounded-[14px] py-2.5 text-sm font-medium text-white">
          <span className="sheen" />
          <span className="relative">הצג {resultCount} קופונים</span>
        </button>
        {activeFilterCount(filters) > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="flex items-center gap-1 rounded-[14px] border border-white/80 bg-white/55 px-4 text-sm font-medium text-gold-dark"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} /> נקה
          </button>
        )}
      </div>
    </Card>
  );
}
