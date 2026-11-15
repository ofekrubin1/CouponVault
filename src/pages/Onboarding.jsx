import { signOut } from 'firebase/auth';
import { Ticket, LogOut } from 'lucide-react';
import { auth } from '../firebase';
import FamilyActions from '../components/FamilyActions';
import { Card, PageHeader } from '../ui/primitives';
import { firstName } from '../lib';

export default function Onboarding({ user, joinCode }) {
  return (
    <div className="mx-auto min-h-[100dvh] max-w-lg space-y-4 px-5 pb-10 pt-14">
      <PageHeader eyebrow="ברוך הבא" title={`שלום ${firstName(user.displayName)} 👋`} />

      <Card gold>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-b from-navy-light to-navy shadow-btn">
            <Ticket className="h-5 w-5 text-gold" strokeWidth={1.5} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">איך זה עובד?</h2>
            <p className="mt-1 text-xs font-light leading-relaxed text-mute/70">
              קופונים נשמרים בתוך <b className="font-semibold text-ink">משפחה</b>. כל החברים בה רואים ומעדכנים אותם בזמן אמת. אפשר להיות חבר בכמה משפחות.
            </p>
          </div>
        </div>
      </Card>

      <p className="section-title pt-2">להתחיל</p>
      <FamilyActions user={user} initialCode={joinCode} />

      <button type="button" className="mx-auto flex items-center gap-1.5 pt-6 text-xs font-light text-mute/50" onClick={() => signOut(auth)}>
        <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} /> התנתקות ({user.email})
      </button>
    </div>
  );
}
