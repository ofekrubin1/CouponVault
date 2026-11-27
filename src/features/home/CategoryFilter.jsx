import { useState } from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';
import { Button, Sheet, cx } from '@/ui';
import { CategoryIcon, categoryLabel, categoryStyle } from '@/features/coupons';

/**
 * Filter button beside the search. Opens a short sheet (it covers only the bottom of the screen) with the
 * categories that have coupons as small tiles (icon and name), 4 to a row; any number can be chosen and the list behind updates
 * at once. Highlighted with the number chosen while a filter is on.
 */
export function CategoryFilter({ counts, chosen, onChange, shownCount }) {
  const [open, setOpen] = useState(false);
  const on = chosen.size > 0;
  const toggle = (key) => {
    const next = new Set(chosen);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="סינון לפי קטגוריה"
        data-testid="category-filter"
        data-active={on || undefined}
        className={cx(
          'relative flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[12px] border transition-colors active:scale-[0.97]',
          on ? 'border-accent bg-accent text-white' : 'border-white/80 bg-white/70 text-navy/55 shadow-btn2',
        )}
      >
        <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {on && (
          <span className="absolute -left-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-navy px-1 text-[10px] font-bold text-white">
            {chosen.size}
          </span>
        )}
      </button>
      {open && (
        <Sheet
          title="סינון לפי קטגוריה"
          onClose={() => setOpen(false)}
          footer={
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1" onClick={() => setOpen(false)}>
                הצג {shownCount} קופונים
              </Button>
              {on && (
                <Button variant="soft" onClick={() => onChange(new Set())}>
                  ניקוי
                </Button>
              )}
            </div>
          }
        >
          <div className="grid grid-cols-4 gap-1.5 pb-1" role="listbox" aria-multiselectable="true" aria-label="קטגוריות" data-testid="category-menu">
            {counts.map(([key]) => {
              const sel = chosen.has(key);
              const { color } = categoryStyle(key);
              return (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={sel}
                  data-category={key}
                  onClick={() => toggle(key)}
                  className={cx(
                    'relative flex min-w-0 flex-col items-center gap-0.5 rounded-[11px] border px-1 py-1.5 text-center transition-colors',
                    sel ? 'border-accent bg-accent/[0.08]' : 'border-white/80 bg-white/70',
                  )}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-[8px]" style={{ background: `${color}15` }}>
                    {sel ? <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2.6} /> : <CategoryIcon category={key} className="h-3.5 w-3.5" />}
                  </span>
                  <span className={cx('w-full truncate text-[11.5px] font-semibold', sel ? 'text-navy' : 'text-ink')}>{categoryLabel(key)}</span>
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
    </>
  );
}
