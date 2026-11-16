import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { deleteCoupon, redeemCoupon, watchCoupons, watchMyFamilies, watchUserDoc } from './data';
import { money } from './lib';
import { DEFAULT_CATEGORIES } from './constants';
import { ToastProvider, ConfirmProvider, useConfirm, useToast } from './ui/feedback';
import { Avatar, Spinner } from './ui/primitives';
import { useBackClose } from './hooks/overlay';
import { BottomNav, Fab, FamilySwitcher } from './components/Chrome';
import FamilyActions from './components/FamilyActions';
import CouponForm from './components/CouponForm';
import CouponDetail from './components/CouponDetail';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Archive from './pages/Archive';
import Settings from './pages/Settings';

// Pick up ?join=CODE once (an invite link), then clean the URL.
const urlJoin = (() => {
  const code = new URLSearchParams(window.location.search).get('join');
  if (code) {
    sessionStorage.setItem('joinCode', code.toUpperCase());
    window.history.replaceState(null, '', window.location.pathname);
  }
  return sessionStorage.getItem('joinCode') || '';
})();

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="liquid-bg" aria-hidden />
        <Root />
      </ConfirmProvider>
    </ToastProvider>
  );
}

function Root() {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  if (user === undefined) return <Spinner full />;
  if (!user) return <Login />;
  return <Signed key={user.uid} user={user} />;
}

function Signed({ user }) {
  const [families, setFamilies] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [joinCode] = useState(urlJoin);
  // Families the server has confirmed at least once (a brand-new family is local-only for a moment).
  const synced = useRef(new Set());

  useEffect(
    () => watchMyFamilies(user.uid, setFamilies, (e) => { console.error(e); setFamilies((f) => f ?? []); }),
    [user.uid],
  );
  useEffect(() => watchUserDoc(user.uid, setUserDoc), [user.uid]);
  useEffect(() => {
    if (joinCode) sessionStorage.removeItem('joinCode');
  }, [joinCode]);

  if (!families || !userDoc) return <Spinner full />;
  if (families.length === 0) return <Onboarding user={user} joinCode={joinCode} />;

  families.forEach((f) => f.synced && synced.current.add(f.id));
  const family = families.find((f) => f.id === userDoc.currentFamilyId) || families[0];
  return (
    <Main
      key={family.id}
      user={user}
      family={family}
      families={families}
      joinCode={joinCode}
      ready={synced.current.has(family.id)}
    />
  );
}

const TABS = {
  home: { eyebrow: 'הארנק המשפחתי' },
  archive: { eyebrow: 'ארכיון', title: 'מומשו ופג תוקפם' },
  settings: { eyebrow: 'הגדרות', title: 'ניהול' },
};

function Main({ user, family, families, joinCode, ready }) {
  const [coupons, setCoupons] = useState(null);
  const [tab, setTab] = useState('home');
  // sheet: null | { kind: 'detail', id } | { kind: 'form', id? }
  const [sheet, setSheet] = useState(null);
  const [pendingJoin, setPendingJoin] = useState(joinCode && !families.some((f) => f.inviteCode === joinCode) ? joinCode : '');

  // Listen to coupons only once the server knows the family; until then a new family simply has none.
  useEffect(() => {
    if (!ready) {
      setCoupons([]);
      return undefined;
    }
    return watchCoupons(family.id, setCoupons, (e) => console.error(e));
  }, [family.id, ready]);

  // The phone's back button closes an open sheet instead of leaving the app.
  useBackClose(!!sheet, () => setSheet(null));

  const categories = useMemo(() => [...new Set([...DEFAULT_CATEGORIES, ...(family.customCategories || [])])], [family.customCategories]);
  const stores = useMemo(
    () => [...new Set((coupons || []).map((c) => c.store).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'he')),
    [coupons],
  );

  const current = sheet?.id ? coupons?.find((c) => c.id === sheet.id) : null;
  // A coupon deleted (here or on another phone) while its sheet is open: close the sheet.
  useEffect(() => {
    if (sheet?.id && coupons && !current) setSheet(null);
  }, [sheet, coupons, current]);

  const open = (c) => setSheet({ kind: 'detail', id: c.id });
  const toast = useToast();
  const confirm = useConfirm();

  // Swipe actions on a coupon row.
  const use = async (c) => {
    if (c.type === 'money') {
      setSheet({ kind: 'detail', id: c.id, partial: true });
      return;
    }
    const ok = await confirm({ title: `לסמן את "${c.title}" כמומש?`, message: 'הקופון יעבור לארכיון. אפשר להחזיר אותו משם.', confirmText: 'כן, מימשתי' });
    if (!ok) return;
    redeemCoupon(family.id, user, c, null);
    toast('סומן כמומש ועבר לארכיון');
  };
  const remove = async (c) => {
    const ok = await confirm({
      title: 'מחיקת קופון',
      message: `למחוק את "${c.title}"${c.type === 'money' ? ` (יתרה ${money(c.balance ?? c.value)})` : ''} לצמיתות?`,
      confirmText: 'מחק',
      danger: true,
    });
    if (!ok) return;
    deleteCoupon(family.id, c.id);
    toast('הקופון נמחק');
  };
  const add = () => setSheet({ kind: 'form' });
  const go = (t) => {
    setTab(t);
    window.scrollTo(0, 0);
  };
  const meta = TABS[tab];

  return (
    <>
      <div className="mx-auto min-h-[100dvh] max-w-lg overflow-x-clip px-5 pb-44 pt-12" data-family-id={family.id}>
        <header className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{tab === 'home' ? meta.eyebrow : `${meta.eyebrow} · ${family.name}`}</p>
            {tab === 'home' ? (
              <FamilySwitcher user={user} family={family} families={families} onManage={() => go('settings')} />
            ) : (
              <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{meta.title}</h1>
            )}
          </div>
          <button type="button" onClick={() => go('settings')} aria-label="הגדרות חשבון" className="shrink-0">
            <Avatar name={user.displayName} photo={user.photoURL} size={38} />
          </button>
        </header>

        {pendingJoin && (
          <div className="mb-4">
            <p className="section-title mb-2">הוזמנת להצטרף למשפחה</p>
            <FamilyActions user={user} families={families} initialCode={pendingJoin} onDone={() => setPendingJoin('')} />
            <button type="button" className="mt-2 text-xs font-light text-mute/50" onClick={() => setPendingJoin('')}>
              לא עכשיו
            </button>
          </div>
        )}

        {coupons === null ? (
          <Spinner className="flex justify-center py-20" />
        ) : tab === 'home' ? (
          <Home coupons={coupons} family={family} onOpen={open} onAdd={add} onUse={use} onDelete={remove} />
        ) : tab === 'archive' ? (
          <Archive coupons={coupons} family={family} onOpen={open} />
        ) : (
          <Settings key={family.id} user={user} family={family} families={families} />
        )}
      </div>

      {tab !== 'settings' && <Fab onClick={add} />}
      <BottomNav tab={tab} onChange={go} />

      {sheet?.kind === 'detail' && current && (
        <CouponDetail
          coupon={current}
          family={family}
          user={user}
          startPartial={!!sheet.partial}
          onClose={() => setSheet(null)}
          onEdit={() => setSheet({ kind: 'form', id: current.id })}
        />
      )}
      {sheet?.kind === 'form' && (
        <CouponForm
          key={sheet.id || 'new'}
          coupon={current}
          family={family}
          user={user}
          categories={categories}
          stores={stores}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}
