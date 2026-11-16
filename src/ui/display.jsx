// Small presentational pieces: icon tile, avatar, spinner, empty state, page header, switch, chips.
import { Check } from 'lucide-react';
import { cx } from './cx';

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

export function Avatar({ name, photo, size = 36 }) {
  if (photo) {
    return <img src={photo} alt="" referrerPolicy="no-referrer" className="shrink-0 rounded-full object-cover shadow-btn2 ring-2 ring-white" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#9AAED6] to-accent-via text-sm font-semibold text-white ring-2 ring-white"
      style={{ width: size, height: size }}
    >
      {(name || '?').trim()[0]}
    </span>
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
      <span className="glass-card mb-5 flex h-16 w-16 items-center justify-center rounded-[20px]">
        <Icon className="h-7 w-7 text-navy/40" strokeWidth={1.5} />
      </span>
      <h2 className="mb-1 text-lg font-semibold text-ink">{title}</h2>
      {text && <p className="mb-6 text-sm font-light text-mute/60">{text}</p>}
      {action}
    </div>
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

/** iOS-style on/off switch. */
export function Switch({ checked, onChange, label }) {
  return (
    <span dir="ltr" className="shrink-0">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx('flex h-7 w-12 items-center rounded-full px-0.5 transition-colors duration-200', checked ? 'bg-gold' : 'bg-navy/15')}
      >
        <span className={cx('h-6 w-6 rounded-full bg-white shadow-btn2 transition-transform duration-300', checked ? 'translate-x-5' : 'translate-x-0')} />
      </button>
    </span>
  );
}

/** Toggleable chip; selected = light accent tint with a check mark. */
export function ToggleChip({ on, onClick, children, className, ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        'flex items-center gap-1.5 whitespace-nowrap rounded-[12px] border px-3 py-2 text-[13px] font-medium transition-colors',
        on ? 'chip-on' : 'border-white/80 bg-white/55 text-mute',
        className,
      )}
      {...rest}
    >
      {on && <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2.2} />}
      {children}
    </button>
  );
}
