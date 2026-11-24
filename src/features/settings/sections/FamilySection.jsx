import { useState } from 'react';
import { Copy, Share2, RefreshCw, Check, Pencil, X, Home as HomeIcon, KeyRound } from 'lucide-react';
import { Card, Input, useConfirm, useToast } from '@/ui';
import { regenerateInvite, renameFamily } from '@/data';
import { inviteExpiry, inviteMessage, isInviteExpired } from '@/domain/family';
import { SectionTitle, iconBtn } from '../SectionTitle';

/** Current family: name (editable) and the invite code with copy / share / regenerate. */
export function FamilySection({ family }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(family.name);
  const expired = isInviteExpired(family);
  const until = inviteExpiry(family);

  const save = () => {
    if (!name.trim()) return;
    renameFamily(family.id, name);
    setEditing(false);
    toast('השם עודכן');
  };
  const copy = (text, msg) => navigator.clipboard?.writeText(text).then(() => toast(msg), () => toast('ההעתקה נכשלה', 'error'));
  const share = async () => {
    const text = inviteMessage(family, window.location.origin);
    if (!navigator.share) return copy(text, 'ההזמנה הועתקה');
    try {
      await navigator.share({ title: 'CouponVault', text });
    } catch {
      /* cancelled */
    }
  };
  const regenerate = async () => {
    const ok = await confirm({ title: 'ליצור קוד חדש?', message: 'הקוד הנוכחי יפסיק לעבוד. מי שכבר במשפחה לא יושפע.', confirmText: 'צור קוד חדש' });
    if (!ok) return;
    regenerateInvite(family);
    toast('נוצר קוד הזמנה חדש');
  };

  return (
    <Card gold>
      <SectionTitle icon={HomeIcon}>המשפחה הנוכחית</SectionTitle>
      {editing ? (
        <div className="flex gap-2">
          <div className="flex-1">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && save()} aria-label="שם המשפחה" />
          </div>
          <button type="button" className="glass-navy rounded-[12px] px-3 text-white" onClick={save} aria-label="שמור">
            <Check className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="rounded-[12px] border border-white/70 bg-white/55 px-3 text-mute"
            onClick={() => {
              setEditing(false);
              setName(family.name);
            }}
            aria-label="ביטול"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-ink" data-testid="family-name">
              {family.name}
            </p>
            <p className="text-[11px] font-light text-mute/50">{family.members.length} חברים</p>
          </div>
          <button type="button" className={iconBtn} onClick={() => {
              setName(family.name); // someone else may have renamed it meanwhile
              setEditing(true);
            }}
            aria-label="שינוי שם המשפחה">
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      )}

      <div className="mt-4 rounded-[16px] border border-white/80 bg-white/45 p-4 shadow-inset">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-mute/70">
          <KeyRound className="h-3.5 w-3.5 text-gold-dark" strokeWidth={1.75} /> קוד הזמנה להצטרפות
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span dir="ltr" className={`font-mono text-[22px] font-semibold tracking-[0.18em] ${expired ? 'text-mute/40 line-through' : 'text-navy'}`} data-testid="invite-code">
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
        <p className={`mt-2 text-[11px] ${expired ? 'font-semibold text-danger' : 'font-light text-mute/55'}`} data-testid="invite-expiry">
          {expired ? 'הקוד פג תוקף. צרו קוד חדש (🔄) כדי להזמין' : until ? `בתוקף עד ${until.toLocaleDateString('he-IL')} · מי שמצטרף צריך אישור של חבר במשפחה` : 'בתוקף ל-7 ימים · מי שמצטרף צריך אישור של חבר במשפחה'}
        </p>
      </div>
    </Card>
  );
}
