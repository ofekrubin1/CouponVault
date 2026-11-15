import { useMemo, useState } from 'react';
import { FolderArchive } from 'lucide-react';
import CouponTicket from '../components/CouponTicket';
import { EmptyState, Segmented } from '../ui/primitives';
import { isExpired } from '../lib';

export default function Archive({ coupons, family, onOpen }) {
  const [tab, setTab] = useState('used');
  const used = useMemo(
    () => coupons.filter((c) => c.status === 'used').sort((a, b) => (b.usedAt || '').localeCompare(a.usedAt || '')),
    [coupons],
  );
  const expired = useMemo(() => coupons.filter((c) => isExpired(c)).sort((a, b) => b.expiry.localeCompare(a.expiry)), [coupons]);
  const list = tab === 'used' ? used : expired;

  return (
    <div className="space-y-4">
      <Segmented
        name="ארכיון"
        value={tab}
        onChange={setTab}
        options={[
          { key: 'used', label: `מומשו · ${used.length}` },
          { key: 'expired', label: `פג תוקף · ${expired.length}` },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState
          icon={FolderArchive}
          title={tab === 'used' ? 'עוד לא מומשו קופונים' : 'אין קופונים שפג תוקפם'}
          text={tab === 'used' ? 'קופון שמסמנים כמומש עובר לכאן' : 'קופון שתאריך התפוגה שלו עבר יופיע כאן'}
        />
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <CouponTicket key={c.id} coupon={c} alertDays={family.alertDays ?? 14} onClick={() => onOpen(c)} />
          ))}
        </div>
      )}
    </div>
  );
}
