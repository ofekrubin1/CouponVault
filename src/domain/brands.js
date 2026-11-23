// Known chains → web domain, so a coupon can show the brand's logo. Matched against the store, then the title.
// A store that is a link uses that site directly. Pure functions; the brand data is in brandCatalog.js.
import { isUrl, urlHost } from './links';
import { BRANDS, LABELS, OWN_LOGOS } from './brandCatalog';
import { LOCAL_ICONS } from './brandIcons';

const norm = (s) => (s || '').toLowerCase().replace(/[\s\-_'"׳״.:]/g, '');

const ALL = BRANDS.flatMap(([domain, ...names]) =>
  names.map((n) => (n.startsWith('=') ? { word: norm(n.slice(1)), domain } : { name: norm(n), domain })),
);
/** Loose names, longest first so "זארה הום" wins over "זארה". */
const LOOSE = ALL.filter((e) => e.name && e.name.length >= 3).sort((a, b) => b.name.length - a.name.length);
const WORDS = ALL.filter((e) => e.word);

export function brandDomainOf(text) {
  if (!text) return null;
  if (isUrl(text)) return urlHost(text);
  const t = norm(text);
  for (const { name, domain } of LOOSE) if (t.includes(name)) return domain;
  const words = text.split(/[\s,;/|()]+/).map(norm).filter(Boolean);
  for (const { word, domain } of WORDS) if (words.includes(word)) return domain;
  return null;
}

const HEBREW = /[֐-׿]/;
const clean = (n) => n.replace(/^=/, '');
const displayName = (domain, names) => LABELS[domain] || names.map(clean).find((n) => HEBREW.test(n)) || clean(names[0]);

/** Every supported brand once, for the "brands with a logo" board: [{ domain, name, aliases }], Hebrew names first, A→Z. */
export const BRAND_LIST = BRANDS.map(([domain, ...names]) => {
  const name = displayName(domain, names);
  return { domain, name, aliases: [name, ...names.map(clean)] };
}).sort((a, b) => HEBREW.test(b.name) - HEBREW.test(a.name) || a.name.localeCompare(b.name, 'he'));

/** Brands whose name / aliases / domain match a search. */
export function searchBrands(query, list = BRAND_LIST) {
  const q = norm(query);
  if (!q) return list;
  return list.filter((b) => b.aliases.some((n) => norm(n).includes(q)) || norm(b.domain).includes(q));
}

/** The brand's domain for a coupon (store first, then title), or null. */
export const brandDomain = (coupon) => brandDomainOf(coupon.store) || brandDomainOf(coupon.title);

const ownLogo = (domain) => {
  const o = OWN_LOGOS[domain];
  return typeof o === 'string' ? { src: o, wide: false } : o || null;
};

/** True for images stored with the app (always the real logo, any size). */
export const isOwnLogo = (src) => src.startsWith('/brands/');

/** Public logo image for a domain (Google's site-icon service; no key needed). */
export const logoUrl = (domain) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

/**
 * Images to try for a brand, best first: its logo stored with the app, else its site icon stored with the app
 * (scripts/fetch-brand-icons.mjs), then the site icon from Google. Images the app serves itself can also be
 * drawn into a shared coupon image; Google's can't (no CORS).
 */
export function logoSources(domain) {
  const own = ownLogo(domain);
  const icon = logoUrl(domain);
  if (own) return [own.src, icon];
  if (LOCAL_ICONS[domain]) return [`/brands/icons/${LOCAL_ICONS[domain]}`, icon];
  return [icon];
}

/** True when the brand's stored logo is a long wordmark, shown on a wider tile so it stays readable. */
export const isWideLogo = (domain) => !!ownLogo(domain)?.wide;
