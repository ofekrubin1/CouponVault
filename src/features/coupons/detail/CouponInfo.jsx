import { Copy, Store, Tag, Gift, Calendar, StickyNote, UserRound } from 'lucide-react';
import { useToast } from '@/ui';
import { formatDate } from '@/domain/format';

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

/** Dashed "tear-off" box with the code and a copy button. */
export function CouponCode({ code }) {
  const toast = useToast();
  const copy = () => navigator.clipboard?.writeText(code).then(() => toast('הקוד הועתק'), () => toast('ההעתקה נכשלה', 'error'));
  return (
    <button
      type="button"
      onClick={copy}
      className="flex w-full items-center justify-between gap-3 rounded-[18px] border-[1.5px] border-dashed border-gold/60 bg-white/50 px-4 py-3.5 active:bg-gold/10"
      data-testid="copy-code"
    >
      <span className="min-w-0">
        <span className="block text-right text-[10px] font-medium uppercase tracking-widest text-gold-deep/70">קוד קופון</span>
        <span dir="ltr" className="block truncate text-left font-mono text-lg font-semibold tracking-[0.15em] text-navy">
          {code}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 rounded-[12px] bg-white/80 px-3 py-2 text-xs font-medium text-navy shadow-btn2">
        <Copy className="h-3.5 w-3.5" strokeWidth={1.75} /> העתק
      </span>
    </button>
  );
}

/** Where to use it, category, expiry, source, notes, who added it. */
export function CouponInfo({ coupon }) {
  return (
    <div className="glass-card divide-y divide-navy/[0.05] rounded-[18px] px-4">
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
  );
}
