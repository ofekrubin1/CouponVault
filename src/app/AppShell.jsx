import { useMemo, useState } from 'react';
import { Spinner } from '@/ui';
import { familyCategories } from '@/domain/family';
import { withFamilyCategories } from '@/domain/coupon';
import { CouponDetailSheet, CouponFormSheet, useCouponActions, useCoupons } from '@/features/coupons';
import { FamilyActions } from '@/features/families';
import { HomePage } from '@/features/home/HomePage';
import { ArchivePage } from '@/features/archive/ArchivePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { Fab } from './Fab';
import { useCouponSheet } from './useCouponSheet';

/** The signed-in app for one family: header, current tab, bottom bar, + button and coupon sheets. */
export function AppShell({ user, family, families, ready, joinCode, alertDays }) {
  const categories = useMemo(() => familyCategories(family), [family]);
  const loaded = useCoupons(family.id, ready);
  const coupons = useMemo(() => loaded && withFamilyCategories(loaded, categories), [loaded, categories]);
  const actions = useCouponActions(family, user);
  const sheets = useCouponSheet(coupons);
  const [tab, setTab] = useState('home');
  const [pendingJoin, setPendingJoin] = useState(joinCode && !families.some((f) => f.inviteCode === joinCode) ? joinCode : '');

  const stores = useMemo(() => [...new Set((coupons || []).map((c) => c.store).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'he')), [coupons]);

  const go = (t) => {
    setTab(t);
    window.scrollTo(0, 0);
  };
  // After a redemption or deletion from the sheet: close it and land on the home screen.
  const backHome = () => {
    sheets.close();
    go('home');
  };

  let page;
  if (coupons === null) page = <Spinner className="flex justify-center py-20" />;
  else if (tab === 'home') page = <HomePage coupons={coupons} categories={categories} alertDays={alertDays} onOpen={sheets.openDetail} onAdd={sheets.openNew} onDelete={actions.remove} />;
  else if (tab === 'archive') page = <ArchivePage coupons={coupons} alertDays={alertDays} onOpen={sheets.openDetail} />;
  else page = <SettingsPage key={family.id} user={user} family={family} families={families} alertDays={alertDays} />;

  return (
    <>
      <div className="mx-auto min-h-[100dvh] max-w-lg overflow-x-clip px-5 pb-44 pt-12" data-family-id={family.id}>
        <AppHeader tab={tab} user={user} family={family} families={families} onGo={go} />
        {pendingJoin && (
          <div className="mb-4">
            <p className="section-title mb-2">הוזמנת להצטרף למשפחה</p>
            <FamilyActions user={user} families={families} initialCode={pendingJoin} onDone={() => setPendingJoin('')} />
            <button type="button" className="mt-2 text-xs font-light text-mute/50" onClick={() => setPendingJoin('')}>
              לא עכשיו
            </button>
          </div>
        )}
        {page}
      </div>

      {tab !== 'settings' && <Fab onClick={sheets.openNew} />}
      <BottomNav tab={tab} onChange={go} />

      {sheets.sheet?.kind === 'detail' && sheets.current && (
        <CouponDetailSheet
          coupon={sheets.current}
          family={family}
          user={user}
          alertDays={alertDays}
          onClose={sheets.close}
          onDone={backHome}
          onEdit={() => sheets.openEdit(sheets.current)}
        />
      )}
      {sheets.sheet?.kind === 'form' && (
        <CouponFormSheet
          key={sheets.sheet.id || 'new'}
          coupon={sheets.current}
          family={family}
          user={user}
          categories={categories}
          stores={stores}
          onClose={sheets.close}
        />
      )}
    </>
  );
}
