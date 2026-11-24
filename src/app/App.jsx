import { useEffect, useState } from 'react';
import { ConfirmProvider, Spinner, ToastProvider, useToast } from '@/ui';
import { setErrorReporter } from '@/data';
import { watchAuth } from '@/services/auth';
import { LOCAL } from '@/services/firebase';
import { LoginPage } from '@/features/auth/LoginPage';
import { LockGate } from '@/features/auth/AppLock';
import { OnboardingPage, useFamilies } from '@/features/families';
import { AppShell } from './AppShell';
import { clearJoinLink, readJoinLink } from './joinLink';

const joinCodeAtStart = readJoinLink();

/** Always on screen in the local test environment, so it's never mistaken for the real app. */
function SandboxBadge() {
  return (
    <div
      className="pointer-events-none fixed left-3 z-[80] rounded-full bg-[#E2A04A] px-2.5 py-0.5 text-[11px] font-semibold text-white shadow"
      style={{ top: 'calc(env(safe-area-inset-top) + 6px)' }}
      data-testid="sandbox-badge"
    >
      סביבת בדיקה · נתונים פיקטיביים
    </div>
  );
}

/** Background writes run without waiting; when the server rejects one, tell the user. */
function ErrorReporter() {
  const toast = useToast();
  useEffect(() => setErrorReporter((msg) => toast(msg, 'error')), [toast]);
  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <ErrorReporter />
        {LOCAL && <SandboxBadge />}
        <div className="liquid-bg" aria-hidden />
        <AuthGate />
      </ConfirmProvider>
    </ToastProvider>
  );
}

function AuthGate() {
  const [user, setUser] = useState(undefined);
  useEffect(() => watchAuth(setUser), []);
  if (user === undefined) return <Spinner full />;
  if (!user) return <LoginPage />;
  return (
    <LockGate key={user.uid} user={user}>
      <SignedIn user={user} />
    </LockGate>
  );
}

/** Loads the user's families: none → welcome screen; otherwise the app for the selected family. */
function SignedIn({ user }) {
  const [joinCode] = useState(joinCodeAtStart);
  const { loading, families, family, ready, alertDays, pendingJoin } = useFamilies(user.uid);
  useEffect(() => {
    if (joinCode) clearJoinLink();
  }, [joinCode]);

  if (loading) return <Spinner full />;
  if (!family) return <OnboardingPage user={user} joinCode={joinCode} pendingJoin={pendingJoin} />;
  return <AppShell key={family.id} user={user} family={family} families={families} ready={ready} joinCode={joinCode} alertDays={alertDays} pendingJoin={pendingJoin} />;
}
