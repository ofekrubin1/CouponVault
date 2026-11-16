import { X } from 'lucide-react';
import { couponTypeLabel } from '@/domain/constants';
import { toggleIn } from '@/domain/filters';
import { categoryLabel } from '@/features/coupons';

/** Active filters as removable chips (shown when the panel is closed). */
export function ActiveFilters({ filters, onChange }) {
  const items = [
    ...[...filters.cats].map((c) => ({ key: `c-${c}`, label: categoryLabel(c), remove: () => onChange({ ...filters, cats: toggleIn(filters.cats, c) }) })),
    ...[...filters.types].map((t) => ({ key: `t-${t}`, label: couponTypeLabel(t), remove: () => onChange({ ...filters, types: toggleIn(filters.types, t) }) })),
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
