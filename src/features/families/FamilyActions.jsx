import { useEffect, useRef, useState } from 'react';
import { Plus, LogIn, Users } from 'lucide-react';
import { createFamily, requestToJoin, setCurrentFamily } from '@/data';
import { Button, Card, Field, IconTile, Input, cx, useToast } from '@/ui';
import { normalizeInviteCode } from '@/domain/family';

/** Create-a-family / join-with-code. Used on the welcome screen and in settings. */
export function FamilyActions({ user, families = [], initialCode = '', compact = false, onDone }) {
  const toast = useToast();
  const [mode, setMode] = useState(initialCode ? 'join' : null);
  const [name, setName] = useState('');
  const [code, setCode] = useState(initialCode);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => {
    alive.current = false;
  }, []);

  async function submit() {
    setErr('');
    if (mode === 'create') {
      if (!name.trim()) return setErr('יש לתת שם למשפחה');
      createFamily(user, name);
      toast(`המשפחה "${name.trim()}" נוצרה`);
      setName('');
      setMode(null);
      onDone?.();
      return;
    }
    const clean = code.trim().toUpperCase();
    const mine = families.find((f) => f.inviteCode === clean);
    if (mine) {
      toast('אתה כבר חבר במשפחה הזו');
      setMode(null);
      onDone?.();
      setCurrentFamily(user.uid, mine.id);
      return;
    }
    setBusy(true);
    try {
      const r = await requestToJoin(user, clean);
      if (r.already) {
        toast('אתה כבר חבר במשפחה הזו');
        setCurrentFamily(user.uid, r.id);
      } else {
        toast('הבקשה נשלחה. ממתינים לאישור');
      }
      onDone?.();
      if (!alive.current) return;
      setMode(null);
      setCode('');
    } catch (e) {
      if (alive.current) setErr(e.message);
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  if (!mode) {
    return (
      <div className={cx('grid grid-cols-2 gap-3', compact && 'gap-2')}>
        <Card onClick={() => setMode('create')} className={cx('flex flex-col items-center gap-2 text-center', compact ? '!p-3.5' : '!p-5')}>
          <IconTile icon={Plus} tone="navy" size={compact ? 36 : 44} />
          <span className="text-sm font-semibold text-ink">משפחה חדשה</span>
          {!compact && <span className="text-[11px] font-light text-mute/50">פותחים ומזמינים אחרים</span>}
        </Card>
        <Card onClick={() => setMode('join')} className={cx('flex flex-col items-center gap-2 text-center', compact ? '!p-3.5' : '!p-5')}>
          <IconTile icon={LogIn} tone="gold" size={compact ? 36 : 44} />
          <span className="text-sm font-semibold text-ink">הצטרפות בקוד</span>
          {!compact && <span className="text-[11px] font-light text-mute/50">קיבלת קוד מבן משפחה?</span>}
        </Card>
      </div>
    );
  }

  return (
    <Card gold className="space-y-4" data-testid="family-form">
      <div className="flex items-center gap-2.5">
        <IconTile icon={mode === 'create' ? Users : LogIn} tone={mode === 'create' ? 'navy' : 'gold'} size={34} />
        <h3 className="text-sm font-semibold text-ink">{mode === 'create' ? 'משפחה חדשה' : 'הצטרפות למשפחה'}</h3>
      </div>
      {mode === 'create' ? (
        <Field id="family-name" label="שם המשפחה" error={err}>
          <Input id="family-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: משפחת רובין" autoFocus error={err} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </Field>
      ) : (
        <Field id="invite-code" label="קוד הזמנה" error={err} hint="את הקוד מקבלים מחבר במשפחה (בהגדרות שלו). אחרי השליחה, חבר במשפחה צריך לאשר אותך.">
          <Input
            id="invite-code"
            dir="ltr"
            maxLength={8}
            value={code}
            onChange={(e) => { setCode(normalizeInviteCode(e.target.value)); setErr(''); }}
            placeholder="ABCD2345"
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            error={err}
            className="text-center font-mono text-xl font-semibold tracking-[0.25em]"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </Field>
      )}
      <div className="flex gap-2">
        <Button variant="primary" className="flex-1" onClick={submit} disabled={busy}>
          {busy ? 'שולח…' : mode === 'create' ? 'צור משפחה' : 'בקשת הצטרפות'}
        </Button>
        <Button variant="soft" onClick={() => { setMode(null); setErr(''); }}>
          ביטול
        </Button>
      </div>
    </Card>
  );
}
