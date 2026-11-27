import { useEffect, useRef, useState } from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';
import { cx } from '@/ui';
import { couponTypeLabel } from '@/domain/constants';

/**
 * Filter button beside the search: a small menu of the coupon types (only those that are there, with counts),
 * any number can be chosen. Highlighted with the number chosen while a filter is on.
 */
export function TypeFilter({ counts, chosen, onChange }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !root.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      setOpen(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const toggle = (key) => {
    const next = new Set(chosen);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };
  const on = chosen.size > 0;

  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="סינון לפי סוג"
        aria-haspopup="true"
        aria-expanded={open}
        data-testid="type-filter"
        data-active={on || undefined}
        className={cx(
          'relative flex h-[46px] w-[46px] items-center justify-center rounded-[12px] border transition-colors active:scale-[0.97]',
          on ? 'border-accent bg-accent text-white' : 'border-white/80 bg-white/70 text-navy/55 shadow-btn2',
        )}
      >
        <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {on && (
          <span className="absolute -left-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-navy px-1 text-[10px] font-bold text-white">
            {chosen.size}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-56 animate-pop rounded-[16px] border border-white/80 bg-[#f8f9fc] p-1 shadow-[0_12px_32px_rgba(10,31,68,0.18),0_2px_6px_rgba(10,31,68,0.08)]" data-testid="type-menu">
          <p className="px-3 pb-1 pt-2 text-[11px] font-medium text-mute/55">סינון לפי סוג</p>
          <ul role="listbox" aria-multiselectable="true" aria-label="סוגי קופונים" className="space-y-0.5">
            {counts.map(([key, n]) => {
              const sel = chosen.has(key);
              return (
                <li
                  key={key}
                  role="option"
                  aria-selected={sel}
                  onClick={() => toggle(key)}
                  className={cx('flex cursor-pointer items-center gap-2 rounded-[12px] px-3 py-2.5 text-[14px] font-medium', sel ? 'liquid-pill text-navy' : 'text-mute active:bg-white/60')}
                >
                  <Check className={cx('h-4 w-4 text-accent', !sel && 'invisible')} strokeWidth={2.2} />
                  <span className="flex-1">{couponTypeLabel(key)}</span>
                  <span className="text-[12px] font-normal text-mute/45">{n}</span>
                </li>
              );
            })}
          </ul>
          {on && (
            <button type="button" onClick={() => onChange(new Set())} className="mt-0.5 w-full rounded-[12px] px-3 py-2 text-right text-[13px] font-medium text-gold-dark">
              ניקוי הסינון
            </button>
          )}
        </div>
      )}
    </div>
  );
}
