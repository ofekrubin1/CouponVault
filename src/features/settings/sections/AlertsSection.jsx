import { Bell } from 'lucide-react';
import { Card, Segmented, useToast } from '@/ui';
import { setMyAlertDays } from '@/data';
import { ALERT_DAY_OPTIONS } from '@/domain/constants';
import { SectionTitle } from '../SectionTitle';

/** How many days before expiry a coupon shows up as "about to expire" — a personal setting. */
export function AlertsSection({ user, alertDays }) {
  const toast = useToast();
  return (
    <Card>
      <SectionTitle icon={Bell}>התראת תפוגה</SectionTitle>
      <p className="mb-3 text-xs font-light leading-relaxed text-mute/60">
        כמה ימים לפני התפוגה הקופון יקפוץ אצלך במסך הבית בתור "עומד לפוג". ההגדרה אישית ולא משנה לשאר המשפחה.
      </p>
      <Segmented
        name="ימי התראה"
        value={alertDays}
        onChange={(d) => {
          setMyAlertDays(user.uid, d);
          toast(`התראה ${d} ימים לפני התפוגה`);
        }}
        options={ALERT_DAY_OPTIONS.map((d) => ({ key: d, label: `${d} ימים` }))}
      />
    </Card>
  );
}
