import { useState } from 'react';
import { ShieldCheck, Users, BellRing } from 'lucide-react';
import { signInWithGoogle } from '@/services/auth';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

const POINTS = [
  { icon: BellRing, title: 'תזכורת בזמן', text: 'קופון שעומד לפוג קופץ במסך הבית' },
  { icon: Users, title: 'לכל המשפחה', text: 'כולם רואים מה יש וכמה נשאר' },
  { icon: ShieldCheck, title: 'פרטי ובטוח', text: 'רק בני המשפחה רואים את הקופונים' },
];

/** What to tell the user when sign-in fails (the real reason, not always "check the internet"). */
function signInError(e) {
  if (e?.code === 'auth/network-request-failed') return 'לא הצלחנו להתחבר. כדאי לבדוק את החיבור לאינטרנט ולנסות שוב';
  if (e?.code === 'auth/unauthorized-domain') return 'אי אפשר להתחבר מהכתובת הזו. פתחו את האפליקציה מהכתובת הרגילה שלה';
  return `ההתחברות נכשלה. נסו שוב${e?.code ? ` (${e.code})` : ''}`;
}

/** Sign-in screen: light liquid background, centred, one clear action. */
export function LoginPage() {
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function login() {
    setErr('');
    setBusy(true);
    try {
      if (!(await signInWithGoogle())) setBusy(false);
    } catch (e) {
      console.error(e);
      setErr(signInError(e));
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden px-6 text-center">
      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center py-12">
        <span className="relative">
          <span className="pointer-events-none absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(201,164,91,0.28),transparent_70%)]" />
          <img src="/icon.svg" alt="" className="relative h-[84px] w-[84px] rounded-[24px] shadow-[0_10px_30px_rgba(10,31,68,0.18)] ring-1 ring-white/80" />
        </span>
        <h1 className="mt-6 text-[32px] font-semibold tracking-tight text-navy">CouponVault</h1>
        <p className="mt-1 text-[15px] font-medium text-gold-dark">הארנק המשפחתי לקופונים ושוברים</p>
        <p className="mt-3 max-w-[290px] text-[14px] font-light leading-relaxed text-mute/70">
          שומרים כל קופון פעם אחת, וכל המשפחה יודעת מה יש, כמה נשאר ועד מתי.
        </p>

        <ul className="mt-8 grid w-full grid-cols-3 gap-2.5">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="glass-card flex flex-col items-center rounded-[18px] px-2 pb-3 pt-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-gold/[0.12]">
                <Icon className="h-[18px] w-[18px] text-gold-dark" strokeWidth={1.6} />
              </span>
              <span className="mt-2 text-[12.5px] font-semibold text-ink">{title}</span>
              <span className="mt-0.5 text-[11px] font-light leading-snug text-mute/60">{text}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={login}
          disabled={busy}
          className="mt-9 flex w-full items-center justify-center gap-3 rounded-[16px] border border-white/90 bg-white px-6 py-[15px] text-[15px] font-semibold text-ink shadow-[0_6px_20px_rgba(10,31,68,0.10),0_1px_3px_rgba(10,31,68,0.06)] transition active:scale-[0.98] disabled:opacity-70"
        >
          <GoogleIcon />
          {busy ? 'מתחברים…' : 'התחברות עם Google'}
        </button>
        <p className="mt-3 text-[12px] font-light leading-relaxed text-mute/50">אחרי ההתחברות אפשר ליצור משפחה חדשה, או להצטרף למשפחה עם קוד הזמנה</p>
        {err && (
          <p role="alert" className="mt-4 w-full rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">
            {err}
          </p>
        )}
      </div>
    </div>
  );
}
