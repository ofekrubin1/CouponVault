import { brandDomain } from '@/domain/brands';
import { couponCategories } from '@/domain/coupon';
import { BrandMark } from './BrandMark';
import { CategoryTile } from './CategoryTile';

/** A coupon's brand logo (known chain or the store's site); the category tile when there's no logo. */
export function BrandLogo({ coupon, size = 38, className, solid = false }) {
  const domain = brandDomain(coupon);
  const tile = <CategoryTile category={couponCategories(coupon)[0]} size={size} className={className} solid={solid} />;
  return <BrandMark key={domain || '-'} domain={domain} size={size} className={className} fallback={tile} />;
}
