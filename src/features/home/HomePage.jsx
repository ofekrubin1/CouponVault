import { useState } from 'react';
import { Ticket, Plus, Sparkles, X, AlarmClock } from 'lucide-react';
import { Button, EmptyState, cx } from '@/ui';
import { money } from '@/domain/format';
import { CouponRow, categoryLabel } from '@/features/coupons';
import { SearchBar } from './SearchBar';
import { useHomeView } from './useHomeView';
import { BrandsBoardSheet } from './brands/BrandsBoardSheet';
import { BRAND_LIST } from '@/domain/brands';

/** Opens the board of chains whose logo the app shows by itself. */
function BrandsButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="brands-button"
      className="flex shrink-0 items-center gap-1 rounded-full border border-gold/30 bg-gold/[0.10] px-2.5 py-1 text-[11.5px] font-medium text-gold-deep active:scale-[0.97]"
    >
      <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
      {BRAND_LIST.length} רשתות עם לוגו
    </button>
  );
}

/** One line at the top: what's left in vouchers, how many coupons, and a tap-to-filter "about to expire". */
function Summary({ balance, activeCount, expiringCount, soon, onToggleSoon }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 px-1" data-testid="summary-card">
      <p dir="ltr" className="text-[28px] font-bold leading-none tracking-tight text-navy" data-testid="summary-balance">
        <span className="mr-0.5 text-[17px] font-semibold text-gold">₪</span>
        {money(balance).slice(1)}
      </p>
      <p className="text-[12.5px] text-mute/70">ב-{activeCount} קופונים</p>
      {expiringCount > 0 && (
        <button
          type="button"
          onClick={onToggleSoon}
          aria-pressed={soon}
          data-testid="expiring-filter"
          className={cx(
            'flex items-center gap-1 self-center rounded-full border px-2.5 py-0.5 text-[12px] font-semibold transition-colors active:scale-[0.97]',
            soon ? 'border-danger bg-danger text-white' : 'border-danger/30 bg-danger/[0.06] text-danger',
          )}
        >
          <AlarmClock className="h-3.5 w-3.5" strokeWidth={2} />
          <span data-testid="summary-expiring">{expiringCount} פגים בקרוב</span>
          {soon && <X className="h-3.5 w-3.5" strokeWidth={2.4} aria-label="הצג הכול" />}
        </button>
      )}
    </div>
  );
}

/** Home: a short summary, search, and every active coupon in two lines, grouped by category like a notepad. */
export function HomePage({ coupons, categories, alertDays, onOpen, onAdd, onDelete }) {
  const [query, setQuery] = useState('');
  const [soonOnly, setSoonOnly] = useState(false);
  const [brands, setBrands] = useState(false);
  const view = useHomeView(coupons, alertDays, categories, query, soonOnly);
  const board = brands && <BrandsBoardSheet onClose={() => setBrands(false)} />;

  if (view.active.length === 0) {
    return (
      <>
        <EmptyState
          icon={Ticket}
          title="אין קופונים פעילים"
          text="הוסיפו את הקופון הראשון של המשפחה"
          action={
            <div className="flex flex-col items-center gap-3">
              <Button variant="primary" icon={Plus} onClick={onAdd}>
                הוספת קופון
              </Button>
              <BrandsButton onClick={() => setBrands(true)} />
            </div>
          }
        />
        {board}
      </>
    );
  }

  return (
    <div className="space-y-3">
      <Summary {...view.summary} soon={view.soon} onToggleSoon={() => setSoonOnly(!view.soon)} />
      <SearchBar query={query} onQuery={setQuery} />

      <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_2px_10px_rgba(10,31,68,0.06)]" data-testid="coupon-list">
        {view.groups.map(({ category, items }) => (
          <section key={category} data-testid="coupon-group" data-category={category}>
            <h2 className="flex items-center justify-between border-t border-navy/[0.05] bg-[#F7F8FB] px-3 pb-1.5 pt-2 text-[11.5px] font-semibold text-navy [section:first-child>&]:border-t-0">
              {categoryLabel(category)}
              <span className="font-normal text-mute/50">{items.length}</span>
            </h2>
            <div className="divide-y divide-navy/[0.05]">
              {items.map((c) => (
                <CouponRow key={c.id} coupon={c} alertDays={alertDays} onClick={() => onOpen(c)} onDelete={onDelete} />
              ))}
            </div>
          </section>
        ))}
        {view.shownCount === 0 && <p className="py-10 text-center text-sm font-light text-mute/40">לא נמצאו קופונים</p>}
      </div>

      <div className="flex justify-center pt-1">
        <BrandsButton onClick={() => setBrands(true)} />
      </div>
      {board}
    </div>
  );
}
