import { useRef, useState } from 'react';
import { ChevronDown, Plus, X, Hash, Type, Gift, Check } from 'lucide-react';
import { Button, DateInput, Field, Input, LiquidSelect, Segmented, Sheet, TextArea, cx, useConfirm } from '@/ui';
import { COUPON_FORMATS, COUPON_TYPES, hasValue } from '@/domain/constants';
import { usedAmount } from '@/domain/coupon';
import { useCouponActions } from '../useCouponActions';
import { CategoryPicker } from './CategoryPicker';
import { CvvField } from './CvvField';
import { StoreInput } from './StoreInput';
import { useCouponForm } from './useCouponForm';
import { PhotoButton, usePhotoField } from '../photo/PhotoButton';

/** Add / edit a coupon. Errors show next to their field and the form scrolls to the first one. */
export function CouponFormSheet({ coupon, family, user, categories, stores, onClose }) {
  const editing = !!coupon;
  const actions = useCouponActions(family, user);
  const body = useRef(null);
  const { f, set, errors, hasErrors, unsaved, pickable, toggleCategory, submit } = useCouponForm(coupon, categories, body);
  const photo = usePhotoField(family.id, coupon);
  const [more, setMore] = useState(!!(coupon?.source || coupon?.notes));

  const confirm = useConfirm();
  const save = () =>
    submit(
      async (data) => {
        // where to use it is optional, but easy to forget: ask before saving without it
        if (!data.store) {
          const ok = await confirm({
            title: 'לא צוין איפה אפשר לממש',
            message: 'השדה "איפה אפשר לממש" ריק. לשמור את הקופון בכל זאת?',
            confirmText: 'שמירה בכל זאת',
            cancelText: 'חזרה למילוי',
          });
          if (!ok) {
            body.current?.querySelector('#store')?.focus();
            return;
          }
        }
        actions.save(data, coupon, categories, photo.change);
        onClose();
      },
      { hasPhoto: !!photo.preview },
    );

  const used = editing ? usedAmount(coupon) : 0;
  const unit = f.type === 'money' ? '₪' : f.type === 'percent' ? '%' : null;

  return (
    <Sheet
      tall
      title={editing ? 'עריכת קופון' : 'קופון חדש'}
      onClose={onClose}
      unsaved={unsaved || !!photo.change}
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

        <Field id="store" label="איפה אפשר לממש" aside={<span className="text-[10px] font-light text-mute/45">לא חובה</span>} error={errors.store}>
          <StoreInput value={f.store} onChange={set('store')} stores={stores} error={errors.store} />
        </Field>

        <Field id="category" label="קטגוריות" aside={<span className="text-[10px] font-light text-mute/45">אפשר לבחור כמה</span>} error={errors.category}>
          <CategoryPicker
            categories={pickable}
            selected={f.categories}
            onToggle={toggleCategory}
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
          </Field>
        </div>

        {/* the voucher photo (e.g. its barcode) attaches beside the code */}
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
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
          </div>
          <PhotoButton field={photo} />
        </div>

        {/* the verification-code switch, with digital / physical in small on its left */}
        <CvvField
          on={f.hasCvv}
          onToggle={set('hasCvv', 'cvv')}
          value={f.cvv}
          onChange={set('cvv')}
          error={errors.cvv}
          aside={<Segmented size="sm" name="דיגיטלי או פיזי" value={f.format} onChange={set('format')} options={COUPON_FORMATS} className="w-[7.5rem] shrink-0" />}
        />

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
        {hasErrors && (
          <p className="flex items-center gap-1.5 rounded-[10px] bg-danger/5 px-3 py-2 text-[12px] text-danger">
            <X className="h-3.5 w-3.5" strokeWidth={2} /> יש להשלים את השדות המסומנים
          </p>
        )}
      </div>
    </Sheet>
  );
}
