import { useState } from 'react';
import { Ticket, Plus, Sparkles } from 'lucide-react';
import { Button, EmptyState } from '@/ui';
import { EMPTY_FILTERS } from '@/domain/filters';
import { money } from '@/domain/format';
import { CouponTicket } from '@/features/coupons';
import { SummaryCard } from './SummaryCard';
import { ExpiringCard } from './ExpiringCard';
import { SearchBar } from './SearchBar';
import { FilterPanel } from './filters/FilterPanel';
import { ActiveFilters } from './filters/ActiveFilters';
import { useHomeView } from './useHomeView';
import { BrandsBoardSheet } from './brands/BrandsBoardSheet';
import { useBackClose } from '@/hooks/useBackClose';
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

export function HomePage({ coupons, alertDays, onOpen, onAdd, onDelete }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [panel, setPanel] = useState(false);
  const [brands, setBrands] = useState(false);
  useBackClose(brands, () => setBrands(false));
  const view = useHomeView(coupons, alertDays, query, filters);
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
    <div className="space-y-4">
      <SummaryCard {...view.summary} />
      {view.expiring.length > 0 && <ExpiringCard coupons={view.expiring} alertDays={alertDays} onOpen={onOpen} />}

      <div className="space-y-3 pt-1">
        <SearchBar query={query} onQuery={setQuery} filtersOn={view.filterCount > 0} panelOpen={panel} onTogglePanel={() => setPanel((p) => !p)} />
        {panel ? (
          <FilterPanel
            cats={view.cats}
            typeCounts={view.typeCounts}
            soonCount={view.expiring.length}
            filters={filters}
            onChange={setFilters}
            resultCount={view.shown.length}
            onClose={() => setPanel(false)}
          />
        ) : (
          <ActiveFilters filters={filters} onChange={setFilters} />
        )}
      </div>

      <div className="px-0.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="section-title">
            {view.filterCount ? 'תוצאות הסינון' : 'כל הקופונים'} <span className="text-gold-dark">· {view.shown.length}</span>
          </h2>
          <BrandsButton onClick={() => setBrands(true)} />
        </div>
        {view.filtering && view.shownBalance > 0 && (
          <p className="mt-1 text-[12px] font-light text-mute/60" data-testid="filtered-balance">
            יתרה: <b className="font-semibold text-navy">{money(view.shownBalance)}</b>
          </p>
        )}
      </div>

      <div className="space-y-3" data-testid="coupon-list">
        {view.shown.map((c) => (
          <CouponTicket key={c.id} coupon={c} alertDays={alertDays} onClick={() => onOpen(c)} onDelete={onDelete} />
        ))}
        {view.shown.length === 0 && <p className="py-10 text-center text-sm font-light text-mute/40">לא נמצאו קופונים</p>}
      </div>
      {board}
    </div>
  );
}
