import { Card, cx } from '@/ui';
import { money } from '@/domain/format';

function Stat({ value, label, highlight }) {
  return (
    <div className="rounded-[14px] border border-white/70 bg-white/45 px-3 py-2.5">
      <p className={cx('text-[19px] font-semibold', highlight ? 'text-gold-dark' : 'text-ink')}>{value}</p>
      <p className="text-[11px] font-light text-mute/55">{label}</p>
    </div>
  );
}

/** Hero card at the top of the home screen (TripFlow's trip summary card, liquid style). */
export function SummaryCard({ balance, activeCount, expiringCount, moneyCount }) {
  return (
    <Card className="overflow-hidden" data-testid="summary-card">
      {/* liquid glow inside the glass */}
      <span className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(201,164,91,0.32),transparent_68%)]" />
      <span className="pointer-events-none absolute -bottom-24 right-6 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(90,130,210,0.22),transparent_68%)]" />
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

      <div className="relative">
        <div>
          <p className="eyebrow">יתרה בשוברים</p>
          <p dir="ltr" className="mt-1 text-right text-[34px] font-semibold leading-none tracking-tight text-navy" data-testid="summary-balance">
            {money(balance)}
          </p>
          <p className="mt-1.5 text-[11px] font-light text-mute/55">{moneyCount ? `ב-${moneyCount} שוברים כספיים` : 'אין שוברים כספיים פעילים'}</p>
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-2 gap-2">
        <Stat value={activeCount} label="קופונים פעילים" />
        <Stat value={expiringCount} label="פגים בקרוב" highlight={expiringCount > 0} />
      </div>
    </Card>
  );
}
