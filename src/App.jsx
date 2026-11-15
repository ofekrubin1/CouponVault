import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Plus, Home as HomeIcon, Archive as ArchiveIcon, Settings as SettingsIcon, ChevronDown, Check } from 'lucide-react';
import { auth } from './firebase';
import { joinFamily, setCurrentFamily, watchCoupons, watchMyFamilies, watchUserDoc } from './data';
import { DEFAULT_CATEGORIES } from './constants';
import { ToastProvider, useToast } from './components/Toast';
import CouponForm from './components/CouponForm';
import CouponDetail from './components/CouponDetail';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Archive from './pages/Archive';
import Settings from './pages/Settings';

// Pick up ?join=CODE once, then clean the URL.
const urlJoin = (() => {
  const p = new URLSearchParams(location.search);
  const code = p.get('join');
  if (code) {
    sessionStorage.setItem('joinCode', code.toUpperCase());
    history.replaceState(null, '', location.pathname);
  }
  return sessionStorage.getItem('joinCode') || '';
})();

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <img src="/icon.svg" alt="" className="h-16 w-16 animate-pulse rounded-2xl" />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Root />
    </ToastProvider>
  );
}

function Root() {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  if (user === undefined) return <Splash />;
  if (!user) return <Login />;
  return <Signed key={user.uid} user={user} />;
}

function Signed({ user }) {
  const toast = useToast();
  const [families, setFamilies] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [joinCode, setJoinCode] = useState(urlJoin);

  useEffect(() => watchMyFamilies(user.uid, setFamilies, (e) => { console.error(e); setFamilies([]); }), [user.uid]);
  useEffect(() => watchUserDoc(user.uid, setUserDoc), [user.uid]);

  // Opened an invite link while already in some family: join straight away.
  useEffect(() => {
    if (!joinCode || !families || families.length === 0) return;
    sessionStorage.removeItem('joinCode');
    setJoinCode('');
    if (families.some((f) => f.inviteCode === joinCode)) return;
    joinFamily(user, joinCode)
      .then(() => toast('הצטרפת למשפחה החדשה 🎉'))
      .catch((e) => toast(e.message));
  }, [joinCode, families, user, toast]);

  if (!families || !userDoc) return <Splash />;
  if (families.length === 0) return <Onboarding user={user} joinCode={joinCode} />;

  const family = families.find((f) => f.id === userDoc.currentFamilyId) || families[0];
  return <Main key={family.id} user={user} family={family} families={families} />;
}

function FamilySwitcher({ user, family, families, onManage }) {
  const [open, setOpen] = useState(false);
  if (families.length < 2) {
    return <h1 className="truncate text-xl font-extrabold">{family.name}</h1>;
  }
  return (
    <div className="relative min-w-0">
      <button className="flex max-w-full items-center gap-1 text-xl font-extrabold" onClick={() => setOpen((o) => !o)}>
        <span className="truncate">{family.name}</span>
        <ChevronDown size={20} className={`shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="animate-fade absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl bg-white py-1 shadow-xl ring-1 ring-slate-100">
            {families.map((f) => (
              <button
                key={f.id}
                className="flex w-full items-center justify-between px-4 py-2.5 text-right hover:bg-slate-50"
                onClick={() => { setOpen(false); if (f.id !== family.id) setCurrentFamily(user.uid, f.id); }}
              >
                <span className={f.id === family.id ? 'font-bold' : ''}>{f.name}</span>
                {f.id === family.id && <Check size={16} className="text-brand-600" />}
              </button>
            ))}
            <button className="w-full border-t border-slate-100 px-4 py-2.5 text-right text-sm text-brand-600" onClick={() => { setOpen(false); onManage(); }}>
              ניהול משפחות…
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Main({ user, family, families }) {
  const [coupons, setCoupons] = useState(null);
  const [tab, setTab] = useState('home');
  // sheet: null | { kind: 'detail', id } | { kind: 'form', id? }
  const [sheet, setSheet] = useState(null);

  useEffect(() => watchCoupons(family.id, setCoupons, (e) => { console.error(e); setCoupons([]); }), [family.id]);

  // While any sheet is open, keep one history entry so the phone's back button closes it.
  const sheetOpen = !!sheet;
  const poppedRef = useRef(false);
  useEffect(() => {
    if (!sheetOpen) return;
    poppedRef.current = false;
    history.pushState({ sheet: true }, '');
    const onPop = () => { poppedRef.current = true; setSheet(null); };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!poppedRef.current && history.state?.sheet) history.back();
    };
  }, [sheetOpen]);

  const categories = useMemo(
    () => [...new Set([...DEFAULT_CATEGORIES, ...(family.customCategories || [])])],
    [family.customCategories],
  );
  const stores = useMemo(
    () => [...new Set((coupons || []).map((c) => c.store).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'he')),
    [coupons],
  );

  const open = (c) => setSheet({ kind: 'detail', id: c.id });
  const current = sheet?.id ? coupons?.find((c) => c.id === sheet.id) : null;

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-28">
      <header
        className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-slate-50/90 px-4 pb-2 backdrop-blur"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <FamilySwitcher user={user} family={family} families={families} onManage={() => setTab('settings')} />
        {user.photoURL && <img src={user.photoURL} alt="" className="h-8 w-8 shrink-0 rounded-full" referrerPolicy="no-referrer" />}
      </header>

      {coupons === null ? (
        <div className="py-20 text-center text-slate-400">טוען…</div>
      ) : tab === 'home' ? (
        <Home coupons={coupons} family={family} onOpen={open} onAdd={() => setSheet({ kind: 'form' })} />
      ) : tab === 'archive' ? (
        <Archive coupons={coupons} family={family} onOpen={open} />
      ) : (
        <Settings key={family.id} user={user} family={family} families={families} />
      )}

      {tab !== 'settings' && (
        <button
          onClick={() => setSheet({ kind: 'form' })}
          className="fixed bottom-24 left-1/2 z-20 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition active:scale-95"
          aria-label="הוספת קופון"
        >
          <Plus size={28} />
        </button>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-lg">
          {[
            ['home', 'קופונים', HomeIcon],
            ['archive', 'ארכיון', ArchiveIcon],
            ['settings', 'הגדרות', SettingsIcon],
          ].map(([k, label, Icon]) => (
            <button
              key={k}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${tab === k ? 'font-bold text-brand-600' : 'text-slate-400'}`}
              onClick={() => { setTab(k); window.scrollTo(0, 0); }}
            >
              <Icon size={22} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {sheet?.kind === 'detail' && current && (
        <CouponDetail
          coupon={current}
          family={family}
          user={user}
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
    </div>
  );
}
