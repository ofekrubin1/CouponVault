import { useState } from 'react';
import { Plus, LogIn } from 'lucide-react';
import { createFamily, joinFamily } from '../data';

/** Create-a-family / join-with-code forms. Used in onboarding and settings. */
export default function FamilyActions({ user, initialCode = '', onDone }) {
  const [mode, setMode] = useState(initialCode ? 'join' : null);
  const [name, setName] = useState('');
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    setErr('');
    setBusy(true);
    try {
      if (mode === 'create') {
        if (!name.trim()) throw new Error('יש לתת שם למשפחה');
        await createFamily(user, name);
      } else {
        await joinFamily(user, code);
      }
      setMode(null);
      setName('');
      setCode('');
      onDone?.();
    } catch (e) {
      console.error(e);
      setErr(e.message || 'משהו השתבש');
    } finally {
      setBusy(false);
    }
  }

  if (!mode) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button className="card flex flex-col items-center gap-2 p-4 font-medium" onClick={() => setMode('create')}>
          <Plus className="text-brand-600" /> משפחה חדשה
        </button>
        <button className="card flex flex-col items-center gap-2 p-4 font-medium" onClick={() => setMode('join')}>
          <LogIn className="text-brand-600" /> הצטרפות בקוד
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-3 p-4">
      {mode === 'create' ? (
        <div>
          <label className="label">שם המשפחה</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: משפחת רובין" autoFocus onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
      ) : (
        <div>
          <label className="label">קוד הזמנה</label>
          <input
            className="input text-center font-mono text-xl uppercase tracking-[0.3em]"
            dir="ltr"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <p className="mt-1 text-xs text-slate-400">את הקוד מקבלים מחבר במשפחה (במסך ההגדרות שלו)</p>
        </div>
      )}
      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button className="btn-primary flex-1" onClick={submit} disabled={busy}>
          {busy ? 'רגע…' : mode === 'create' ? 'צור משפחה' : 'הצטרף'}
        </button>
        <button className="btn-secondary" onClick={() => { setMode(null); setErr(''); }}>ביטול</button>
      </div>
    </div>
  );
}
