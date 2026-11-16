export function SectionTitle({ icon: Icon, children, aside }) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b border-navy/[0.06] pb-3">
      <Icon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
      <h3 className="flex-1 text-xs font-medium uppercase tracking-widest text-navy">{children}</h3>
      {aside}
    </div>
  );
}

export const Count = ({ n }) => <span className="text-[11px] font-light text-gold-dark">{n}</span>;

/** Small round glass icon button used across the settings cards. */
export const iconBtn = 'flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/70 text-navy/70 shadow-btn2 active:scale-95';
