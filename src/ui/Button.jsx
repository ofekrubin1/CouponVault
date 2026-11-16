import { forwardRef } from 'react';
import { cx } from './cx';

const VARIANTS = {
  primary: 'glass-navy text-white',
  secondary: 'bg-white/75 text-navy border border-gold/40 shadow-btn2',
  gold: 'bg-gradient-to-b from-gold to-gold-dark text-white border border-gold/20 shadow-goldbtn',
  danger: 'bg-white/75 text-danger border border-danger/20 shadow-danger',
  soft: 'bg-white/50 text-mute border border-white/70',
};

const SIZES = { sm: 'px-3 py-2 text-xs', md: 'px-5 py-3 text-sm', lg: 'px-5 py-3.5 text-[15px]' };

export const Button = forwardRef(function Button({ children, variant = 'primary', className, size = 'md', icon: Icon, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cx(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[14px] font-medium transition-all duration-100 active:translate-y-[0.5px] active:opacity-90 disabled:opacity-50',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {variant === 'primary' && <span className="sheen" />}
      {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={size === 'sm' ? 2 : 1.75} />}
      {children}
    </button>
  );
});

/** Small round icon-only button (header actions, row actions). */
export function IconButton({ icon: Icon, label, tone = 'default', className, ...props }) {
  const tones = {
    default: 'glass-card text-navy/60',
    danger: 'border border-danger/15 bg-danger/[0.06] text-danger/80',
  };
  return (
    <button type="button" aria-label={label} className={cx('rounded-full p-2 transition-transform active:scale-95', tones[tone], className)} {...props}>
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
