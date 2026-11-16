import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { arrayRemove, arrayUnion } from 'firebase/firestore';
import {
  Copy, Share2, RefreshCw, Check, Pencil, X, LogOut, Users, Bell, Tag, Home as HomeIcon, KeyRound, Plus, ChevronLeft,
} from 'lucide-react';
import { auth } from '../firebase';
import { regenerateInvite, removeMember, setCurrentFamily, updateFamily } from '../data';
import { ALERT_DAY_OPTIONS, DEFAULT_CATEGORIES, categoryStyle } from '../constants';
import FamilyActions from '../components/FamilyActions';
import { Avatar, Card, Segmented, cx } from '../ui/primitives';
import { Input } from '../ui/fields';
import { useConfirm, useToast } from '../ui/feedback';

function SectionTitle({ icon: Icon, children, aside }) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b border-navy/[0.06] pb-3">
      <Icon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
      <h3 className="flex-1 text-xs font-medium uppercase tracking-widest text-navy">{children}</h3>
      {aside}
    </div>
  );
}

const iconBtn = 'flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/70 text-navy/70 shadow-btn2 active:scale-95';

export default function Settings({ user, family, families }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(family.name);
  const [newCat, setNewCat] = useState('');

  const members = family.members.map((uid) => ({ uid, ...(family.memberInfo?.[uid] || { name: 'משתמש' }) }));
  const custom = family.customCategories || [];
  const joinLink = `${window.location.origin}/?join=${family.inviteCode}`;

  const saveName = () => {
    if (!name.trim()) return;
    updateFamily(family.id, { name: name.trim() });
    setEditName(false);
    toast('השם עודכן');
  };

  const copy = (text, msg) => navigator.clipboard?.writeText(text).then(() => toast(msg), () => toast('ההעתקה נכשלה', 'error'));

  const share = async () => {
    const text = `מצטרפים למשפחת הקופונים "${family.name}" ב-CouponVault.\nקוד הזמנה: ${family.inviteCode}\n${joinLink}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CouponVault', text });
      } catch {
        /* cancelled */
      }
    } else copy(text, 'ההזמנה הועתקה');
  };

  const regenerate = async () => {
    const ok = await confirm({ title: 'ליצור קוד חדש?', message: 'הקוד הנוכחי יפסיק לעבוד. מי שכבר במשפחה לא יושפע.', confirmText: 'צור קוד חדש' });
    if (!ok) return;
    regenerateInvite(family);
    toast('נוצר קוד הזמנה חדש');
  };

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

  const addCat = () => {
    const c = newCat.trim();
    if (!c) return;
    if (DEFAULT_CATEGORIES.includes(c) || custom.includes(c)) {
      toast('הקטגוריה כבר קיימת', 'error');
      return;
    }
    updateFamily(family.id, { customCategories: arrayUnion(c) });
    setNewCat('');
    toast('הקטגוריה נוספה');
  };

  const removeCat = async (c) => {
    const ok = await confirm({ title: 'הסרת קטגוריה', message: `להסיר את "${c}"? קופונים קיימים ישמרו את הקטגוריה.`, confirmText: 'הסר', danger: true });
    if (ok) updateFamily(family.id, { customCategories: arrayRemove(c) });
  };

  return (
    <div className="space-y-4">
      {/* family */}
      <Card gold>
        <SectionTitle icon={HomeIcon}>המשפחה הנוכחית</SectionTitle>
        {editName ? (
          <div className="flex gap-2">
            <div className="flex-1">
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && saveName()} aria-label="שם המשפחה" />
            </div>
            <button type="button" className="rounded-[10px] bg-navy px-3 text-white shadow-btn" onClick={saveName} aria-label="שמור">
              <Check className="h-4 w-4" strokeWidth={2} />
            </button>
            <button type="button" className="rounded-[12px] border border-white/70 bg-white/55 px-3 text-mute" onClick={() => { setEditName(false); setName(family.name); }} aria-label="ביטול">
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink" data-testid="family-name">{family.name}</p>
              <p className="text-[11px] font-light text-mute/50">{members.length} חברים</p>
            </div>
            <button type="button" className={iconBtn} onClick={() => setEditName(true)} aria-label="שינוי שם המשפחה">
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        )}

        <div className="mt-4 rounded-[16px] border border-white/80 bg-white/45 p-4 shadow-inset">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-mute/70">
            <KeyRound className="h-3.5 w-3.5 text-gold-dark" strokeWidth={1.75} /> קוד הזמנה להצטרפות
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span dir="ltr" className="font-mono text-[26px] font-semibold tracking-[0.3em] text-navy" data-testid="invite-code">
              {family.inviteCode}
            </span>
            <div className="flex gap-1.5">
              <button type="button" className={iconBtn} aria-label="העתק קוד" onClick={() => copy(family.inviteCode, 'הקוד הועתק')}>
                <Copy className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button type="button" className={iconBtn} aria-label="שתף הזמנה" onClick={share}>
                <Share2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button type="button" className={iconBtn} aria-label="קוד חדש" onClick={regenerate}>
                <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* members */}
      <Card>
        <SectionTitle icon={Users} aside={<span className="text-[11px] font-light text-gold-dark">{members.length}</span>}>
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
                <p className="truncate text-[11px] font-light text-mute/50" dir="ltr">{m.email}</p>
              </div>
              {m.uid !== user.uid && (
                <button type="button" className="rounded-[8px] px-2 py-1 text-[11px] font-medium text-danger hover:bg-danger/5" onClick={() => kick(m)}>
                  הסר
                </button>
              )}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={leave}
          className="mt-3 w-full rounded-[14px] border border-danger/20 bg-white/60 py-2.5 text-sm font-medium text-danger shadow-btn2"
        >
          עזיבת המשפחה
        </button>
      </Card>

      {/* alerts */}
      <Card>
        <SectionTitle icon={Bell}>התראת תפוגה</SectionTitle>
        <p className="mb-3 text-xs font-light leading-relaxed text-mute/60">כמה ימים לפני התפוגה הקופון יקפוץ במסך הבית בתור "עומד לפוג"</p>
        <Segmented
          name="ימי התראה"
          value={family.alertDays ?? 14}
          onChange={(d) => { updateFamily(family.id, { alertDays: d }); toast(`התראה ${d} ימים לפני התפוגה`); }}
          options={ALERT_DAY_OPTIONS.map((d) => ({ key: d, label: `${d} ימים` }))}
        />
      </Card>

      {/* categories */}
      <Card>
        <SectionTitle icon={Tag}>קטגוריות</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {[...DEFAULT_CATEGORIES, ...custom].map((c) => {
            const { icon: Icon, color } = categoryStyle(c);
            const isCustom = custom.includes(c);
            return (
              <span
                key={c}
                className={cx(
                  'flex items-center gap-1.5 rounded-[9px] border px-2.5 py-1.5 text-[13px]',
                  isCustom ? 'border-gold/40 bg-gold/[0.06] text-ink' : 'border-white/80 bg-white/55 text-mute',
                )}
              >
                <Icon className="h-3.5 w-3.5" style={{ color }} strokeWidth={1.75} />
                {c}
                {isCustom && (
                  <button type="button" onClick={() => removeCat(c)} aria-label={`הסר ${c}`} className="-ml-1 rounded-full p-0.5 text-mute/50 hover:bg-white">
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <div className="flex-1">
            <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="קטגוריה חדשה" onKeyDown={(e) => e.key === 'Enter' && addCat()} aria-label="קטגוריה חדשה" />
          </div>
          <button type="button" onClick={addCat} className="flex items-center gap-1 rounded-[10px] bg-gradient-to-b from-gold to-gold-dark px-4 text-sm font-medium text-white shadow-goldbtn">
            <Plus className="h-4 w-4" strokeWidth={2} /> הוסף
          </button>
        </div>
      </Card>

      {/* families */}
      <Card>
        <SectionTitle icon={Users} aside={<span className="text-[11px] font-light text-gold-dark">{families.length}</span>}>
          המשפחות שלי
        </SectionTitle>
        <ul className="mb-3 space-y-1.5" data-testid="my-families">
          {families.map((f) => {
            const on = f.id === family.id;
            return (
              <li key={f.id}>
                <button
                  type="button"
                  className={cx(
                    'flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-right transition-colors',
                    on ? 'glass-navy text-white' : 'border border-white/80 bg-white/55 text-ink',
                  )}
                  onClick={() => {
                    if (!on) {
                      setCurrentFamily(user.uid, f.id);
                      toast(`עברת ל"${f.name}"`);
                    }
                  }}
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{f.name}</span>
                  <span className={cx('text-[11px] font-light', on ? 'text-white/60' : 'text-mute/50')}>{f.members.length} חברים</span>
                  {on ? <Check className="h-4 w-4 text-gold" strokeWidth={2} /> : <ChevronLeft className="h-4 w-4 text-mute/30" strokeWidth={1.75} />}
                </button>
              </li>
            );
          })}
        </ul>
        <FamilyActions user={user} families={families} compact />
      </Card>

      {/* account */}
      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.displayName} photo={user.photoURL} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{user.displayName}</p>
            <p className="truncate text-[11px] font-light text-mute/50" dir="ltr">{user.email}</p>
          </div>
          <button type="button" className="flex items-center gap-1.5 rounded-[10px] bg-danger/5 px-3 py-2 text-xs font-medium text-danger" onClick={() => signOut(auth)}>
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} /> התנתקות
          </button>
        </div>
      </Card>
      <p className="pb-2 text-center text-[10px] font-light tracking-widest text-mute/30">COUPONVAULT</p>
    </div>
  );
}
