import { useState } from 'react';
import { Check, CheckCheck, Scissors, RotateCcw, Calendar } from 'lucide-react';
import { Button, Input, cx } from '@/ui';
import { balanceOf, isExpired, isMoney, isUsed, planRedemption } from '@/domain/coupon';
import { money } from '@/domain/format';

/** Partial redemption: amount input with a live "what's left" and a "whole balance" shortcut. */
function PartialForm({ coupon, onConfirm, onCancel }) {
  const [amount, setAmount] = useState('');
  const [err, setErr] = useState('');
  const balance = balanceOf(coupon);
  const preview = amount ? planRedemption(coupon, amount) : null;

  const confirm = () => {
    const r = onConfirm(Number(amount));
    if (r?.error) setErr(r.error);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            autoFocus
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setErr('');
            }}
            placeholder="כמה נוצל?"
            unit="₪"
            error={err}
            onKeyDown={(e) => e.key === 'Enter' && confirm()}
            aria-label="סכום שנוצל"
          />
        </div>
        <Button variant="primary" onClick={confirm} icon={Check} data-testid="partial-confirm">
          אישור
        </Button>
        <Button variant="soft" onClick={onCancel}>
          ביטול
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className={cx('text-[12px]', err ? 'font-medium text-danger' : 'font-light text-mute/60')} role={err ? 'alert' : undefined}>
          {err || (preview && !preview.error ? `יישארו ${money(preview.left)} בשובר` : `יתרה נוכחית: ${money(balance)}`)}
        </p>
        <button
          type="button"
          onClick={() => {
            setAmount(String(balance));
            setErr('');
          }}
          className="shrink-0 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-gold-deep"
        >
          כל היתרה
        </button>
      </div>
    </div>
  );
}

/**
 * The sheet's bottom bar, by state: restore (used) · update expiry (expired) · use all / partial (active).
 * Handlers come from the parent; this component only decides what to show.
 */
export function RedeemBar({ coupon, startPartial, onUseAll, onPartial, onRestore, onEdit }) {
  const [partial, setPartial] = useState(startPartial && isMoney(coupon));

  if (isUsed(coupon)) {
    return (
      <Button variant="secondary" size="lg" className="w-full" icon={RotateCcw} onClick={onRestore}>
        החזר לפעילים
      </Button>
    );
  }
  if (isExpired(coupon)) {
    return (
      <Button variant="secondary" size="lg" className="w-full" icon={Calendar} onClick={onEdit}>
        עדכון תאריך תפוגה
      </Button>
    );
  }
  if (partial) return <PartialForm coupon={coupon} onConfirm={onPartial} onCancel={() => setPartial(false)} />;
  return (
    <div className="flex gap-2">
      <Button variant="primary" size="lg" className="flex-1" icon={CheckCheck} onClick={onUseAll}>
        {isMoney(coupon) ? 'מימשתי הכול' : 'סמן כמומש'}
      </Button>
      {isMoney(coupon) && (
        <Button variant="secondary" size="lg" className="flex-1" icon={Scissors} onClick={() => setPartial(true)}>
          מימוש חלקי
        </Button>
      )}
    </div>
  );
}
