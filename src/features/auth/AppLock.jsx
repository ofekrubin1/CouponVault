import { useEffect, useState } from 'react';
import { Fingerprint, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button, Card, Switch, useToast } from '@/ui';
import { canUseBiometrics, disableLock, enableLock, lockEnabled, markOffered, unlock, wasOffered } from '@/services/deviceLock';
import { signOut } from '@/services/auth';

const LABEL = 'Face ID / טביעת אצבע';

/** Whether this device has Face ID / fingerprint (null while checking). */
export function useBiometrics() {
  const [ok, setOk] = useState(null);
  useEffect(() => {
    canUseBiometrics().then(setOk);
  }, []);
  return ok;
}

/**
 * Wraps the signed-in app. When this person turned the lock on (on this device), opening the app shows a lock
 * screen until the device verifies them. Only on opening: no lock after time in the background.
 */
export function LockGate({ user, children }) {
  const [locked, setLocked] = useState(() => lockEnabled(user.uid));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (!locked) return children;

  const open = async () => {
    setErr('');
    setBusy(true);
    try {
      await unlock(user.uid);
      setLocked(false);
    } catch {
      setErr('לא זוהית. נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-8 text-center" data-testid="lock-screen">
      <span className="glass-navy relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px]">
        <span className="sheen" />
        <LockKeyhole className="relative h-7 w-7 text-white" strokeWidth={1.6} />
      </span>
      <div>
        <h1 className="text-xl font-semibold text-navy">CouponVault נעול</h1>
        <p className="mt-1 text-balance text-sm font-light text-mute/70">כדי לראות את הקופונים, פתחו עם {LABEL}</p>
      </div>
      <Button variant="primary" size="lg" icon={Fingerprint} onClick={open} disabled={busy} data-testid="unlock-button">
        פתיחה
      </Button>
      {err && (
        <p role="alert" className="text-sm font-medium text-danger">
          {err}
        </p>
      )}
      <button type="button" onClick={signOut} className="text-xs font-light text-mute/50">
        התנתקות ({user.email})
      </button>
    </div>
  );
}

/** Offered once per person and device, right after the first sign-in, when the device has Face ID / fingerprint. */
export function LockOffer({ user }) {
  const toast = useToast();
  const available = useBiometrics();
  const [open, setOpen] = useState(() => !wasOffered(user.uid) && !lockEnabled(user.uid));
  if (!open || !available) return null;

  const close = () => {
    markOffered(user.uid);
    setOpen(false);
  };
  const turnOn = async () => {
    try {
      await enableLock(user);
      toast(`הנעילה עם ${LABEL} הופעלה`);
      setOpen(false);
    } catch {
      toast('ההפעלה בוטלה. אפשר להפעיל בהגדרות', 'error');
      close();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-navy/25 p-4 backdrop-blur-[3px]" data-testid="lock-offer">
      <div role="dialog" aria-label="נעילה עם Face ID" className="glass-strong w-full max-w-sm animate-pop rounded-[24px] p-6 text-center shadow-pop">
        <ShieldCheck className="mx-auto h-9 w-9 text-gold-dark" strokeWidth={1.5} />
        <h3 className="mt-3 text-base font-semibold text-ink">להגן על הקופונים עם {LABEL}?</h3>
        <p className="mt-2 text-sm font-light leading-relaxed text-mute/75">מי שיחזיק את הטלפון לא יוכל לפתוח את האפליקציה ולראות את הקודים בלי לזהות אותך.</p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={turnOn} className="glass-navy flex-1 rounded-[14px] py-3 text-sm font-medium text-white">
            הפעלה
          </button>
          <button type="button" onClick={close} className="flex-1 rounded-[14px] border border-white/70 bg-white/60 py-3 text-sm font-medium text-mute">
            לא עכשיו
          </button>
        </div>
      </div>
    </div>
  );
}

/** The switch in Settings (shown only on devices with Face ID / fingerprint). */
export function LockSetting({ user }) {
  const toast = useToast();
  const available = useBiometrics();
  const [on, setOn] = useState(() => lockEnabled(user.uid));
  if (!available) return null;

  const toggle = async (next) => {
    if (!next) {
      disableLock(user.uid);
      setOn(false);
      toast('הנעילה כובתה');
      return;
    }
    try {
      await enableLock(user);
      setOn(true);
      toast(`הנעילה עם ${LABEL} הופעלה`);
    } catch {
      toast('ההפעלה בוטלה', 'error');
    }
  };

  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <Fingerprint className="h-4 w-4 text-gold-dark" strokeWidth={1.75} /> נעילה עם {LABEL}
          </p>
          <p className="mt-0.5 text-[11px] font-light text-mute/55">בכל פתיחה של האפליקציה במכשיר הזה</p>
        </div>
        <Switch checked={on} onChange={toggle} label={`נעילה עם ${LABEL}`} />
      </div>
    </Card>
  );
}
