import { Plus, Check } from 'lucide-react';
import { Input, cx } from '@/ui';
import { CategoryIcon } from '../CategoryTile';

/** Multi-select category chips + "new" chip that reveals a name field. */
export function CategoryPicker({ categories, selected, onToggle, adding, onAdding, newName, onNewName, error }) {
  return (
    <>
      <div className="flex flex-wrap gap-1">
        {categories.map((c) => {
          const on = selected.includes(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(c)}
              className={cx('flex flex-auto items-center justify-center gap-1 whitespace-nowrap rounded-[9px] border px-2 py-1 text-[12px] font-medium transition-colors', on ? 'chip-on' : 'border-white/80 bg-white/60 text-mute')}
            >
              {on ? <Check className="h-3 w-3 text-accent" strokeWidth={2.4} /> : <CategoryIcon category={c} className="h-3 w-3" />}
              {c}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={adding}
          onClick={() => onAdding(!adding)}
          className={cx(
            'flex flex-auto items-center justify-center gap-1 whitespace-nowrap rounded-[9px] border border-dashed px-2 py-1 text-[12px] font-medium',
            adding ? 'border-gold bg-gold/10 text-gold-deep' : 'border-gold/50 text-gold-dark',
          )}
        >
          <Plus className="h-3 w-3" strokeWidth={2.2} /> חדשה
        </button>
      </div>
      {adding && <Input value={newName} onChange={(e) => onNewName(e.target.value)} placeholder="שם הקטגוריה החדשה" autoFocus error={error} className="mt-2" />}
    </>
  );
}
