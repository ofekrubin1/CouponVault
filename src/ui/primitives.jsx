import { forwardRef } from 'react';
import { categoryStyle } from '../constants';

export const cx = (...a) => a.filter(Boolean).join(' ');

/** White elevated card (TripFlow "PremiumCard"). `gold` adds the thin gold line at the bottom. */
export function Card({ children, className, gold = false, onClick, ...rest }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={cx(
        'relative block w-full rounded-[14px] bg-white p-5 text-right shadow-card transition-transform duration-150',
        onClick && 'active:scale-[0.99]',
        className,
      )}
      {...rest}
    >
      {gold && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      )}
      {children}
    </Tag>
  );
}

const BTN = {
  primary: 'bg-navy text-white border border-gold/30 shadow-btn',
  secondary: 'bg-white text-navy border border-gold/40 shadow-btn2',
  gold: 'bg-gradient-to-b from-gold to-gold-dark text-white border border-gold/20 shadow-goldbtn',
  danger: 'bg-white text-danger border border-danger/20 shadow-danger',
  soft: 'bg-canvas text-mute border border-transparent',
};

export const Button = forwardRef(function Button(
  { children, variant = 'primary', className, size = 'md', icon: Icon, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-[12px] font-medium transition-all duration-100 active:translate-y-[0.5px] active:opacity-90 disabled:opacity-50',
        size === 'sm' ? 'px-3 py-2 text-xs' : size === 'lg' ? 'px-5 py-3.5 text-[15px]' : 'px-5 py-3 text-sm',
        BTN[variant],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={size === 'sm' ? 2 : 1.75} />}
      {children}
    </button>
  );
});

/** Small square icon on a tinted background, coloured by category. */
export function CategoryTile({ category, size = 36, className }) {
  const { icon: Icon, color } = categoryStyle(category);
  return (
    <span
      className={cx('flex shrink-0 items-center justify-center rounded-[10px]', className)}
      style={{ width: size, height: size, backgroundColor: `${color}12`, boxShadow: `inset 0 1px 2px ${color}10` }}
    >
      <Icon style={{ color, width: size * 0.45, height: size * 0.45 }} strokeWidth={1.6} />
    </span>
  );
}

export function IconTile({ icon: Icon, tone = 'navy', size = 40, className }) {
  const tones = {
    navy: 'bg-navy/5 text-navy/60',
    gold: 'bg-gold/[0.12] text-gold-dark',
    red: 'bg-danger/10 text-danger',
    white: 'bg-white/10 text-white',
  };
  return (
    <span className={cx('flex shrink-0 items-center justify-center rounded-[12px]', tones[tone], className)} style={{ width: size, height: size }}>
      <Icon style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={1.5} />
    </span>
  );
}

export function PageHeader({ eyebrow, title, children, side }) {
  return (
    <header className="mb-1 flex items-end justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="eyebrow">{eyebrow}</p>
        {title && <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{title}</h1>}
        {children}
      </div>
      {side}
    </header>
  );
}

export function Spinner({ full = false, className }) {
  const ring = <span className="block h-6 w-6 animate-spin rounded-full border-2 border-gold/30 border-t-navy" />;
  if (!full) return <span className={className}>{ring}</span>;
  return <div className="flex min-h-[100dvh] items-center justify-center">{ring}</div>;
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy/5 shadow-card">
        <Icon className="h-7 w-7 text-navy/40" strokeWidth={1.5} />
      </span>
      <h2 className="mb-1 text-lg font-semibold text-ink">{title}</h2>
      {text && <p className="mb-6 text-sm font-light text-mute/60">{text}</p>}
      {action}
    </div>
  );
}

export function Avatar({ name, photo, size = 36 }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full object-cover ring-2 ring-white shadow-btn2"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white ring-2 ring-white"
      style={{ width: size, height: size }}
    >
      {(name || '?').trim()[0]}
    </span>
  );
}

/** iOS-like segmented control. */
export function Segmented({ value, onChange, options, className, name }) {
  return (
    <div role="radiogroup" aria-label={name} className={cx('flex rounded-[12px] bg-navy/[0.05] p-1', className)}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.key)}
            className={cx(
              'flex-1 rounded-[9px] px-2 py-2 text-[13px] font-medium transition-all duration-150',
              on ? 'bg-white text-navy shadow-btn2' : 'text-mute/60',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
