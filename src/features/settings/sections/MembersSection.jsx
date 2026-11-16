import { Users } from 'lucide-react';
import { Avatar, Card, useConfirm, useToast } from '@/ui';
import { removeMember, setCurrentFamily } from '@/data';
import { membersOf } from '@/domain/family';
import { Count, SectionTitle } from '../SectionTitle';

/** Members list (remove others) and leaving the family. */
export function MembersSection({ user, family, families }) {
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
