import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cx } from './cx';

/**
 * Compact drop-down in the liquid-glass style: a field-like button showing the choice (its `short` label),
 * opening a floating glass menu of the options (their full `label`). Closes on pick, outside tap or Escape.
 */
export function LiquidSelect({ id, label, value, options, onChange, className }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const current = options.find((o) => o.key === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !root.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation(); // close the menu, not the sheet around it
      setOpen(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  return (
    <div ref={root} className={cx('relative', className)}>
      <button
        id={id}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cx('field flex items-center justify-between gap-1 !py-2 !pl-2.5 !pr-3 text-right text-base font-medium text-navy', open && 'border-gold/60 ring-2 ring-gold/20')}
      >
        <span className="truncate">{current.short ?? current.label}</span>
        <ChevronDown className={cx('h-4 w-4 shrink-0 text-mute/50 transition-transform duration-200', open && 'rotate-180')} strokeWidth={1.75} />
      </button>
      {open && (
        <ul role="listbox" aria-label={label} className="absolute left-0 top-full z-30 mt-1.5 w-max min-w-full animate-pop space-y-0.5 rounded-[16px] border border-white/80 bg-[#f8f9fc] p-1 shadow-[0_12px_32px_rgba(10,31,68,0.18),0_2px_6px_rgba(10,31,68,0.08)] backdrop-blur-xl">
          {options.map((o) => {
            const on = o.key === value;
            return (
              <li
                key={o.key}
                role="option"
                aria-selected={on}
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                className={cx(
                  'flex cursor-pointer items-center justify-between gap-3 whitespace-nowrap rounded-[12px] px-3 py-2.5 text-[14px] font-medium',
                  on ? 'liquid-pill text-navy' : 'text-mute active:bg-white/60',
                )}
              >
                {o.label}
                <Check className={cx('h-4 w-4 text-accent', !on && 'invisible')} strokeWidth={2.2} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
