import { useState } from 'react';
import { Tag, X, Plus } from 'lucide-react';
import { Card, Input, cx, useConfirm, useToast } from '@/ui';
import { addCategory, removeCategory } from '@/data';
import { DEFAULT_CATEGORIES } from '@/domain/constants';
import { CategoryIcon } from '@/features/coupons';
import { SectionTitle } from '../SectionTitle';

/** Built-in categories plus the family's own (add / remove). */
export function CategoriesSection({ family }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [name, setName] = useState('');
  const custom = family.customCategories || [];

  const add = () => {
    const c = name.trim();
    if (!c) return;
    if (DEFAULT_CATEGORIES.includes(c) || custom.includes(c)) {
      toast('הקטגוריה כבר קיימת', 'error');
      return;
    }
    addCategory(family.id, c);
    setName('');
    toast('הקטגוריה נוספה');
  };
  const remove = async (c) => {
    const ok = await confirm({ title: 'הסרת קטגוריה', message: `להסיר את "${c}"? קופונים קיימים ישמרו את הקטגוריה.`, confirmText: 'הסר', danger: true });
    if (ok) removeCategory(family.id, c);
  };

  return (
    <Card>
      <SectionTitle icon={Tag}>קטגוריות</SectionTitle>
      <div className="flex flex-wrap gap-1.5">
        {[...DEFAULT_CATEGORIES, ...custom].map((c) => {
          const isCustom = custom.includes(c);
          return (
            <span
              key={c}
              className={cx('flex items-center gap-1.5 rounded-[9px] border px-2.5 py-1.5 text-[13px]', isCustom ? 'border-gold/40 bg-gold/[0.06] text-ink' : 'border-white/80 bg-white/55 text-mute')}
            >
              <CategoryIcon category={c} />
              {c}
              {isCustom && (
                <button type="button" onClick={() => remove(c)} aria-label={`הסר ${c}`} className="-ml-1 rounded-full p-0.5 text-mute/50 hover:bg-white">
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </span>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <div className="flex-1">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="קטגוריה חדשה" onKeyDown={(e) => e.key === 'Enter' && add()} aria-label="קטגוריה חדשה" />
        </div>
        <button type="button" onClick={add} className="flex items-center gap-1 rounded-[10px] bg-gradient-to-b from-gold to-gold-dark px-4 text-sm font-medium text-white shadow-goldbtn">
          <Plus className="h-4 w-4" strokeWidth={2} /> הוסף
        </button>
      </div>
    </Card>
  );
}
