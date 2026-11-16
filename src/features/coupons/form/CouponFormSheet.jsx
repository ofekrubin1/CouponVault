import { useRef, useState } from 'react';
import { ChevronDown, Plus, X, Hash, Type, Gift, Check } from 'lucide-react';
import { Button, DateInput, Field, Input, Segmented, Sheet, TextArea, cx } from '@/ui';
import { COUPON_TYPES, EXPIRY_PRESETS } from '@/domain/constants';
import { couponFromForm, firstInvalidField, formFromCoupon, validateCouponForm } from '@/domain/couponForm';
import { usedAmount } from '@/domain/coupon';
import { presetDate } from '@/domain/format';
import { useCouponActions } from '../useCouponActions';
import { CategoryPicker } from './CategoryPicker';
import { StoreInput } from './StoreInput';

/** Add / edit a coupon. Errors show next to their field and the form scrolls to the first one. */
export function CouponFormSheet({ coupon, family, user, categories, stores, onClose }) {
  const editing = !!coupon;
  const actions = useCouponActions(family, user);
  const body = useRef(null);
  const [f, setF] = useState(() => formFromCoupon(coupon));
  const [more, setMore] = useState(!!(coupon?.source || coupon?.notes));
  const [errors, setErrors] = useState({});

  const set = (k, errKey = k) => (e) => {
    const v = e?.target ? e.target.value : e;
    setF((p) => ({ ...p, [k]: v }));
    if (errors[errKey]) setErrors((p) => ({ ...p, [errKey]: undefined }));
  };

  function save() {
    const e = validateCouponForm(f);
    setErrors(e);
    const first = firstInvalidField(e);
    if (first) {
      const el = body.current?.querySelector(`[data-field="${first}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.querySelector('input')?.focus({ preventScroll: true });
      return;
    }
    actions.save(couponFromForm(f, coupon), coupon, categories);
    onClose();
  }

  const used = editing ? usedAmount(coupon) : 0;
  const unit = f.type === 'money' ? '₪' : f.type === 'percent' ? '%' : null;

  return (
    <Sheet
      title={editing ? 'עריכת קופון' : 'קופון חדש'}
      onClose={onClose}
      footer={
        <Button variant="primary" size="lg" className="w-full" onClick={save} icon={editing ? Check : Plus} data-testid="coupon-save">
          {editing ? 'שמור שינויים' : 'הוסף קופון'}
        </Button>
      }
    >
      <div ref={body} className="space-y-4 pb-2">
        <Field id="title" label="שם הקופון" error={errors.title}>
          <Input id="title" icon={Type} value={f.title} onChange={set('title')} placeholder="למשל: שובר מתנה לזארה" error={errors.title} enterKeyHint="next" />
        </Field>

        <Field id="store" label="איפה אפשר לממש" error={errors.store}>
          <StoreInput value={f.store} onChange={set('store')} stores={stores} error={errors.store} />
        </Field>

        <Field id="category" label="קטגוריות" hint="אפשר לבחור כמה" error={errors.category}>
          <CategoryPicker
            categories={categories}
            selected={f.categories}
            onToggle={(c) => set('categories')(f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c])}
            adding={f.addingCategory}
            onAdding={set('addingCategory', 'category')}
            newName={f.newCategory}
            onNewName={set('newCategory', 'category')}
            error={errors.category}
          />
        </Field>

        <Field label="סוג הקופון">
          <Segmented name="סוג הקופון" value={f.type} onChange={set('type')} options={COUPON_TYPES} />
        </Field>

        {f.type !== 'other' && (
          <Field
            id="value"
            label={f.type === 'money' ? 'סכום השובר' : 'אחוז ההנחה (לא חובה)'}
            error={errors.value}
            hint={editing && f.type === 'money' && used > 0 ? `כבר נוצלו ₪${used}. היתרה תחושב מחדש.` : undefined}
          >
            <Input
              id="value"
              type="number"
              inputMode="decimal"
              min="0"
              value={f.value}
              onChange={set('value')}
              placeholder={f.type === 'money' ? '200' : '20'}
              unit={unit}
              error={errors.value}
            />
          </Field>
        )}

        <Field id="expiry" label="בתוקף עד" hint={!f.expiry ? 'אפשר להשאיר ריק אם אין תוקף' : undefined}>
          <DateInput id="expiry" value={f.expiry} onChange={set('expiry')} placeholder="ללא תאריך תפוגה" />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {EXPIRY_PRESETS.map((p) => (
              <button
                key={p.months}
                type="button"
                onClick={() => set('expiry')(presetDate(p.months))}
                className="rounded-[8px] bg-navy/5 px-2.5 py-1 text-[11px] font-medium text-navy/60 active:bg-navy/10"
              >
                + {p.label}
              </button>
            ))}
          </div>
        </Field>

        <Field id="code" label="קוד / מספר שובר" hint="לא חובה">
          <Input
            id="code"
            icon={Hash}
            dir="ltr"
            className="text-left font-mono tracking-wider"
            value={f.code}
            onChange={set('code')}
            placeholder="ABC-1234"
            autoCapitalize="characters"
            autoComplete="off"
          />
        </Field>

        <button type="button" className="flex items-center gap-1 text-[13px] font-medium text-gold-dark" onClick={() => setMore((m) => !m)} aria-expanded={more}>
          פרטים נוספים
          <ChevronDown className={cx('h-4 w-4 transition-transform', more && 'rotate-180')} strokeWidth={1.75} />
        </button>
        {more && (
          <div className="space-y-4">
            <Field id="source" label="התקבל מ-">
              <Input id="source" icon={Gift} value={f.source} onChange={set('source')} placeholder="למשל: מתנה מהעבודה, יום הולדת" />
            </Field>
            <Field id="notes" label="הערות">
              <TextArea id="notes" value={f.notes} onChange={set('notes')} placeholder="מינימום קנייה, רק בסניפים…" />
            </Field>
          </div>
        )}
        {Object.values(errors).some(Boolean) && (
          <p className="flex items-center gap-1.5 rounded-[10px] bg-danger/5 px-3 py-2 text-[12px] text-danger">
            <X className="h-3.5 w-3.5" strokeWidth={2} /> יש להשלים את השדות המסומנים
          </p>
        )}
      </div>
    </Sheet>
  );
}
