import { cx } from '@/ui';
import { TABS } from './tabs';

/** Floating glass capsule; the selected tab is a droplet that slides between items (RTL). */
export function BottomNav({ tab, onChange, badges = {} }) {
  const idx = Math.max(0, TABS.findIndex((t) => t.key === tab));
  return (
    <nav className="fixed inset-x-0 z-40 px-4" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 10px)' }} aria-label="ניווט">
      <div className="glass relative mx-auto flex max-w-md items-stretch rounded-[26px] p-1.5">
        <span
          aria-hidden
          className="liquid-pill absolute bottom-1.5 top-1.5 rounded-[20px]"
          style={{ right: 6, width: `calc((100% - 12px) / ${TABS.length})`, transform: `translateX(${-idx * 100}%)` }}
        />
        {TABS.map(({ key, icon: Icon, label }) => {
          const on = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-current={on ? 'page' : undefined}
              className="relative z-[1] flex flex-1 flex-col items-center gap-0.5 rounded-[20px] py-2"
            >
              <span className="relative">
                <Icon className={cx('h-5 w-5 transition-colors duration-200', on ? 'text-navy' : 'text-mute/60')} strokeWidth={on ? 2 : 1.5} />
                {badges[key] > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white" data-testid={`badge-${key}`}>
                    {badges[key]}
                  </span>
                )}
              </span>
              <span className={cx('text-[10px] tracking-wide transition-colors duration-200', on ? 'font-semibold text-navy' : 'font-light text-mute/60')}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
