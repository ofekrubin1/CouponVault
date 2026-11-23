import { Search, X } from 'lucide-react';

/** Search across the coupons (name, store, code, category). */
export function SearchBar({ query, onQuery }) {
  return (
    <div className="relative">
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
  );
}
