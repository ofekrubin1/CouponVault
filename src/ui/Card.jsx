import { cx } from './cx';

/** Translucent "glass" card (TripFlow's PremiumCard, liquid style). `gold` adds the thin gold line at the bottom. */
export function Card({ children, className, gold = false, onClick, ...rest }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={cx('glass-card relative block w-full rounded-[18px] p-5 text-right transition-transform duration-150', onClick && 'active:scale-[0.99]', className)}
      {...rest}
    >
      {gold && <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />}
      {children}
    </Tag>
  );
}
