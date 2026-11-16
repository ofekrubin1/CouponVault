import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Users } from 'lucide-react';
import { cx } from '@/ui';
import { setCurrentFamily } from '@/data';

/** Family name as the page title; with several families it opens a picker. */
export function FamilySwitcher({ user, family, families, onManage }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btn = useRef(null);

  // the menu is position:fixed, so close it once the page really scrolls
  useEffect(() => {
    if (!open) return undefined;
    const startY = window.scrollY;
    const onScroll = () => Math.abs(window.scrollY - startY) > 10 && setOpen(false);
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [open]);

  if (families.length < 2) return <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{family.name}</h1>;

  const toggle = () => {
    const r = btn.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, right: Math.max(12, window.innerWidth - r.right) });
    setOpen((o) => !o);
  };
  const pick = (f) => {
    setOpen(false);
    if (f.id !== family.id) setCurrentFamily(user.uid, f.id);
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
            <div role="menu" className="glass fixed z-[56] w-64 animate-pop overflow-hidden rounded-[18px] py-1.5" style={{ top: pos.top, right: pos.right }}>
              <p className="px-3.5 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-widest text-mute/50">המשפחות שלי</p>
              {families.map((f) => (
                <button key={f.id} type="button" role="menuitem" className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-right text-sm text-ink hover:bg-white/50" onClick={() => pick(f)}>
                  <Users className="h-3.5 w-3.5 shrink-0 text-mute/60" strokeWidth={1.5} />
                  <span className={cx('flex-1 truncate', f.id === family.id && 'font-semibold text-navy')}>{f.name}</span>
                  {f.id === family.id && <Check className="h-4 w-4 text-accent" strokeWidth={2} />}
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
