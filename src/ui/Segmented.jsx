import { cx } from './cx';

/** iOS-like segmented control; the selected segment is a "droplet" that slides between options (RTL). */
export function Segmented({ value, onChange, options, className, name, size = 'md' }) {
  const idx = Math.max(0, options.findIndex((o) => o.key === value));
  return (
    <div role="radiogroup" aria-label={name} className={cx('relative flex rounded-[14px] border border-white/70 bg-white/40 p-1 shadow-inset', className)}>
      <span
        aria-hidden
        className="liquid-pill absolute bottom-1 top-1 rounded-[11px]"
        style={{ right: 4, width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${-idx * 100}%)` }}
      />
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.key)}
            className={cx('relative z-[1] min-w-0 flex-1 truncate rounded-[11px] font-medium transition-colors duration-200', size === 'sm' ? 'px-1 py-1.5 text-[12px]' : 'px-2 py-2 text-[13px]', on ? 'text-navy' : 'text-mute/60')}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
