import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ticket, FolderArchive, Settings, Plus, ChevronDown, Check, Users } from 'lucide-react';
import { cx } from '../ui/primitives';
import { setCurrentFamily } from '../data';

const NAV = [
  { key: 'home', icon: Ticket, label: 'קופונים' },
  { key: 'archive', icon: FolderArchive, label: 'ארכיון' },
  { key: 'settings', icon: Settings, label: 'הגדרות' },
];

/** Floating glass capsule; the selected tab is a droplet that slides between items. */
export function BottomNav({ tab, onChange }) {
  const idx = Math.max(0, NAV.findIndex((n) => n.key === tab));
  return (
    <nav
      className="fixed inset-x-0 z-40 px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}
      aria-label="ניווט"
    >
      <div className="glass relative mx-auto flex max-w-md items-stretch rounded-[26px] p-1.5">
        <span
          aria-hidden
          className="liquid-pill absolute bottom-1.5 top-1.5 rounded-[20px]"
          style={{ right: 6, width: `calc((100% - 12px) / ${NAV.length})`, transform: `translateX(${-idx * 100}%)` }}
        />
        {NAV.map(({ key, icon: Icon, label }) => {
          const on = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-current={on ? 'page' : undefined}
              className="relative z-[1] flex flex-1 flex-col items-center gap-0.5 rounded-[20px] py-2"
            >
              <Icon className={cx('h-5 w-5 transition-colors duration-200', on ? 'text-navy' : 'text-mute/60')} strokeWidth={on ? 2 : 1.5} />
              <span className={cx('text-[10px] tracking-wide transition-colors duration-200', on ? 'font-semibold text-navy' : 'font-light text-mute/60')}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Floating liquid "+" pinned above the bottom bar (bottom-left, like TripFlow). */
export function Fab({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="הוספת קופון"
      data-testid="fab-add"
      className="glass-navy fixed left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white transition-transform duration-150 active:scale-90"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 92px)' }}
    >
      <span className="sheen" />
      <Plus className="relative h-6 w-6" strokeWidth={2.2} />
    </button>
  );
}

/** Family name as the page title; with several families it opens a picker. */
export function FamilySwitcher({ user, family, families, onManage }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btn = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const startY = window.scrollY;
    const onScroll = () => Math.abs(window.scrollY - startY) > 10 && setOpen(false);
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [open]);

  if (families.length < 2) {
    return <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{family.name}</h1>;
  }

  const toggle = () => {
    const r = btn.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, right: Math.max(12, window.innerWidth - r.right) });
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        className="flex max-w-full items-center gap-1.5 text-xl font-semibold tracking-tight text-ink"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="family-switcher"
      >
        <span className="truncate">{family.name}</span>
        <span className="glass-card flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          <ChevronDown className={cx('h-4 w-4 text-navy/60 transition-transform', open && 'rotate-180')} strokeWidth={2} />
        </span>
      </button>
      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
            <div
              role="menu"
              className="glass fixed z-[56] w-64 animate-pop overflow-hidden rounded-[18px] py-1.5"
              style={{ top: pos.top, right: pos.right }}
            >
              <p className="px-3.5 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-widest text-mute/50">המשפחות שלי</p>
              {families.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-right text-sm text-ink hover:bg-white/50"
                  onClick={() => {
                    setOpen(false);
                    if (f.id !== family.id) setCurrentFamily(user.uid, f.id);
                  }}
                >
                  <Users className="h-3.5 w-3.5 shrink-0 text-mute/60" strokeWidth={1.5} />
                  <span className={cx('flex-1 truncate', f.id === family.id && 'font-semibold text-navy')}>{f.name}</span>
                  {f.id === family.id && <Check className="h-4 w-4 text-gold" strokeWidth={2} />}
                </button>
              ))}
              <div className="mx-2 my-1 h-px bg-navy/[0.06]" />
              <button
                type="button"
                role="menuitem"
                className="w-full px-3.5 py-2.5 text-right text-sm font-medium text-gold-dark hover:bg-white/50"
                onClick={() => {
                  setOpen(false);
                  onManage();
                }}
              >
                ניהול משפחות…
              </button>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
