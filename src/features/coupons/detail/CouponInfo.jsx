import { Copy, Store, Tag, Gift, Calendar, StickyNote, UserRound, ExternalLink, CreditCard, Smartphone } from 'lucide-react';
import { LinkifiedText, useToast } from '@/ui';
import { formatDate } from '@/domain/format';
import { couponCategories, isPhysical } from '@/domain/coupon';
import { displayStore, isUrl, toHref } from '@/domain/links';

/** The store; when it's a web address, a tappable link showing the site name. */
function StoreValue({ store }) {
  if (!isUrl(store)) return <LinkifiedText text={store} />;
  return (
    <a href={toHref(store.trim())} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-accent" data-testid="store-link">
      {displayStore(store)}
      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
    </a>
  );
}

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

/** Dashed "tear-off" box with a code (the coupon code, or its verification code) and a copy button. */
export function CouponCode({ code, label = 'קוד קופון', copied = 'הקוד הועתק', testId = 'copy-code' }) {
  const toast = useToast();
  const copy = () => navigator.clipboard?.writeText(code).then(() => toast(copied), () => toast('ההעתקה נכשלה', 'error'));
  return (
    <button
      type="button"
      onClick={copy}
      className="flex w-full items-center justify-between gap-3 rounded-[18px] border-[1.5px] border-dashed border-gold/60 bg-white/50 px-4 py-3.5 active:bg-gold/10"
      data-testid={testId}
    >
      <span className="min-w-0">
        <span className="block text-right text-[10px] font-medium uppercase tracking-widest text-gold-deep/70">{label}</span>
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
      <Row icon={Store} label="איפה מממשים">
        <StoreValue store={coupon.store} />
      </Row>
      {couponCategories(coupon).length > 0 && (
        <Row icon={Tag} label={couponCategories(coupon).length > 1 ? 'קטגוריות' : 'קטגוריה'}>
          {couponCategories(coupon).join(' · ')}
        </Row>
      )}
      <Row icon={isPhysical(coupon) ? CreditCard : Smartphone} label="השובר הוא">
        <span data-testid="coupon-format">{isPhysical(coupon) ? 'פיזי (צריך להביא איתך)' : 'דיגיטלי'}</span>
      </Row>
      <Row icon={Calendar} label="תוקף">{coupon.expiry ? formatDate(coupon.expiry) : 'ללא תאריך תפוגה'}</Row>
      {coupon.source && (
        <Row icon={Gift} label="התקבל מ-">
          <LinkifiedText text={coupon.source} />
        </Row>
      )}
      {coupon.notes && (
        <Row icon={StickyNote} label="הערות">
          <LinkifiedText text={coupon.notes} className="whitespace-pre-wrap" />
        </Row>
      )}
      {coupon.createdByName && <Row icon={UserRound} label="נוסף ע״י">{coupon.createdByName}</Row>}
    </div>
  );
}
