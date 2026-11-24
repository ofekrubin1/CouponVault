import { LogOut } from 'lucide-react';
import { Avatar, Card } from '@/ui';
import { signOut } from '@/services/auth';
import { buildLabel } from '@/app/appUpdate';
import { LockSetting } from '@/features/auth/AppLock';

export function AccountSection({ user }) {
  return (
    <>
      <LockSetting user={user} />
      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.displayName} photo={user.photoURL} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{user.displayName}</p>
            <p className="truncate text-[11px] font-light text-mute/50" dir="ltr">
              {user.email}
            </p>
          </div>
          <button type="button" className="flex items-center gap-1.5 rounded-[10px] bg-danger/5 px-3 py-2 text-xs font-medium text-danger" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} /> התנתקות
          </button>
        </div>
      </Card>
      <p className="pb-2 text-center text-[10px] font-light tracking-widest text-mute/40" data-testid="app-version">
        COUPONVAULT · גרסה {buildLabel()}
      </p>
    </>
  );
}
