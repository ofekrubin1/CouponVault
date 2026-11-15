import { useState } from 'react';
import {
  Copy, Pencil, Trash2, Store, Tag, Gift, Calendar, StickyNote, UserRound, RotateCcw, Undo2, Check, Clock, CheckCheck, Scissors,
} from 'lucide-react';
import Sheet from '../ui/Sheet';
import { Button, cx } from '../ui/primitives';
import { Input } from '../ui/fields';
import { categoryStyle } from '../constants';
import { deleteCoupon, redeemCoupon, restoreCoupon, undoLastUsage } from '../data';
import { expiryLabel, formatDate, isExpired, money, round2, urgency } from '../lib';
import { useConfirm, useToast } from '../ui/feedback';

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-navy/5">
        <Icon className="h-4 w-4 text-navy/50" strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium tracking-wide text-mute/50">{label}</p>
        <div className="mt-0.5 break-words text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

/** Navy "ticket" with the coupon's value. */
function Hero({ coupon, alertDays }) {
  const isMoney = coupon.type === 'money';
  const used = coupon.status === 'used';
  const expired = isExpired(coupon);
  const u = urgency(coupon, alertDays);
  const { icon: CatIcon } = categoryStyle(coupon.category);
  const pct = isMoney && coupon.value > 0 ? Math.max(0, Math.min(100, ((coupon.balance ?? 0) / coupon.value) * 100)) : 0;

  return (
    <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-navy-light via-navy to-[#071633] p-5 text-white shadow-hero" data-testid="coupon-hero">
      <span className="pointer-events-none absolute -left-10 -top-16 h-44 w-44 rounded-full bg-gold/15 blur-2xl" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
      <span className="pointer-events-none absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white" />
      <span className="pointer-events-none absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white" />

      <div className="relative flex items-center gap-2 text-white/70">
        <CatIcon className="h-4 w-4 text-gold" strokeWidth={1.5} />
        <span className="truncate text-xs font-light">{coupon.category || 'קופון'}</span>
        <span className="mx-1 text-white/30">·</span>
        <Store className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
        <span className="truncate text-xs font-light">{coupon.store}</span>
      </div>

      <div className="relative mt-4">
        {isMoney ? (
          <>
            <p className="text-[11px] font-light tracking-[0.06em] text-white/50">{used ? 'נוצל במלואו' : 'יתרה לניצול'}</p>
            <p dir="ltr" className="text-right text-[40px] font-semibold leading-none tracking-tight" data-testid="hero-balance">
              {money(coupon.balance ?? coupon.value)}
            </p>
            {coupon.balance !== coupon.value && <p className="mt-1 text-xs font-light text-white/50">מתוך {money(coupon.value)}</p>}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gradient-to-l from-gold to-[#E6CB8B] transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </>
        ) : coupon.type === 'percent' && coupon.value ? (
          <>
            <p className="text-[11px] font-light tracking-[0.06em] text-white/50">הנחה</p>
            <p dir="ltr" className="text-right text-[40px] font-semibold leading-none tracking-tight text-gold">{coupon.value}%</p>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Gift className="h-9 w-9 text-gold" strokeWidth={1.25} />
            <p className="text-lg font-medium">{coupon.title}</p>
          </div>
        )}
      </div>

      <div className="relative mt-4 flex items-center justify-between border-t border-dashed border-white/15 pt-3 text-xs">
        {used ? (
          <span className="flex items-center gap-1.5 text-white/70">
            <CheckCheck className="h-3.5 w-3.5 text-gold" strokeWidth={2} />
            מומש {coupon.usedAt ? `ב-${formatDate(coupon.usedAt)}` : ''}
            {coupon.usedByName ? ` ע״י ${coupon.usedByName}` : ''}
          </span>
        ) : (
          <span
            className={cx(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium',
              expired ? 'bg-white/10 text-white/60' : u === 'red' ? 'bg-danger text-white' : u === 'gold' ? 'bg-gold text-navy' : 'bg-white/10 text-white/80',
            )}
          >
            <Clock className="h-3.5 w-3.5" strokeWidth={2} />
            {expiryLabel(coupon)}
          </span>
        )}
        {coupon.expiry && !used && <span className="font-light text-white/40">{formatDate(coupon.expiry)}</span>}
      </div>
    </div>
  );
}

export default function CouponDetail({ coupon, family, user, onClose, onEdit }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [partial, setPartial] = useState(false);
  const [amount, setAmount] = useState('');
  const [err, setErr] = useState('');

  const used = coupon.status === 'used';
  const expired = isExpired(coupon);
  const isMoney = coupon.type === 'money';
  const alertDays = family.alertDays ?? 14;
  const usages = coupon.usages || [];
  const n = Number(amount);
  const left = isMoney && n > 0 ? round2((coupon.balance ?? 0) - n) : null;

  function usePartial() {
    if (!(n > 0)) return setErr('יש להזין סכום');
    if (n > (coupon.balance ?? 0)) return setErr(`הסכום גדול מהיתרה (${money(coupon.balance)})`);
    const r = redeemCoupon(family.id, user, coupon, n);
    toast(r.finished ? 'השובר נוצל במלואו' : `נוצלו ${money(n)} · נותרו ${money(r.left)}`);
    setPartial(false);
    setAmount('');
    setErr('');
    if (r.finished) onClose();
  }

  async function useAll() {
    const ok = await confirm({
      title: 'לסמן כמומש?',
      message: isMoney ? `כל היתרה (${money(coupon.balance)}) תסומן כנוצלה והקופון יעבור לארכיון.` : 'הקופון יעבור לארכיון. אפשר להחזיר אותו משם.',
      confirmText: 'כן, מימשתי',
    });
    if (!ok) return;
    redeemCoupon(family.id, user, coupon, null);
    toast('סומן כמומש ועבר לארכיון');
    onClose();
  }

  async function remove() {
    const ok = await confirm({ title: 'מחיקת קופון', message: `למחוק את "${coupon.title}" לצמיתות?`, confirmText: 'מחק', danger: true });
    if (!ok) return;
    deleteCoupon(family.id, coupon.id);
    toast('הקופון נמחק');
    onClose();
  }

  function copyCode() {
    const done = () => toast('הקוד הועתק');
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(coupon.code).then(done, () => toast('ההעתקה נכשלה', 'error'));
  }

  let footer;
  if (used) {
    footer = (
      <Button variant="secondary" size="lg" className="w-full" icon={RotateCcw} onClick={() => { restoreCoupon(family.id, coupon); toast('הקופון הוחזר לפעילים'); }}>
        החזר לפעילים
      </Button>
    );
  } else if (expired) {
    footer = (
      <Button variant="secondary" size="lg" className="w-full" icon={Calendar} onClick={onEdit}>
        עדכון תאריך תפוגה
      </Button>
    );
  } else if (partial) {
    footer = (
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              autoFocus
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setErr(''); }}
              placeholder="כמה נוצל?"
              unit="₪"
              error={err}
              onKeyDown={(e) => e.key === 'Enter' && usePartial()}
              aria-label="סכום שנוצל"
            />
          </div>
          <Button variant="primary" onClick={usePartial} icon={Check} data-testid="partial-confirm">אישור</Button>
          <Button variant="soft" onClick={() => { setPartial(false); setErr(''); setAmount(''); }}>ביטול</Button>
        </div>
        <p className={cx('text-[12px]', err ? 'font-medium text-danger' : 'font-light text-mute/60')} role={err ? 'alert' : undefined}>
          {err || (left != null && left >= 0 ? `יישארו ${money(left)} בשובר` : `יתרה נוכחית: ${money(coupon.balance)}`)}
        </p>
      </div>
    );
  } else {
    footer = (
      <div className="flex gap-2">
        <Button variant="primary" size="lg" className="flex-1" icon={CheckCheck} onClick={useAll}>
          {isMoney ? 'מימשתי הכול' : 'סמן כמומש'}
        </Button>
        {isMoney && (
          <Button variant="secondary" size="lg" className="flex-1" icon={Scissors} onClick={() => setPartial(true)}>
            שימוש חלקי
          </Button>
        )}
      </div>
    );
  }

  return (
    <Sheet
      title={coupon.title}
      onClose={onClose}
      footer={footer}
      actions={
        <>
          <button type="button" onClick={onEdit} className="rounded-[10px] bg-navy/5 p-2 text-navy/60 hover:bg-navy/10" aria-label="עריכה">
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button type="button" onClick={remove} className="rounded-[10px] bg-danger/5 p-2 text-danger/80 hover:bg-danger/10" aria-label="מחיקה">
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Hero coupon={coupon} alertDays={alertDays} />

        {coupon.code && (
          <button
            type="button"
            onClick={copyCode}
            className="flex w-full items-center justify-between gap-3 rounded-[14px] border-[1.5px] border-dashed border-gold/60 bg-gold/[0.06] px-4 py-3.5 active:bg-gold/10"
            data-testid="copy-code"
          >
            <span className="min-w-0">
              <span className="block text-right text-[10px] font-medium uppercase tracking-widest text-gold-deep/70">קוד קופון</span>
              <span dir="ltr" className="block truncate text-left font-mono text-lg font-semibold tracking-[0.15em] text-navy">{coupon.code}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 rounded-[10px] bg-white px-3 py-2 text-xs font-medium text-navy shadow-btn2">
              <Copy className="h-3.5 w-3.5" strokeWidth={1.75} /> העתק
            </span>
          </button>
        )}

        <div className="divide-y divide-canvas rounded-[14px] bg-white px-4 shadow-card">
          <Row icon={Store} label="איפה מממשים">{coupon.store}</Row>
          {coupon.category && <Row icon={Tag} label="קטגוריה">{coupon.category}</Row>}
          <Row icon={Calendar} label="תוקף">{coupon.expiry ? formatDate(coupon.expiry) : 'ללא תאריך תפוגה'}</Row>
          {coupon.source && <Row icon={Gift} label="התקבל מ-">{coupon.source}</Row>}
          {coupon.notes && (
            <Row icon={StickyNote} label="הערות">
              <span className="whitespace-pre-wrap">{coupon.notes}</span>
            </Row>
          )}
          {coupon.createdByName && <Row icon={UserRound} label="נוסף ע״י">{coupon.createdByName}</Row>}
        </div>

        {usages.length > 0 && (
          <div className="rounded-[14px] bg-white p-4 shadow-card" data-testid="usage-history">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="section-title">היסטוריית שימוש</h3>
              <button
                type="button"
                className="flex items-center gap-1 rounded-[8px] bg-navy/5 px-2 py-1 text-[11px] font-medium text-navy/60"
                onClick={() => { undoLastUsage(family.id, coupon); toast('השימוש האחרון בוטל'); }}
              >
                <Undo2 className="h-3 w-3" strokeWidth={2} /> בטל אחרון
              </button>
            </div>
            <ul className="divide-y divide-canvas">
              {[...usages].reverse().map((us) => (
                <li key={`${us.at}-${us.by}`} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-mute/80">
                    {formatDate(us.at)} <span className="text-mute/40">·</span> {us.byName || 'משתמש'}
                  </span>
                  {isMoney && us.amount != null && <span dir="ltr" className="font-semibold text-navy">-{money(us.amount)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Sheet>
  );
}
