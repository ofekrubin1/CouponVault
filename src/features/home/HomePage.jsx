import { useState } from 'react';
import { Ticket, Plus, Sparkles, AlarmClock, UserPlus } from 'lucide-react';
import { Button, EmptyState, cx } from '@/ui';
import { money } from '@/domain/format';
import { CouponRow, categoryLabel } from '@/features/coupons';
import { SearchBar } from './SearchBar';
import { CategoryFilter } from './CategoryFilter';
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

/** One line at the top: what's left in vouchers and how many coupons. */
function Summary({ balance, activeCount }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 px-1" data-testid="summary-card">
      <p dir="ltr" className="text-[28px] font-bold leading-none tracking-tight text-navy" data-testid="summary-balance">
        <span className="mr-0.5 text-[17px] font-semibold text-gold">₪</span>
        {money(balance).slice(1)}
      </p>
      <p className="text-[12.5px] text-mute/70">ב-{activeCount} קופונים</p>
    </div>
  );
}

/** On / off: only the coupons about to expire. Greyed when there are none. */
function ExpiringToggle({ count, on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!count}
      aria-pressed={on}
      data-testid="expiring-filter"
      className={cx(
        'flex h-[46px] shrink-0 items-center gap-1 rounded-[12px] border px-2 text-[12px] font-semibold transition-colors active:scale-[0.97]',
        on ? 'border-danger bg-danger text-white' : 'border-danger/30 bg-white text-danger',
        'disabled:border-navy/10 disabled:bg-white/60 disabled:text-mute/40',
      )}
    >
      <AlarmClock className="h-4 w-4" strokeWidth={2} />
      <span className="whitespace-nowrap">פגים בקרוב</span>
      <span className={cx('rounded-full px-1.5 text-[11px]', on ? 'bg-white/25' : count ? 'bg-danger/10' : 'bg-navy/5')} data-testid="summary-expiring">
        {count}
      </span>
    </button>
  );
}

/** Someone asked to join the family: a member has to let them in (in Settings). */
function JoinRequestsBanner({ requests, onOpen }) {
  if (!requests.length) return null;
  const who = requests.length === 1 ? `${requests[0].name || 'מישהו'} מבקש/ת להצטרף למשפחה` : `${requests.length} מבקשים להצטרף למשפחה`;
  return (
    <button type="button" onClick={onOpen} data-testid="join-requests-banner" className="flex w-full items-center gap-2.5 rounded-[14px] border border-gold/40 bg-gold/10 px-3 py-2.5 text-right">
      <UserPlus className="h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{who}</span>
      <span className="shrink-0 rounded-full bg-gold-dark px-2.5 py-0.5 text-[12px] font-semibold text-white">לאישור</span>
    </button>
  );
}

/** Home: a short summary, search, and every active coupon in two lines, grouped by category like a notepad. */
export function HomePage({ coupons, categories, alertDays, requests = [], onOpen, onAdd, onDelete, onRequests }) {
  const [query, setQuery] = useState('');
  const [soonOnly, setSoonOnly] = useState(false);
  const [cats, setCats] = useState(() => new Set());
  const [searching, setSearching] = useState(false); // the search field has focus (keyboard open)
  const [brands, setBrands] = useState(false);
  const view = useHomeView(coupons, alertDays, categories, query, soonOnly, cats);
  const board = brands && <BrandsBoardSheet onClose={() => setBrands(false)} />;

  if (view.active.length === 0) {
    return (
      <>
        <JoinRequestsBanner requests={requests} onOpen={onRequests} />
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
      <JoinRequestsBanner requests={requests} onOpen={onRequests} />
      <Summary {...view.summary} />
      {/* search · category filter · about to expire. While typing, the buttons step aside and the search takes the row */}
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <SearchBar
            query={query}
            onQuery={setQuery}
            // beside the toggle there's room for one word; the full hint once the search has the whole row
            placeholder={!searching ? 'חיפוש' : view.soon ? 'חיפוש בפגים בקרוב…' : 'חיפוש לפי שם, חנות או קוד'}
            onFocus={() => setSearching(true)}
            onBlur={() => setSearching(false)}
          />
        </div>
        {!searching && (
          <>
            <CategoryFilter counts={view.categoryCounts} chosen={view.cats} onChange={setCats} shownCount={view.shownCount} />
            <ExpiringToggle count={view.summary.expiringCount} on={view.soon} onToggle={() => setSoonOnly(!view.soon)} />
          </>
        )}
      </div>

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
