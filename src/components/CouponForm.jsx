import { useMemo, useState } from 'react';
import { arrayUnion } from 'firebase/firestore';
import { ChevronDown } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { COUPON_TYPES } from '../constants';
import { addCoupon, updateCoupon, updateFamily } from '../data';
import { useToast } from './Toast';

const NEW_CAT = '__new__';

export default function CouponForm({ coupon, family, user, categories, stores, onClose }) {
  const editing = !!coupon;
  const toast = useToast();
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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const usedSoFar = useMemo(
    () => (coupon?.usages || []).reduce((s, u) => s + (Number(u.amount) || 0), 0),
    [coupon],
  );

  async function save() {
    setErr('');
    if (!f.title.trim()) return setErr('חסר שם לקופון');
    if (!f.store.trim()) return setErr('חסר איפה אפשר לממש');
    const category = f.category === NEW_CAT ? newCat.trim() : f.category;
    if (f.category === NEW_CAT && !category) return setErr('חסר שם לקטגוריה החדשה');
    const value = f.value === '' ? null : Number(f.value);
    if (f.type === 'money' && !(value > 0)) return setErr('בשובר כספי צריך סכום');
    if (value != null && (Number.isNaN(value) || value < 0)) return setErr('ערך לא תקין');

    const data = {
      title: f.title.trim(),
      store: f.store.trim(),
      category: category || '',
      type: f.type,
      value: f.type === 'other' ? null : value,
      expiry: f.expiry || null,
      code: f.code.trim(),
      source: f.source.trim(),
      notes: f.notes.trim(),
    };

    setBusy(true);
    try {
      if (category && !categories.includes(category)) {
        await updateFamily(family.id, { customCategories: arrayUnion(category) });
      }
      if (editing) {
        if (data.type === 'money') {
          data.balance = Math.max(0, Math.round((value - usedSoFar) * 100) / 100);
        } else {
          data.balance = null;
        }
        await updateCoupon(family.id, coupon.id, data);
        toast('הקופון עודכן');
      } else {
        await addCoupon(family.id, user, data);
        toast('הקופון נוסף');
      }
      onClose();
    } catch (e) {
      console.error(e);
      setErr('השמירה נכשלה. נסה שוב.');
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      title={editing ? 'עריכת קופון' : 'קופון חדש'}
      onClose={onClose}
      footer={
        <button className="btn-primary w-full" onClick={save} disabled={busy}>
          {busy ? 'שומר…' : editing ? 'שמור שינויים' : 'הוסף קופון'}
        </button>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">שם הקופון *</label>
          <input className="input" value={f.title} onChange={set('title')} placeholder="למשל: שובר מתנה לזארה" autoFocus={!editing} />
        </div>

        <div>
          <label className="label">איפה אפשר לממש *</label>
          <input className="input" value={f.store} onChange={set('store')} list="stores-list" placeholder="למשל: זארה, כל סניפי שופרסל" />
          <datalist id="stores-list">
            {stores.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>

        <div>
          <label className="label">קטגוריה</label>
          <select className="input" value={f.category} onChange={set('category')}>
            <option value="">ללא</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value={NEW_CAT}>+ קטגוריה חדשה…</option>
          </select>
          {f.category === NEW_CAT && (
            <input className="input mt-2" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="שם הקטגוריה" autoFocus />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">סוג</label>
            <select className="input" value={f.type} onChange={set('type')}>
              {Object.entries(COUPON_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {f.type !== 'other' && (
            <div>
              <label className="label">{f.type === 'money' ? 'סכום (₪) *' : 'אחוז הנחה'}</label>
              <input className="input" type="number" inputMode="decimal" min="0" value={f.value} onChange={set('value')} placeholder={f.type === 'money' ? '200' : '20'} />
            </div>
          )}
        </div>
        {editing && f.type === 'money' && usedSoFar > 0 && (
          <p className="-mt-1 text-xs text-slate-500">כבר נוצלו {usedSoFar}₪. היתרה תחושב מחדש לפי הסכום.</p>
        )}

        <div>
          <label className="label">תוקף עד</label>
          <input className="input" type="date" value={f.expiry} onChange={set('expiry')} />
          <p className="mt-1 text-xs text-slate-400">אפשר להשאיר ריק אם אין תוקף</p>
        </div>

        <div>
          <label className="label">קוד / מספר שובר</label>
          <input className="input font-mono" dir="ltr" value={f.code} onChange={set('code')} placeholder="ABC-1234" />
        </div>

        <button type="button" className="flex items-center gap-1 text-sm font-medium text-brand-600" onClick={() => setMore((m) => !m)}>
          פרטים נוספים
          <ChevronDown size={16} className={`transition ${more ? 'rotate-180' : ''}`} />
        </button>
        {more && (
          <>
            <div>
              <label className="label">התקבל מ-</label>
              <input className="input" value={f.source} onChange={set('source')} placeholder="למשל: מתנה מהעבודה, Buyme" />
            </div>
            <div>
              <label className="label">הערות</label>
              <textarea className="input min-h-[80px]" value={f.notes} onChange={set('notes')} placeholder="מינימום קנייה, רק בסניפים…" />
            </div>
          </>
        )}

        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
      </div>
    </BottomSheet>
  );
}
