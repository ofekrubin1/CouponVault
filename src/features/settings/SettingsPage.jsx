import { FamilySection } from './sections/FamilySection';
import { MembersSection } from './sections/MembersSection';
import { AlertsSection } from './sections/AlertsSection';
import { CategoriesSection } from './sections/CategoriesSection';
import { FamiliesSection } from './sections/FamiliesSection';
import { AccountSection } from './sections/AccountSection';

/** Settings: one card per topic (each section owns its own state and actions). */
export function SettingsPage({ user, family, families, alertDays, requests = [] }) {
  return (
    <div className="space-y-4">
      <FamilySection family={family} />
      <MembersSection user={user} family={family} families={families} requests={requests} />
      <AlertsSection user={user} alertDays={alertDays} />
      <CategoriesSection family={family} />
      <FamiliesSection user={user} family={family} families={families} />
      <AccountSection user={user} />
    </div>
  );
}
