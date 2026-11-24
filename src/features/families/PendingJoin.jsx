import { useEffect, useState } from 'react';
import { Hourglass, XCircle } from 'lucide-react';
import { Card, useToast } from '@/ui';
import { clearMyRequest, setCurrentFamily, watchMyRequest } from '@/data';

/**
 * "Waiting for approval" after asking to join a family with a code. Follows the request: once a member approves,
 * switches to the family; if declined, says so. The asker can withdraw meanwhile.
 */
export function PendingJoin({ user, pending }) {
  const toast = useToast();
  const [req, setReq] = useState(undefined); // undefined: loading · null: gone · { status }
  const { familyId, familyName } = pending;

  useEffect(() => watchMyRequest(familyId, user.uid, setReq), [familyId, user.uid]);

  useEffect(() => {
    if (req?.status === 'approved') {
      setCurrentFamily(user.uid, familyId);
      clearMyRequest(familyId, user.uid);
      toast(`אושרת! הצטרפת ל"${familyName || 'המשפחה'}" 🎉`);
    } else if (req === null) {
      clearMyRequest(familyId, user.uid); // withdrawn elsewhere, or cleaned up
    }
  }, [req, familyId, familyName, user.uid, toast]);

  if (req?.status === 'declined') {
    return (
      <Card className="flex items-start gap-3" data-testid="join-declined">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">הבקשה להצטרף ל"{familyName || 'המשפחה'}" לא אושרה</p>
          <p className="mt-0.5 text-xs font-light text-mute/60">אפשר לבקש מחבר במשפחה קוד חדש ולנסות שוב.</p>
        </div>
        <button type="button" className="shrink-0 text-xs font-medium text-gold-dark" onClick={() => clearMyRequest(familyId, user.uid)}>
          הבנתי
        </button>
      </Card>
    );
  }

  return (
    <Card gold className="flex items-start gap-3" data-testid="join-pending">
      <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">הבקשה להצטרף ל"{familyName || 'המשפחה'}" נשלחה</p>
        <p className="mt-0.5 text-xs font-light leading-relaxed text-mute/60">ממתינים שאחד מחברי המשפחה יאשר. ברגע שיאשרו, המשפחה תופיע כאן לבד.</p>
      </div>
      <button type="button" className="shrink-0 text-xs font-medium text-mute/60" onClick={() => clearMyRequest(familyId, user.uid)}>
        ביטול בקשה
      </button>
    </Card>
  );
}
