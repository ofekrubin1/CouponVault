import { Plus } from 'lucide-react';
import { Input, cx } from '@/ui';
import { NEW_CATEGORY } from '@/domain/couponForm';
import { CategoryIcon } from '../CategoryTile';

/** Category chips + "new" chip that reveals a name field. */
export function CategoryPicker({ categories, value, onChange, newName, onNewName, error }) {
  const isNew = value === NEW_CATEGORY;
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => {
          const on = value === c;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? '' : c)}
              className={cx('flex items-center gap-1.5 rounded-[9px] border px-2.5 py-1.5 text-[13px] font-medium transition-colors', on ? 'chip-on' : 'border-white/80 bg-white/60 text-mute')}
            >
              <CategoryIcon category={c} />
              {c}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={isNew}
          onClick={() => onChange(isNew ? '' : NEW_CATEGORY)}
          className={cx(
            'flex items-center gap-1 rounded-[9px] border border-dashed px-2.5 py-1.5 text-[13px] font-medium',
            isNew ? 'border-gold bg-gold/10 text-gold-deep' : 'border-gold/50 text-gold-dark',
          )}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} /> חדשה
        </button>
      </div>
      {isNew && <Input value={newName} onChange={(e) => onNewName(e.target.value)} placeholder="שם הקטגוריה החדשה" autoFocus error={error} className="mt-2" />}
    </>
  );
}
