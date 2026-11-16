import { useMemo, useRef, useState } from 'react';
import { arrayUnion } from 'firebase/firestore';
import { ChevronDown, Plus, X, Hash, Store, Type, Gift, Check } from 'lucide-react';
import Sheet from '../ui/Sheet';
import { Button, Segmented, cx } from '../ui/primitives';
import { Field, Input, TextArea, DateInput } from '../ui/fields';
import { COUPON_TYPES, categoryStyle } from '../constants';
import { addCoupon, updateCoupon, updateFamily } from '../data';
import { EXPIRY_PRESETS, presetDate, round2, usedAmount } from '../lib';
import { useToast } from '../ui/feedback';

const NEW_CAT = '__new__';

function validate(f, newCat) {
  const e = {};
  if (!f.title.trim()) e.title = 'חסר שם לקופון';
  if (!f.store.trim()) e.store = 'חסר איפה אפשר לממש';
  if (f.category === NEW_CAT && !newCat.trim()) e.category = 'חסר שם לקטגוריה החדשה';
  const v = f.value === '' ? null : Number(f.value);
  if (f.type === 'money' && !(v > 0)) e.value = 'בשובר כספי צריך להזין סכום';
  if (f.type === 'percent' && v != null && !(v > 0 && v <= 100)) e.value = 'אחוז בין 1 ל-100';
  return e;
}

const ORDER = ['title', 'store', 'category', 'value'];

export default function CouponForm({ coupon, family, user, categories, stores, onClose }) {
  const editing = !!coupon;
  const toast = useToast();
  const body = useRef(null);
  const [f, setF] = useState(() => ({
    title: coupon?.title || '',
    store: coupon?.store || '',
    category: coupon?.category || '',
    type: coupon?.type || 'money',
    value: coupon?.value ?? '',
    expiry: coupon?.expiry || '',
    code: coupon?.code || '',
    source: coupon?.source || '',
    notes: coupon?.notes || '',
  }));
  const [newCat, setNewCat] = useState('');
  const [more, setMore] = useState(!!(coupon?.source || coupon?.notes));
  const [errors, setErrors] = useState({});
  const [storeFocus, setStoreFocus] = useState(false);

  const set = (k) => (e) => {
    const v = e?.target ? e.target.value : e;
    setF((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const used = useMemo(() => (coupon ? usedAmount(coupon) : 0), [coupon]);
  const storeSuggestions = useMemo(() => {
    const q = f.store.trim().toLowerCase();
    return stores.filter((s) => s.toLowerCase() !== q && (!q || s.toLowerCase().includes(q))).slice(0, 6);
  }, [stores, f.store]);

  function save() {
    const e = validate(f, newCat);
    setErrors(e);
    const first = ORDER.find((k) => e[k]);
    if (first) {
      const el = body.current?.querySelector(`[data-field="${first}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.querySelector('input')?.focus({ preventScroll: true });
      return;
    }

    const category = f.category === NEW_CAT ? newCat.trim() : f.category;
    const value = f.type === 'other' || f.value === '' ? null : Number(f.value);
    const data = {
      title: f.title.trim(),
      store: f.store.trim(),
      category: category || '',
      type: f.type,
      value,
      expiry: f.expiry || null,
      code: f.code.trim(),
      source: f.source.trim(),
      notes: f.notes.trim(),
    };

    if (category && !categories.includes(category)) {
      updateFamily(family.id, { customCategories: arrayUnion(category) });
    }
    if (editing) {
      data.balance = data.type === 'money' ? Math.max(0, round2(value - used)) : null;
      updateCoupon(family.id, coupon.id, data);
      toast('השינויים נשמרו');
    } else {
      addCoupon(family.id, user, data);
      toast('הקופון נוסף');
    }
    onClose();
  }

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
          <Input
            id="store"
            icon={Store}
            value={f.store}
            onChange={set('store')}
            onFocus={() => setStoreFocus(true)}
            onBlur={() => setTimeout(() => setStoreFocus(false), 150)}
            placeholder="למשל: שופרסל, Buyme, כל רשתות האופנה"
            error={errors.store}
            autoComplete="off"
          />
          {storeFocus && storeSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1" data-testid="store-suggestions">
              {storeSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => set('store')(s)}
                  className="rounded-[10px] border border-white/80 bg-white/55 px-2.5 py-1 text-xs text-mute"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field id="category" label="קטגוריה" error={errors.category}>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => {
              const on = f.category === c;
              const { icon: Icon, color } = categoryStyle(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set('category')(on ? '' : c)}
                  className={cx(
                    'flex items-center gap-1.5 rounded-[9px] border px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                    on ? 'border-navy bg-navy text-white' : 'border-line bg-white text-mute',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: on ? '#C9A45B' : color }} strokeWidth={1.75} />
                  {c}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={f.category === NEW_CAT}
              onClick={() => set('category')(f.category === NEW_CAT ? '' : NEW_CAT)}
              className={cx(
                'flex items-center gap-1 rounded-[9px] border border-dashed px-2.5 py-1.5 text-[13px] font-medium',
                f.category === NEW_CAT ? 'border-gold bg-gold/10 text-gold-deep' : 'border-gold/50 text-gold-dark',
              )}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} /> חדשה
            </button>
          </div>
          {f.category === NEW_CAT && (
            <Input
              value={newCat}
              onChange={(e) => {
                setNewCat(e.target.value);
                if (errors.category) setErrors((p) => ({ ...p, category: undefined }));
              }}
              placeholder="שם הקטגוריה החדשה"
              autoFocus
              error={errors.category}
              className="mt-2"
            />
          )}
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
          <Input id="code" icon={Hash} dir="ltr" className="text-left font-mono tracking-wider" value={f.code} onChange={set('code')} placeholder="ABC-1234" autoCapitalize="characters" autoComplete="off" />
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
