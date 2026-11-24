import { Users, Check, X } from 'lucide-react';
import { Avatar, Card, useConfirm, useToast } from '@/ui';
import { approveRequest, declineRequest, removeMember, setCurrentFamily } from '@/data';
import { membersOf } from '@/domain/family';
import { Count, SectionTitle } from '../SectionTitle';

/** People who asked to join with the code: any member lets them in or declines. */
function JoinRequests({ family, requests }) {
  const toast = useToast();
  if (!requests.length) return null;
  return (
    <div className="mb-3 rounded-[14px] border border-gold/40 bg-gold/[0.07] p-3" data-testid="join-requests">
      <p className="mb-2 text-xs font-semibold text-gold-deep">בקשות הצטרפות</p>
      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.uid} className="flex items-center gap-2.5" data-testid="join-request" data-name={r.name}>
            <Avatar name={r.name} photo={r.photo} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{r.name || 'משתמש'}</p>
              <p className="truncate text-[11px] font-light text-mute/50" dir="ltr">
                {r.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                approveRequest(family.id, r);
                toast(`${r.name || 'המשתמש'} צורף/ה למשפחה`);
              }}
              className="flex items-center gap-1 rounded-[10px] bg-gradient-to-b from-gold to-gold-dark px-3 py-1.5 text-xs font-semibold text-white shadow-goldbtn"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> אישור
            </button>
            <button
              type="button"
              onClick={() => declineRequest(family.id, r.uid)}
              aria-label={`דחיית ${r.name || 'הבקשה'}`}
              className="rounded-[10px] border border-white/80 bg-white/70 p-1.5 text-mute/60"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Join requests, the members list (remove others) and leaving the family. */
export function MembersSection({ user, family, families, requests = [] }) {
  const toast = useToast();
  const confirm = useConfirm();
  const members = membersOf(family);

  const kick = async (m) => {
    const ok = await confirm({ title: 'הסרת חבר', message: `להסיר את ${m.name} מהמשפחה? הוא לא יראה יותר את הקופונים.`, confirmText: 'הסר', danger: true });
    if (!ok) return;
    removeMember(family.id, m.uid);
    toast(`${m.name} הוסר מהמשפחה`);
  };

  const leave = async () => {
    const last = family.members.length === 1;
    const ok = await confirm({
      title: `לעזוב את "${family.name}"?`,
      message: last ? 'אתה החבר האחרון. אחרי שתעזוב, אף אחד לא יוכל לראות את הקופונים של המשפחה.' : 'תוכל לחזור בעזרת קוד הזמנה.',
      confirmText: 'עזוב',
      danger: true,
    });
    if (!ok) return;
    const other = families.find((f) => f.id !== family.id);
    removeMember(family.id, user.uid);
    setCurrentFamily(user.uid, other?.id || null);
    toast('עזבת את המשפחה');
  };

  return (
    <Card>
      <SectionTitle icon={Users} aside={<Count n={members.length} />}>
        חברים
      </SectionTitle>
      <JoinRequests family={family} requests={requests} />
      <ul className="divide-y divide-navy/[0.05]" data-testid="members">
        {members.map((m) => (
          <li key={m.uid} className="flex items-center gap-3 py-2.5">
            <Avatar name={m.name} photo={m.photo} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {m.name}
                {m.uid === user.uid && <span className="font-light text-mute/50"> (אני)</span>}
              </p>
              <p className="truncate text-[11px] font-light text-mute/50" dir="ltr">
                {m.email}
              </p>
            </div>
            {m.uid !== user.uid && (
              <button type="button" className="rounded-[8px] px-2 py-1 text-[11px] font-medium text-danger hover:bg-danger/5" onClick={() => kick(m)}>
                הסר
              </button>
            )}
          </li>
        ))}
      </ul>
      <button type="button" onClick={leave} className="mt-3 w-full rounded-[14px] border border-danger/20 bg-white/60 py-2.5 text-sm font-medium text-danger shadow-btn2">
        עזיבת המשפחה
      </button>
    </Card>
  );
}
