import { cx } from '@/ui';
import { money } from '@/domain/format';

function Stat({ value, label, warn, testId }) {
  return (
    <div className="px-1 text-center" data-testid={testId}>
      <p className={cx('text-[19px] font-semibold leading-tight', warn ? 'text-[#F2C46B]' : 'text-white')}>{value}</p>
      <p className="mt-0.5 text-[11px] font-light text-white/55">{label}</p>
    </div>
  );
}

/** Hero card at the top of the home screen: a night-navy card with a gold glow, the balance in large white type. */
export function SummaryCard({ balance, activeCount, expiringCount, moneyCount, productCount }) {
  return (
    <section
      className="relative overflow-hidden rounded-[24px] p-5 text-white shadow-[0_14px_30px_rgba(10,31,68,0.28)]"
      style={{ background: 'radial-gradient(120% 90% at 0% 0%, #1d3a73 0%, #0A1F44 55%, #081733 100%)' }}
      data-testid="summary-card"
    >
      {/* gold glow in the top-left corner and a thin highlight on the top edge */}
      <span className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(201,164,91,0.35),transparent_68%)]" />
      <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="relative">
        <p className="text-[11px] font-medium tracking-[0.08em] text-[#E6CF9A]">יתרה בשוברים</p>
        <p dir="ltr" className="mt-1.5 text-right text-[40px] font-bold leading-none tracking-tight" data-testid="summary-balance">
          <span className="mr-1 align-baseline text-[22px] font-semibold text-[#E6CF9A]">₪</span>
          {money(balance).slice(1)}
        </p>
        <p className="mt-1.5 text-[12px] font-light text-white/60">{moneyCount ? `ב-${moneyCount} שוברים כספיים` : 'אין שוברים כספיים פעילים'}</p>

        <div className="mt-4 grid grid-cols-3 divide-x divide-x-reverse divide-white/10 border-t border-white/10 pt-3.5">
          <Stat value={activeCount} label="קופונים פעילים" />
          <Stat value={expiringCount} label="פגים בקרוב" warn={expiringCount > 0} />
          <Stat value={productCount ?? 0} label="שוברי מוצר" />
        </div>
      </div>
    </section>
  );
}
