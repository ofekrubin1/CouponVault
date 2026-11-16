import { Plus } from 'lucide-react';

/** Floating liquid "+" pinned above the bottom bar (bottom-left, like TripFlow). */
export function Fab({ onClick, label = 'הוספת קופון' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-testid="fab-add"
      className="glass-navy fixed left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white transition-transform duration-150 active:scale-90"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 92px)' }}
    >
      <span className="sheen" />
      <Plus className="relative h-6 w-6" strokeWidth={2.2} />
    </button>
  );
}
