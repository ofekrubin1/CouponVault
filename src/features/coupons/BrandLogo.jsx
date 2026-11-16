import { useState } from 'react';
import { brandDomain, logoSources } from '@/domain/brands';
import { couponCategories } from '@/domain/coupon';
import { CategoryTile } from './CategoryTile';

/**
 * The brand's logo for a known chain (or the store's site), on a white rounded tile. Tries the brand's full
 * logo, then its site icon; falls back to the category tile when there's no known brand, offline, or only a
 * tiny generic icon exists.
 */
export function BrandLogo({ coupon, size = 38, className, solid = false }) {
  const domain = brandDomain(coupon);
  const sources = domain ? logoSources(domain) : [];
  const [attempt, setAttempt] = useState(0);
  const src = sources[attempt];
  if (!src) return <CategoryTile category={couponCategories(coupon)[0]} size={size} className={className} solid={solid} />;
  const next = () => setAttempt((a) => a + 1);
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-white shadow-[0_1px_3px_rgba(10,31,68,0.08)] ring-1 ring-navy/[0.06] ${className || ''}`}
      style={{ width: size, height: size }}
      data-testid="brand-logo"
      data-domain={domain}
    >
      <img
        key={src}
        src={src}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-[80%] w-[80%] object-contain"
        onError={next}
        // the icon service answers unknown sites with a 16px globe: treat that as "no logo"
        onLoad={(e) => e.currentTarget.naturalWidth < 24 && next()}
      />
    </span>
  );
}
