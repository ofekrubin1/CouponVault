import { Plus, Check } from 'lucide-react';
import { Input, cx } from '@/ui';
import { CategoryIcon } from '../CategoryTile';

/** Multi-select category chips + "new" chip that reveals a name field. */
export function CategoryPicker({ categories, selected, onToggle, adding, onAdding, newName, onNewName, error }) {
  return (
    <>
      {/* an even grid: a family's own category (e.g. "דרים קארד") gets the same cell as the rest, not half a row */}
      <div className="grid grid-cols-3 gap-1.5">
        {categories.map((c) => {
          const on = selected.includes(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(c)}
              className={cx('flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-[11px] border px-[7px] py-2 text-[12.5px] font-medium transition-colors', on ? 'chip-on' : 'border-white/80 bg-white/60 text-mute')}
            >
              {on ? <Check className="h-3 w-3 text-accent" strokeWidth={2.4} /> : <CategoryIcon category={c} className="h-3 w-3" />}
              <span className="truncate">{c}</span>
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={adding}
          onClick={() => onAdding(!adding)}
          className={cx(
            'flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-[11px] border border-dashed px-[7px] py-2 text-[12.5px] font-medium',
            adding ? 'border-gold bg-gold/10 text-gold-deep' : 'border-gold/50 text-gold-dark',
          )}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.2} /> חדשה
        </button>
      </div>
      {adding && <Input value={newName} onChange={(e) => onNewName(e.target.value)} placeholder="שם הקטגוריה החדשה" autoFocus error={error} className="mt-2" />}
    </>
  );
}
