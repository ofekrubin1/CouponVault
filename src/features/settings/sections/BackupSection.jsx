import { useEffect, useState } from 'react';
import { DatabaseBackup, Download } from 'lucide-react';
import { Card, useToast } from '@/ui';
import { fetchCoupons } from '@/data';
import { backupFileName, buildBackup } from '@/domain/backup';
import { saveFileAs } from '@/services/files';
import { SectionTitle } from '../SectionTitle';

/**
 * The backup file, prepared as soon as settings open: a phone only opens its save / share window straight after
 * a tap, with no time to read the data then. Returns { file, coupons } or null while it's being prepared.
 */
function useBackupFile(user, families) {
  const [ready, setReady] = useState(null);
  const ids = families.map((f) => f.id).join(',');
  useEffect(() => {
    let live = true;
    setReady(null);
    Promise.all(families.map((f) => fetchCoupons(f.id).then((list) => [f.id, list])))
      .then((pairs) => {
        if (!live) return;
        const couponsByFamily = Object.fromEntries(pairs);
        const backup = buildBackup({ user, families, couponsByFamily });
        const file = new File([JSON.stringify(backup, null, 2)], backupFileName(), { type: 'application/json' });
        setReady({ file, coupons: pairs.reduce((n, [, list]) => n + list.length, 0) });
      })
      .catch((e) => console.error('[backup]', e));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid, ids]);
  return ready;
}

/** Export everything (every family and all its coupons, archive included) to a file the user saves where they like. */
export function BackupSection({ user, families }) {
  const toast = useToast();
  const ready = useBackupFile(user, families);

  const save = async () => {
    if (!ready) return;
    try {
      const r = await saveFileAs(ready.file, { description: 'גיבוי CouponVault', accept: { 'application/json': ['.json'] } });
      if (r !== 'cancelled') toast('הגיבוי נשמר');
    } catch (e) {
      console.error('[backup]', e);
      toast('שמירת הגיבוי נכשלה. נסו שוב', 'error');
    }
  };

  return (
    <Card>
      <SectionTitle icon={DatabaseBackup}>גיבוי</SectionTitle>
      <p className="mb-3 text-xs font-light leading-relaxed text-mute/60">
        שמירת כל המשפחות שלך וכל הקופונים שלהן (כולל הארכיון) בקובץ אחד. בטלפון ייפתח חלון שיתוף, ומשם אפשר לשמור ב"קבצים", בדרייב או במייל.
      </p>
      <button
        type="button"
        onClick={save}
        disabled={!ready}
        data-testid="backup-button"
        className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-white/80 bg-white/70 py-3 text-sm font-medium text-navy shadow-btn2 active:scale-[0.99] disabled:opacity-50"
      >
        <Download className="h-4 w-4" strokeWidth={1.75} />
        {ready ? `שמירת גיבוי · ${families.length} משפחות, ${ready.coupons} קופונים` : 'מכין את הגיבוי…'}
      </button>
    </Card>
  );
}
