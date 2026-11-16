import { Bell } from 'lucide-react';
import { Card, Segmented, useToast } from '@/ui';
import { setAlertDays } from '@/data';
import { ALERT_DAY_OPTIONS, DEFAULT_ALERT_DAYS } from '@/domain/constants';
import { SectionTitle } from '../SectionTitle';

/** How many days before expiry a coupon shows up as "about to expire". */
export function AlertsSection({ family }) {
  const toast = useToast();
  return (
    <Card>
      <SectionTitle icon={Bell}>התראת תפוגה</SectionTitle>
      <p className="mb-3 text-xs font-light leading-relaxed text-mute/60">כמה ימים לפני התפוגה הקופון יקפוץ במסך הבית בתור "עומד לפוג"</p>
      <Segmented
        name="ימי התראה"
        value={family.alertDays ?? DEFAULT_ALERT_DAYS}
        onChange={(d) => {
          setAlertDays(family.id, d);
          toast(`התראה ${d} ימים לפני התפוגה`);
        }}
        options={ALERT_DAY_OPTIONS.map((d) => ({ key: d, label: `${d} ימים` }))}
      />
    </Card>
  );
}
