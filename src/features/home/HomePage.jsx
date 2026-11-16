import { useState } from 'react';
import { Ticket, Plus } from 'lucide-react';
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

export function HomePage({ coupons, alertDays, onOpen, onAdd, onDelete }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [panel, setPanel] = useState(false);
  const view = useHomeView(coupons, alertDays, query, filters);

  if (view.active.length === 0) {
    return (
      <EmptyState
        icon={Ticket}
        title="אין קופונים פעילים"
        text="הוסיפו את הקופון הראשון של המשפחה"
        action={
          <Button variant="primary" icon={Plus} onClick={onAdd}>
            הוספת קופון
          </Button>
        }
      />
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

      <div className="flex items-baseline justify-between px-0.5">
        <h2 className="section-title">
          {view.filterCount ? 'תוצאות הסינון' : 'כל הקופונים'} <span className="text-gold-dark">· {view.shown.length}</span>
        </h2>
        {view.filtering && view.shownBalance > 0 && (
          <span className="text-[12px] font-light text-mute/60" data-testid="filtered-balance">
            יתרה: <b className="font-semibold text-navy">{money(view.shownBalance)}</b>
          </span>
        )}
      </div>

      <div className="space-y-3" data-testid="coupon-list">
        {view.shown.map((c) => (
          <CouponTicket key={c.id} coupon={c} alertDays={alertDays} onClick={() => onOpen(c)} onDelete={onDelete} />
        ))}
        {view.shown.length === 0 && <p className="py-10 text-center text-sm font-light text-mute/40">לא נמצאו קופונים</p>}
      </div>
    </div>
  );
}
