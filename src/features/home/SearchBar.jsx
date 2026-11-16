import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cx } from '@/ui';

/** Search field + filter toggle (tinted while filters are on or the panel is open). */
export function SearchBar({ query, onQuery, filtersOn, panelOpen, onTogglePanel }) {
  return (
    <div className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute/40" strokeWidth={1.5} />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="חיפוש לפי שם, חנות או קוד"
          className="field pl-10 pr-10"
          aria-label="חיפוש"
          enterKeyHint="search"
        />
        {query && (
          <button type="button" className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-mute/50" onClick={() => onQuery('')} aria-label="נקה חיפוש">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onTogglePanel}
        aria-label="סינון"
        aria-expanded={panelOpen}
        data-testid="filter-button"
        data-active={filtersOn ? 'true' : undefined}
        className={cx(
          'relative flex w-[50px] shrink-0 items-center justify-center rounded-[12px] border transition-colors duration-200',
          filtersOn || panelOpen ? 'border-gold/40 bg-gold/[0.14] text-gold-deep' : 'glass-card text-navy/55',
        )}
      >
        <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>
    </div>
  );
}
