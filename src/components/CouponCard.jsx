import { Store, Clock } from 'lucide-react';
import { expiryLabel, urgency, valueLabel, isExpired } from '../lib';

const URG = {
  red: 'bg-red-50 text-red-600',
  orange: 'bg-amber-50 text-amber-700',
};

export default function CouponCard({ coupon, alertDays, onClick }) {
  const u = urgency(coupon, alertDays);
  const used = coupon.status === 'used';
  const expired = isExpired(coupon);
  const dim = used || expired;
  const value = valueLabel(coupon);

  return (
    <button onClick={onClick} className={`card w-full p-4 text-right transition active:scale-[0.99] ${dim ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{coupon.title}</div>
          <div className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
            <Store size={14} className="shrink-0" />
            <span className="truncate">{coupon.store}</span>
          </div>
        </div>
        {coupon.category && (
          <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {coupon.category}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-slate-700">{value}</span>
        {used ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">מומש</span>
        ) : (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
              expired ? 'bg-slate-100 text-slate-500' : URG[u] || 'text-slate-500'
            }`}
          >
            <Clock size={12} />
            {expiryLabel(coupon)}
          </span>
        )}
      </div>
    </button>
  );
}
