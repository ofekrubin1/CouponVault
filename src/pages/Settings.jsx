import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { arrayRemove, arrayUnion } from 'firebase/firestore';
import { Copy, Share2, RefreshCw, Check, Pencil, X, LogOut, Users, Bell, Tag, Home as HomeIcon } from 'lucide-react';
import { auth } from '../firebase';
import { regenerateInvite, removeMember, setCurrentFamily, updateFamily } from '../data';
import { DEFAULT_CATEGORIES } from '../constants';
import FamilyActions from '../components/FamilyActions';
import { useToast } from '../components/Toast';

function Section({ icon: Icon, title, children }) {
  return (
    <section className="card p-4">
      <h2 className="mb-3 flex items-center gap-2 font-bold"><Icon size={18} className="text-brand-600" /> {title}</h2>
      {children}
    </section>
  );
}

export default function Settings({ user, family, families }) {
  const toast = useToast();
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(family.name);
  const [newCat, setNewCat] = useState('');

  const wrap = (fn, msg) => async (...a) => {
    try {
      await fn(...a);
      if (msg) toast(msg);
    } catch (e) {
      console.error(e);
      toast('הפעולה נכשלה');
    }
  };

  const joinLink = `${location.origin}/?join=${family.inviteCode}`;

  const share = async () => {
    const text = `הצטרפו למשפחת הקופונים "${family.name}" ב-CouponVault.\nקוד: ${family.inviteCode}\n${joinLink}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'CouponVault', text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast('הקישור הועתק');
    }
  };

  const saveName = wrap(async () => {
    if (!name.trim()) return;
    await updateFamily(family.id, { name: name.trim() });
    setEditName(false);
  }, 'השם עודכן');

  const leave = wrap(async () => {
    const last = family.members.length === 1;
    if (!confirm(last ? 'אתה החבר האחרון. אם תעזוב, הקופונים של המשפחה לא יהיו נגישים לאף אחד. לעזוב?' : `לעזוב את "${family.name}"?`)) return;
    const other = families.find((f) => f.id !== family.id);
    await removeMember(family.id, user.uid);
    await setCurrentFamily(user.uid, other?.id || null);
  }, 'עזבת את המשפחה');

  const kick = (uid, nm) => wrap(async () => {
    if (!confirm(`להסיר את ${nm} מהמשפחה?`)) return;
    await removeMember(family.id, uid);
  }, 'החבר הוסר');

  const addCat = wrap(async () => {
    const c = newCat.trim();
    if (!c) return;
    await updateFamily(family.id, { customCategories: arrayUnion(c) });
    setNewCat('');
  }, 'הקטגוריה נוספה');

  const members = family.members.map((uid) => ({ uid, ...(family.memberInfo?.[uid] || { name: 'משתמש' }) }));

  return (
    <div className="space-y-4 px-4 pb-6 pt-3">
      <Section icon={HomeIcon} title="המשפחה הנוכחית">
        {editName ? (
          <div className="flex gap-2">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && saveName()} />
            <button className="btn-primary px-3" onClick={saveName}><Check size={18} /></button>
            <button className="btn-secondary px-3" onClick={() => { setEditName(false); setName(family.name); }}><X size={18} /></button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{family.name}</span>
            <button className="text-slate-400" onClick={() => setEditName(true)} aria-label="שנה שם"><Pencil size={18} /></button>
          </div>
        )}

        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <div className="text-sm text-slate-500">קוד הזמנה להצטרפות</div>
          <div className="mt-1 flex items-center justify-between">
            <span dir="ltr" className="font-mono text-2xl font-extrabold tracking-[0.25em]">{family.inviteCode}</span>
            <div className="flex gap-1">
              <button className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="העתק" onClick={() => navigator.clipboard.writeText(family.inviteCode).then(() => toast('הקוד הועתק'))}><Copy size={18} /></button>
              <button className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label="שתף" onClick={share}><Share2 size={18} /></button>
              <button
                className="rounded-lg p-2 text-slate-500 hover:bg-white"
                aria-label="קוד חדש"
                onClick={() => confirm('ליצור קוד חדש? הקוד הישן יפסיק לעבוד.') && wrap(() => regenerateInvite(family), 'נוצר קוד חדש')()}
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>
      </Section>

      <Section icon={Users} title={`חברים (${members.length})`}>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.uid} className="flex items-center gap-3">
              {m.photo ? (
                <img src={m.photo} alt="" className="h-9 w-9 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">{m.name?.[0]}</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{m.name}{m.uid === user.uid && <span className="text-slate-400"> (אני)</span>}</div>
                <div className="truncate text-xs text-slate-400">{m.email}</div>
              </div>
              {m.uid !== user.uid && (
                <button className="text-xs text-red-500" onClick={kick(m.uid, m.name)}>הסר</button>
              )}
            </li>
          ))}
        </ul>
        <button className="btn-danger mt-4 w-full text-sm" onClick={leave}>עזיבת המשפחה</button>
      </Section>

      <Section icon={Bell} title="התראת תפוגה">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600">להציג במסך הבית קופונים שפג תוקפם בעוד</span>
          <select
            className="input w-28"
            value={family.alertDays ?? 14}
            onChange={(e) => wrap(() => updateFamily(family.id, { alertDays: Number(e.target.value) }), 'נשמר')()}
          >
            {[3, 7, 14, 30, 60].map((d) => <option key={d} value={d}>{d} ימים</option>)}
          </select>
        </label>
      </Section>

      <Section icon={Tag} title="קטגוריות">
        <div className="flex flex-wrap gap-2">
          {DEFAULT_CATEGORIES.map((c) => <span key={c} className="chip bg-slate-100 text-slate-600">{c}</span>)}
          {(family.customCategories || []).map((c) => (
            <span key={c} className="chip flex items-center gap-1 bg-brand-50 text-brand-700">
              {c}
              <button aria-label="הסר" onClick={() => confirm(`להסיר את הקטגוריה "${c}"?`) && wrap(() => updateFamily(family.id, { customCategories: arrayRemove(c) }), 'הוסרה')()}>
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input className="input" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="קטגוריה חדשה" onKeyDown={(e) => e.key === 'Enter' && addCat()} />
          <button className="btn-primary" onClick={addCat}>הוסף</button>
        </div>
      </Section>

      <Section icon={Users} title="המשפחות שלי">
        <ul className="mb-3 space-y-1.5">
          {families.map((f) => (
            <li key={f.id}>
              <button
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-right ${f.id === family.id ? 'bg-brand-50 font-bold text-brand-700' : 'bg-slate-50'}`}
                onClick={() => f.id !== family.id && setCurrentFamily(user.uid, f.id)}
              >
                {f.name}
                <span className="text-xs font-normal text-slate-400">{f.members.length} חברים</span>
              </button>
            </li>
          ))}
        </ul>
        <FamilyActions user={user} onDone={() => toast('בוצע')} />
      </Section>

      <section className="card flex items-center justify-between p-4">
        <span className="truncate text-sm text-slate-500">{user.email}</span>
        <button className="flex items-center gap-1 text-sm font-medium text-red-500" onClick={() => signOut(auth)}>
          <LogOut size={16} /> התנתקות
        </button>
      </section>
    </div>
  );
}
