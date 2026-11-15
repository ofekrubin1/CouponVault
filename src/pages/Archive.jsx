import { useMemo, useState } from 'react';
import { Archive as ArchiveIcon } from 'lucide-react';
import CouponCard from '../components/CouponCard';
import { isExpired } from '../lib';

export default function Archive({ coupons, family, onOpen }) {
  const [tab, setTab] = useState('used');
  const used = useMemo(
    () => coupons.filter((c) => c.status === 'used').sort((a, b) => (b.usedAt || '').localeCompare(a.usedAt || '')),
    [coupons],
  );
  const expired = useMemo(
    () => coupons.filter(isExpired).sort((a, b) => b.expiry.localeCompare(a.expiry)),
    [coupons],
  );
  const list = tab === 'used' ? used : expired;

  return (
    <div className="space-y-4 px-4 pt-3">
      <div className="flex rounded-xl bg-slate-100 p-1">
        {[['used', `מומשו (${used.length})`], ['expired', `פג תוקף (${expired.length})`]].map(([k, label]) => (
          <button
            key={k}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${tab === k ? 'bg-white shadow-sm' : 'text-slate-500'}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        {list.map((c) => <CouponCard key={c.id} coupon={c} alertDays={family.alertDays ?? 14} onClick={() => onOpen(c)} />)}
        {list.length === 0 && (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <ArchiveIcon size={40} className="mb-2" />
            {tab === 'used' ? 'עוד לא מומשו קופונים' : 'אין קופונים שפג תוקפם'}
          </div>
        )}
      </div>
    </div>
  );
}
