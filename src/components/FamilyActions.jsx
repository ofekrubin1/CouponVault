import { useEffect, useRef, useState } from 'react';
import { Plus, LogIn, Users } from 'lucide-react';
import { createFamily, joinFamily, setCurrentFamily } from '../data';
import { Button, Card, IconTile, cx } from '../ui/primitives';
import { Field, Input } from '../ui/fields';
import { useToast } from '../ui/feedback';

const JOIN_TIMEOUT = 15000;

/** Create-a-family / join-with-code. Used on the welcome screen and in settings. */
export default function FamilyActions({ user, families = [], initialCode = '', compact = false, onDone }) {
  const toast = useToast();
  const [mode, setMode] = useState(initialCode ? 'join' : null);
  const [name, setName] = useState('');
  const [code, setCode] = useState(initialCode);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // A join is done once the family shows up in my list (the server accepted it).
  useEffect(() => {
    if (!pendingId) return undefined;
    const joined = families.find((f) => f.id === pendingId);
    if (joined) {
      toast(`הצטרפת ל"${joined.name}" 🎉`);
      setPendingId(null);
      setBusy(false);
      setMode(null);
      setCode('');
      onDoneRef.current?.();
      setCurrentFamily(user.uid, joined.id);
      return undefined;
    }
    const t = setTimeout(() => {
      setPendingId(null);
      setBusy(false);
      setErr('ההצטרפות לא הושלמה. בדוק את החיבור ונסה שוב');
    }, JOIN_TIMEOUT);
    return () => clearTimeout(t);
  }, [pendingId, families, toast, user.uid]);

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
      setPendingId(await joinFamily(user, clean));
    } catch (e) {
      setErr(e.message);
      setBusy(false);
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
        <Field id="invite-code" label="קוד הזמנה" error={err} hint="את הקוד מקבלים מחבר במשפחה (בהגדרות שלו)">
          <Input
            id="invite-code"
            dir="ltr"
            maxLength={6}
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setErr(''); }}
            placeholder="ABC123"
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            error={err}
            className="text-center font-mono text-xl font-semibold tracking-[0.4em]"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </Field>
      )}
      <div className="flex gap-2">
        <Button variant="primary" className="flex-1" onClick={submit} disabled={busy}>
          {busy ? 'מצטרף…' : mode === 'create' ? 'צור משפחה' : 'הצטרף'}
        </Button>
        <Button variant="soft" onClick={() => { setMode(null); setErr(''); setBusy(false); setPendingId(null); }}>
          ביטול
        </Button>
      </div>
    </Card>
  );
}
