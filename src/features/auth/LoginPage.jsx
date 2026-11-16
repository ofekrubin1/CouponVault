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
  { icon: BellRing, text: 'קופונים שעומדים לפוג קופצים במסך הבית' },
  { icon: Users, text: 'משותף לכל המשפחה, מתעדכן בזמן אמת' },
  { icon: ShieldCheck, text: 'רק חברי המשפחה רואים את הקופונים' },
];

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
      setErr('ההתחברות נכשלה. נסה שוב');
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-navy px-6 text-white">
      <span className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[#2C5F7C]/40 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-14">
        <img src="/icon.svg" alt="" className="mb-7 h-20 w-20 rounded-[22px] shadow-hero ring-1 ring-gold/40" />
        <p className="text-[10px] font-light uppercase tracking-[0.3em] text-gold/80">Family coupons</p>
        <h1 className="mt-1 text-[34px] font-semibold tracking-tight">CouponVault</h1>
        <p className="mt-2 text-[15px] font-light leading-relaxed text-white/60">כל הקופונים, השוברים וכרטיסי המתנה של המשפחה. במקום אחד, בלי לפספס אף תוקף.</p>

        <ul className="mt-8 space-y-3">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm font-light text-white/80">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] ring-1 ring-white/10">
                <Icon className="h-4 w-4 text-gold" strokeWidth={1.5} />
              </span>
              {text}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={login}
          disabled={busy}
          className="mt-10 flex w-full items-center justify-center gap-3 rounded-[14px] bg-white px-6 py-4 text-[15px] font-semibold text-ink shadow-hero transition active:scale-[0.98] disabled:opacity-70"
        >
          <GoogleIcon />
          {busy ? 'מתחבר…' : 'התחברות עם Google'}
        </button>
        {err && <p className="mt-4 rounded-[10px] bg-danger/20 px-3 py-2 text-center text-sm">{err}</p>}
      </div>
    </div>
  );
}
