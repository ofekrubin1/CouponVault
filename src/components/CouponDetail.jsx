import { useState } from 'react';
import { Copy, Pencil, Trash2, Store, Tag, Gift, Calendar, StickyNote, User, RotateCcw, Undo2 } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { deleteCoupon, redeemCoupon, restoreCoupon, undoLastUsage } from '../data';
import { expiryLabel, formatDate, isExpired, money, urgency, valueLabel } from '../lib';
import { useToast } from './Toast';

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon size={18} className="mt-0.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="break-words">{children}</div>
      </div>
    </div>
  );
}

export default function CouponDetail({ coupon, family, user, onClose, onEdit }) {
  const toast = useToast();
  const [partial, setPartial] = useState(false);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const used = coupon.status === 'used';
  const expired = isExpired(coupon);
  const isMoney = coupon.type === 'money';
  const u = urgency(coupon, family.alertDays ?? 14);

  async function run(fn, msg) {
    setBusy(true);
    setErr('');
    try {
      await fn();
      if (msg) toast(msg);
      return true;
    } catch (e) {
      console.error(e);
      setErr('הפעולה נכשלה. נסה שוב.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function usePartial() {
    const n = Number(amount);
    if (!(n > 0)) return setErr('יש להזין סכום');
    if (n > coupon.balance) return setErr(`הסכום גדול מהיתרה (${money(coupon.balance)})`);
    const ok = await run(() => redeemCoupon(family.id, user, coupon, n), n === coupon.balance ? 'השובר נוצל במלואו' : `נותרו ${money(coupon.balance - n)}`);
    if (ok) {
      setPartial(false);
      setAmount('');
    }
  }

  async function useAll() {
    const ok = await run(() => redeemCoupon(family.id, user, coupon, null), 'סומן כמומש');
    if (ok) onClose();
  }

  async function remove() {
    if (!confirm('למחוק את הקופון לצמיתות?')) return;
    const ok = await run(() => deleteCoupon(family.id, coupon.id), 'הקופון נמחק');
    if (ok) onClose();
  }

  function copyCode() {
    navigator.clipboard?.writeText(coupon.code).then(() => toast('הקוד הועתק'));
  }

  const usages = coupon.usages || [];

  let footer;
  if (used || expired) {
    footer = (
      <button className="btn-secondary w-full" disabled={busy} onClick={() => (expired && !used ? onEdit() : run(() => restoreCoupon(family.id, coupon), 'הקופון שוחזר'))}>
        <RotateCcw size={18} />
        {expired && !used ? 'עדכון תוקף' : 'החזר לפעילים'}
      </button>
    );
  } else if (partial) {
    footer = (
      <div className="flex gap-2">
        <input
          className="input flex-1"
          type="number"
          inputMode="decimal"
          min="0"
          max={coupon.balance}
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`כמה ₪ נוצלו? (עד ${coupon.balance})`}
          onKeyDown={(e) => e.key === 'Enter' && usePartial()}
        />
        <button className="btn-primary" onClick={usePartial} disabled={busy}>אישור</button>
        <button className="btn-secondary" onClick={() => { setPartial(false); setErr(''); }}>ביטול</button>
      </div>
    );
  } else {
    footer = (
      <div className="flex gap-2">
        <button className="btn-primary flex-1" onClick={useAll} disabled={busy}>מימשתי הכול ✓</button>
        {isMoney && (
          <button className="btn-secondary flex-1" onClick={() => setPartial(true)} disabled={busy}>שימוש חלקי</button>
        )}
      </div>
    );
  }

  return (
    <BottomSheet title={coupon.title} onClose={onClose} footer={footer}>
      {/* headline */}
      <div className="mb-3 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 p-4 text-white">
        {isMoney ? (
          <>
            <div className="text-sm opacity-80">יתרה</div>
            <div className="text-3xl font-extrabold">{money(coupon.balance)}</div>
            {coupon.balance !== coupon.value && <div className="text-sm opacity-80">מתוך {money(coupon.value)}</div>}
            {coupon.value > 0 && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/30">
                <div className="h-full rounded-full bg-white" style={{ width: `${(coupon.balance / coupon.value) * 100}%` }} />
              </div>
            )}
          </>
        ) : (
          <div className="text-2xl font-extrabold">{valueLabel(coupon) || 'קופון'}</div>
        )}
        <div className="mt-2 text-sm">
          {used ? (
            <span>מומש {coupon.usedAt ? `ב-${formatDate(coupon.usedAt.slice(0, 10))}` : ''}{coupon.usedByName ? ` ע"י ${coupon.usedByName}` : ''}</span>
          ) : (
            <span className={u === 'red' ? 'rounded bg-red-500 px-1.5 font-bold' : u === 'orange' ? 'rounded bg-amber-400 px-1.5 font-bold text-amber-950' : ''}>
              {expiryLabel(coupon)}
            </span>
          )}
        </div>
      </div>

      {coupon.code && (
        <button onClick={copyCode} className="mb-2 flex w-full items-center justify-between rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 active:bg-slate-50">
          <span dir="ltr" className="font-mono text-lg font-bold tracking-wider">{coupon.code}</span>
          <span className="flex items-center gap-1 text-sm text-brand-600"><Copy size={16} /> העתק</span>
        </button>
      )}

      <div className="divide-y divide-slate-100">
        <Row icon={Store} label="איפה מממשים">{coupon.store}</Row>
        {coupon.category && <Row icon={Tag} label="קטגוריה">{coupon.category}</Row>}
        {coupon.source && <Row icon={Gift} label="התקבל מ-">{coupon.source}</Row>}
        <Row icon={Calendar} label="תוקף">{coupon.expiry ? formatDate(coupon.expiry) : 'ללא תוקף'}</Row>
        {coupon.notes && <Row icon={StickyNote} label="הערות"><span className="whitespace-pre-wrap">{coupon.notes}</span></Row>}
        {coupon.createdByName && <Row icon={User} label="נוסף ע״י">{coupon.createdByName}</Row>}
      </div>

      {usages.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-600">היסטוריית שימוש</h3>
            <button className="flex items-center gap-1 text-xs text-slate-500" disabled={busy} onClick={() => run(() => undoLastUsage(family.id, coupon), 'השימוש האחרון בוטל')}>
              <Undo2 size={14} /> בטל אחרון
            </button>
          </div>
          <ul className="space-y-1 text-sm">
            {[...usages].reverse().map((us, i) => (
              <li key={i} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{formatDate(us.at.slice(0, 10))} · {us.byName || 'משתמש'}</span>
                {us.amount != null && isMoney && <span className="font-semibold">−{money(us.amount)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}

      <div className="mt-4 flex gap-2">
        <button className="btn-secondary flex-1" onClick={onEdit}><Pencil size={16} /> עריכה</button>
        <button className="btn-danger flex-1" onClick={remove} disabled={busy}><Trash2 size={16} /> מחיקה</button>
      </div>
    </BottomSheet>
  );
}
