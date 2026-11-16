import { Undo2 } from 'lucide-react';
import { isMoney } from '@/domain/coupon';
import { formatDate, money } from '@/domain/format';

export function UsageHistory({ coupon, onUndoLast }) {
  const usages = coupon.usages || [];
  if (!usages.length) return null;
  return (
    <div className="glass-card rounded-[18px] p-4" data-testid="usage-history">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="section-title">היסטוריית שימוש</h3>
        <button type="button" className="flex items-center gap-1 rounded-[8px] bg-navy/5 px-2 py-1 text-[11px] font-medium text-navy/60" onClick={onUndoLast}>
          <Undo2 className="h-3 w-3" strokeWidth={2} /> בטל אחרון
        </button>
      </div>
      <ul className="divide-y divide-navy/[0.05]">
        {[...usages].reverse().map((u) => (
          <li key={`${u.at}-${u.by}`} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-mute/80">
              {formatDate(u.at)} <span className="text-mute/40">·</span> {u.byName || 'משתמש'}
            </span>
            {isMoney(coupon) && u.amount != null && (
              <span dir="ltr" className="font-semibold text-navy">
                -{money(u.amount)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
