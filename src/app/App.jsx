import { useEffect, useState } from 'react';
import { ConfirmProvider, Spinner, ToastProvider, useToast } from '@/ui';
import { setErrorReporter } from '@/data';
import { watchAuth } from '@/services/auth';
import { LoginPage } from '@/features/auth/LoginPage';
import { OnboardingPage, useFamilies } from '@/features/families';
import { AppShell } from './AppShell';
import { clearJoinLink, readJoinLink } from './joinLink';

const joinCodeAtStart = readJoinLink();

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
  return <SignedIn key={user.uid} user={user} />;
}

/** Loads the user's families: none → welcome screen; otherwise the app for the selected family. */
function SignedIn({ user }) {
  const [joinCode] = useState(joinCodeAtStart);
  const { loading, families, family, ready, alertDays } = useFamilies(user.uid);
  useEffect(() => {
    if (joinCode) clearJoinLink();
  }, [joinCode]);

  if (loading) return <Spinner full />;
  if (!family) return <OnboardingPage user={user} joinCode={joinCode} />;
  return <AppShell key={family.id} user={user} family={family} families={families} ready={ready} joinCode={joinCode} alertDays={alertDays} />;
}
