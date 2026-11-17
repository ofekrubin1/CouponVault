import { useRef, useState } from 'react';
import { ChevronDown, Plus, X, Hash, Type, Gift, Check } from 'lucide-react';
import { Button, DateInput, Field, Input, LiquidSelect, Segmented, Sheet, Switch, TextArea, cx } from '@/ui';
import { COUPON_FORMATS, COUPON_TYPES, EXPIRY_PRESETS, hasValue } from '@/domain/constants';
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
  const [initial] = useState(() => JSON.stringify(formFromCoupon(coupon)));
  const unsaved = JSON.stringify(f) !== initial;

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
      tall
      title={editing ? 'עריכת קופון' : 'קופון חדש'}
      onClose={onClose}
      unsaved={unsaved}
      dragFromContent={false}
      footer={
        <Button variant="primary" size="lg" className="w-full" onClick={save} icon={editing ? Check : Plus} data-testid="coupon-save">
          {editing ? 'שמור שינויים' : 'הוסף קופון'}
        </Button>
      }
    >
      <div ref={body} className="space-y-4 pb-2">
        {/* name and type share a row: the type is a compact drop-down on the left */}
        <div className="grid grid-cols-[1fr_7.25rem] items-start gap-2">
          <Field id="title" label="שם הקופון" error={errors.title}>
            <Input id="title" icon={Type} className="!py-2" value={f.title} onChange={set('title')} placeholder={f.type === 'product' ? 'למשל: ארוחת מקרויאל' : 'למשל: שובר לזארה'} error={errors.title} enterKeyHint="next" />
          </Field>
          <Field id="type" label="סוג">
            <LiquidSelect id="type" label="סוג הקופון" value={f.type} onChange={set('type')} options={COUPON_TYPES} />
          </Field>
        </div>

        <Field id="store" label="איפה אפשר לממש" error={errors.store}>
          <StoreInput value={f.store} onChange={set('store')} stores={stores} error={errors.store} />
        </Field>

        <Field id="category" label="קטגוריות" aside={<span className="text-[10px] font-light text-mute/45">אפשר לבחור כמה</span>} error={errors.category}>
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

        {/* amount and expiry share a row; without an amount the expiry takes the whole row */}
        <div className={cx('grid gap-3', hasValue(f.type) && 'grid-cols-2')}>
          {hasValue(f.type) && (
            <Field id="value" label={f.type === 'money' ? 'סכום' : 'אחוז הנחה'} error={errors.value} hint={editing && f.type === 'money' && used > 0 ? `כבר נוצלו ₪${used}` : undefined}>
              <Input
                id="value"
                type="number"
                inputMode="decimal"
                min="0"
                value={f.value}
                onChange={set('value')}
                placeholder={f.type === 'money' ? '200' : 'לא חובה'}
                unit={unit}
                error={errors.value}
              />
            </Field>
          )}
          <Field id="expiry" label="בתוקף עד">
            <DateInput id="expiry" value={f.expiry} onChange={set('expiry')} placeholder="ללא תוקף" />
            <div className="flex gap-1.5 pt-1">
              {(hasValue(f.type) ? EXPIRY_PRESETS.filter((p) => p.months >= 3) : EXPIRY_PRESETS).map((p) => (
                <button
                  key={p.months}
                  type="button"
                  onClick={() => set('expiry')(presetDate(p.months))}
                  className="flex-auto whitespace-nowrap rounded-[8px] bg-navy/5 px-1.5 py-1 text-[11px] font-medium text-navy/60 active:bg-navy/10"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* code and digital / physical share a row: the format on the left */}
        <div className="grid grid-cols-[1fr_8rem] items-start gap-2">
          <Field id="code" label="קוד / מספר שובר" error={errors.code}>
            <Input
              id="code"
              icon={Hash}
              dir="ltr"
              className="text-left font-mono tracking-wider placeholder:text-right placeholder:font-sans placeholder:tracking-normal"
              value={f.code}
              onChange={set('code')}
              placeholder="למשל: 1445-3680"
              error={errors.code}
              autoCapitalize="characters"
              autoComplete="off"
            />
          </Field>
          <Field id="format" label="השובר הוא">
            <Segmented size="sm" name="דיגיטלי או פיזי" value={f.format} onChange={set('format')} options={COUPON_FORMATS} className="h-[46px]" />
          </Field>
        </div>

        {/* optional 3-digit verification code (like a credit card's), behind a switch */}
        <div data-field="cvv">
          <div className="flex min-h-[46px] items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 text-xs font-medium tracking-wide text-mute">
              <Switch checked={f.hasCvv} onChange={set('hasCvv', 'cvv')} label="קוד אימות" />
              קוד אימות
              <span className="font-light text-mute/45">(לא חובה)</span>
            </label>
            {f.hasCvv && (
              <Input
                id="cvv"
                dir="ltr"
                inputMode="numeric"
                autoComplete="off"
                value={f.cvv}
                onChange={(e) => set('cvv')(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="3 ספרות"
                aria-label="קוד אימות (3 ספרות)"
                error={errors.cvv}
                className="w-[8rem] text-center font-mono tracking-[0.35em] placeholder:font-sans placeholder:tracking-normal"
              />
            )}
          </div>
          {errors.cvv && (
            <p role="alert" className="mt-1 text-left text-[12px] font-medium text-danger">
              {errors.cvv}
            </p>
          )}
        </div>

        <button type="button" className="flex items-center gap-1 text-[13px] font-medium text-gold-dark" onClick={() => setMore((m) => !m)} aria-expanded={more}>
          פרטים נוספים
          <ChevronDown className={cx('h-4 w-4 transition-transform', more && 'rotate-180')} strokeWidth={1.75} />
        </button>
        {more && (
          <div className="space-y-3">
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
