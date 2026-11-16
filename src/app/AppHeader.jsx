import { Avatar } from '@/ui';
import { FamilySwitcher } from '@/features/families';
import { tabMeta } from './tabs';

/** Page header: eyebrow + title (the family switcher on the home tab) and the user's avatar. */
export function AppHeader({ tab, user, family, families, onGo }) {
  const meta = tabMeta(tab);
  return (
    <header className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="eyebrow">{tab === 'home' ? meta.eyebrow : `${meta.eyebrow} · ${family.name}`}</p>
        {tab === 'home' ? (
          <FamilySwitcher user={user} family={family} families={families} onManage={() => onGo('settings')} />
        ) : (
          <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{meta.title}</h1>
        )}
      </div>
      <button type="button" onClick={() => onGo('settings')} aria-label="הגדרות חשבון" className="shrink-0">
        <Avatar name={user.displayName} photo={user.photoURL} size={38} />
      </button>
    </header>
  );
}
