import { useMemo, useState } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { Sheet } from '@/ui';
import { BRAND_LIST, searchBrands } from '@/domain/brands';
import { BrandMark } from '@/features/coupons';

/** Shown when a logo can't load (e.g. offline): the brand's first letter on the same white tile. */
function Initial({ name, size }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[11px] bg-white text-lg font-semibold text-navy/40 ring-1 ring-navy/[0.06]"
      style={{ width: size, height: size }}
    >
      {name[0]}
    </span>
  );
}

function BrandTile({ brand }) {
  return (
    <li className="flex flex-col items-center gap-1.5 rounded-[16px] border border-white/80 bg-white/50 px-1.5 pb-2 pt-2.5" data-testid="brand-tile">
      <BrandMark domain={brand.domain} size={46} testId="brand-mark" fallback={<Initial name={brand.name} size={46} />} />
      <span className="line-clamp-2 min-h-[2.4em] text-center text-[11.5px] leading-[1.2] text-ink">{brand.name}</span>
    </li>
  );
}

/** "Brands with a logo" board: every chain whose logo the app shows by itself, poster style with search. */
export function BrandsBoardSheet({ onClose }) {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => searchBrands(query), [query]);

  return (
    <Sheet title="רשתות עם לוגו" onClose={onClose} tall>
      <div className="relative -mx-5 -mt-4 mb-4 overflow-hidden px-5 pb-5 pt-6 text-center" data-testid="brands-board-header">
        <span className="pointer-events-none absolute -top-24 left-1/2 h-56 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,164,91,0.30),transparent_68%)]" />
        <p dir="ltr" className="relative flex items-center justify-center gap-1.5 text-[30px] font-semibold leading-none tracking-tight">
          <Sparkles className="h-5 w-5 text-gold" strokeWidth={1.75} />
          <span className="bg-gradient-to-l from-gold-deep via-gold to-gold-dark bg-clip-text text-transparent">CouponVault</span>
        </p>
        <p className="relative mt-2 text-[13px] font-light text-mute/70">
          <b className="font-semibold text-navy">{BRAND_LIST.length}</b> רשתות שהלוגו שלהן מופיע לבד
        </p>
        <p className="relative mx-auto mt-1 max-w-[300px] text-[11.5px] font-light leading-relaxed text-mute/50">
          כתבו את שם הרשת ב"איפה אפשר לממש" (או הדביקו קישור לאתר החנות) והלוגו יופיע על הקופון
        </p>
      </div>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute/40" strokeWidth={1.5} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש רשת"
          className="field pl-10 pr-10"
          aria-label="חיפוש רשת"
          enterKeyHint="search"
        />
        {query && (
          <button type="button" className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-mute/50" onClick={() => setQuery('')} aria-label="נקה חיפוש">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <ul className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-4" data-testid="brands-grid">
        {shown.map((b) => (
          <BrandTile key={b.domain} brand={b} />
        ))}
      </ul>
      {shown.length === 0 && (
        <p className="py-8 text-center text-sm font-light text-mute/50">
          הרשת לא ברשימה. אפשר להדביק קישור לאתר שלה ב"איפה אפשר לממש" והלוגו יופיע בכל זאת
        </p>
      )}
    </Sheet>
  );
}
