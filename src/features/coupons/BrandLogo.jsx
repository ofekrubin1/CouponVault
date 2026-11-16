import { useState } from 'react';
import { brandDomain, logoUrl } from '@/domain/brands';
import { couponCategories } from '@/domain/coupon';
import { CategoryTile } from './CategoryTile';

/**
 * The brand's logo for a known chain (or the store's site), on a white rounded tile. Falls back to the
 * category tile when there's no known brand, offline, or the service only has a tiny generic icon.
 */
export function BrandLogo({ coupon, size = 38, className, solid = false }) {
  const domain = brandDomain(coupon);
  const [failed, setFailed] = useState(false);
  if (!domain || failed) return <CategoryTile category={couponCategories(coupon)[0]} size={size} className={className} solid={solid} />;
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-white shadow-[0_1px_3px_rgba(10,31,68,0.08)] ring-1 ring-navy/[0.06] ${className || ''}`}
      style={{ width: size, height: size }}
      data-testid="brand-logo"
      data-domain={domain}
    >
      <img
        src={logoUrl(domain)}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-[70%] w-[70%] object-contain"
        onError={() => setFailed(true)}
        // the service answers unknown sites with a 16px globe: treat that as "no logo"
        onLoad={(e) => e.currentTarget.naturalWidth < 24 && setFailed(true)}
      />
    </span>
  );
}
