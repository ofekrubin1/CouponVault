import { useState } from 'react';
import { isOwnLogo, isWideLogo, logoSources } from '@/domain/brands';

/**
 * A brand's logo on a white rounded tile, by its web domain: square, twice as wide for a long wordmark, or the
 * full width (`shape="wide"`, the brands board). Tries the logo stored with the app, then the site icon;
 * renders `fallback` when none loads (offline, or only the service's tiny generic globe exists).
 */
export function BrandMark({ domain, size = 38, shape = 'square', className, fallback = null, testId = 'brand-logo' }) {
  const sources = domain ? logoSources(domain) : [];
  const wide = shape === 'wide';
  const [attempt, setAttempt] = useState(0);
  const src = sources[attempt];
  if (!src) return fallback;
  const wordmark = !wide && isOwnLogo(src) && isWideLogo(domain);
  const next = () => setAttempt((a) => a + 1);
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-white shadow-[0_1px_3px_rgba(10,31,68,0.08)] ring-1 ring-navy/[0.06] ${className || ''}`}
      style={{ width: wide ? '100%' : wordmark ? size * 2 : size, height: size }}
      data-testid={testId}
      data-domain={domain}
    >
      <img
        key={src}
        src={src}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className={wide ? 'h-[62%] w-[84%] object-contain' : wordmark ? 'h-[72%] w-[88%] object-contain' : 'h-[80%] w-[80%] object-contain'}
        onError={next}
        // the icon service answers unknown sites with a 16px globe: treat that as "no logo"
        onLoad={(e) => !isOwnLogo(src) && e.currentTarget.naturalWidth < 24 && next()}
      />
    </span>
  );
}
