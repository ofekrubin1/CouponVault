import { Users, Check, ChevronLeft } from 'lucide-react';
import { Card, cx, useToast } from '@/ui';
import { setCurrentFamily } from '@/data';
import { FamilyActions } from '@/features/families';
import { Count, SectionTitle } from '../SectionTitle';

/** All my families (switch between them) + create / join another. */
export function FamiliesSection({ user, family, families }) {
  const toast = useToast();
  return (
    <Card>
      <SectionTitle icon={Users} aside={<Count n={families.length} />}>
        המשפחות שלי
      </SectionTitle>
      <ul className="mb-3 space-y-1.5" data-testid="my-families">
        {families.map((f) => {
          const on = f.id === family.id;
          return (
            <li key={f.id}>
              <button
                type="button"
                className={cx('flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-right transition-colors', on ? 'chip-on border' : 'border border-white/80 bg-white/55 text-ink')}
                onClick={() => {
                  if (on) return;
                  setCurrentFamily(user.uid, f.id);
                  toast(`עברת ל"${f.name}"`);
                }}
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{f.name}</span>
                <span className={cx('text-[11px] font-light', on ? 'text-accent/80' : 'text-mute/50')}>{f.members.length} חברים</span>
                {on ? <Check className="h-4 w-4 text-accent" strokeWidth={2} /> : <ChevronLeft className="h-4 w-4 text-mute/30" strokeWidth={1.75} />}
              </button>
            </li>
          );
        })}
      </ul>
      <FamilyActions user={user} families={families} compact />
    </Card>
  );
}
