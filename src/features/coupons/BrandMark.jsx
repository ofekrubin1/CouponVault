import { useState } from 'react';
import { isOwnLogo, logoSources } from '@/domain/brands';

/**
 * A brand's logo on a white rounded tile, by its web domain. Tries the logo stored with the app, then the site icon;
 * renders `fallback` when none loads (offline, or only the service's tiny generic globe exists).
 */
export function BrandMark({ domain, size = 38, className, fallback = null, testId = 'brand-logo' }) {
  const sources = domain ? logoSources(domain) : [];
  const [attempt, setAttempt] = useState(0);
  const src = sources[attempt];
  if (!src) return fallback;
  const next = () => setAttempt((a) => a + 1);
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-white shadow-[0_1px_3px_rgba(10,31,68,0.08)] ring-1 ring-navy/[0.06] ${className || ''}`}
      style={{ width: size, height: size }}
      data-testid={testId}
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
        onLoad={(e) => !isOwnLogo(src) && e.currentTarget.naturalWidth < 24 && next()}
      />
    </span>
  );
}
