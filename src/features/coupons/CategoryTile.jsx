import { cx } from '@/ui';
import { categoryStyle } from './categoryStyle';

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

/** Inline category icon (chips). */
export function CategoryIcon({ category, className = 'h-3.5 w-3.5' }) {
  const { icon: Icon, color } = categoryStyle(category);
  return <Icon className={className} style={{ color }} strokeWidth={1.75} />;
}
