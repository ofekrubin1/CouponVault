// Known chains → web domain, so a coupon can show the brand's logo. Matched against the store, then the title.
// A store that is a link uses that site directly. Pure functions.
import { isUrl, urlHost } from './links';

// [domain, ...names] — names are matched loosely (case / spaces / dashes ignored).
const BRANDS = [
  ['shufersal.co.il', 'שופרסל', 'shufersal'],
  ['rami-levy.co.il', 'רמי לוי', 'rami levy'],
  ['victoryonline.co.il', 'ויקטורי', 'victory'],
  ['yochananof.co.il', 'יוחננוף'],
  ['tivtaam.co.il', 'טיב טעם'],
  ['osherad.co.il', 'אושר עד'],
  ['carrefour.co.il', 'קרפור', 'carrefour'],
  ['super-pharm.co.il', 'סופר פארם', 'סופר-פארם', 'superpharm', 'super-pharm'],
  ['goodpharm.co.il', 'גוד פארם', 'good pharm'],
  ['zara.com', 'זארה', 'zara'],
  ['hm.com', 'h&m', 'אייץ אנד אם'],
  ['castro.com', 'קסטרו', 'castro'],
  ['fox.co.il', 'פוקס', 'fox'],
  ['golfco.co.il', 'גולף', 'golf&co', 'golf'],
  ['renuar.co.il', 'רנואר', 'renuar'],
  ['terminalx.com', 'טרמינל איקס', 'terminal x', 'terminalx'],
  ['nike.com', 'נייקי', 'nike'],
  ['adidas.co.il', 'אדידס', 'adidas'],
  ['ikea.co.il', 'איקאה', 'ikea'],
  ['homecenter.co.il', 'הום סנטר', 'home center'],
  ['ksp.co.il', 'ksp', 'קיי אס פי'],
  ['bug.co.il', 'באג'],
  ['ivory.co.il', 'אייבורי', 'ivory'],
  ['shekem-electric.co.il', 'שקם אלקטריק'],
  ['amazon.com', 'אמזון', 'amazon'],
  ['aliexpress.com', 'עלי אקספרס', 'aliexpress'],
  ['buyme.co.il', 'buyme', 'ביימי', 'בי מי'],
  ['htzone.co.il', 'htzone', 'hitech zone', 'הייטקזון', 'הייטק זון'],
  ['mcdonalds.co.il', 'מקדונלדס', 'mcdonalds', "mcdonald's"],
  ['aroma.co.il', 'ארומה', 'aroma'],
  ['cafegreg.co.il', 'קפה גרג', 'greg'],
  ['dominos.co.il', 'דומינוס', 'dominos'],
  ['pizzahut.co.il', 'פיצה האט', 'pizza hut'],
  ['burgerking.co.il', 'בורגר קינג', 'burger king'],
  ['yesplanet.co.il', 'יס פלאנט', 'yes planet'],
  ['cinema-city.co.il', 'סינמה סיטי', 'cinema city'],
  ['steimatzky.co.il', 'סטימצקי', 'steimatzky'],
  ['booknet.co.il', 'צומת ספרים'],
  ['wolt.com', 'וולט', 'wolt'],
  ['10bis.co.il', 'תן ביס', '10bis'],
];

const norm = (s) => (s || '').toLowerCase().replace(/[\s\-_'"׳״.]/g, '');

/** Index of [normalized name, domain], longest names first so "סופר פארם" wins over "פארם". */
const INDEX = BRANDS.flatMap(([domain, ...names]) => names.map((n) => [norm(n), domain]))
  .filter(([n]) => n.length >= 3)
  .sort((a, b) => b[0].length - a[0].length);

export function brandDomainOf(text) {
  if (!text) return null;
  if (isUrl(text)) return urlHost(text);
  const t = norm(text);
  for (const [name, domain] of INDEX) if (t.includes(name)) return domain;
  return null;
}

/** The brand's domain for a coupon (store first, then title), or null. */
export const brandDomain = (coupon) => brandDomainOf(coupon.store) || brandDomainOf(coupon.title);

/**
 * Full logos for brands whose site icon isn't their logo (e.g. Buyme's icon is just the gift, the logo is the
 * stork). Loaded from the brand's own site; if the file moves, the site icon is used instead.
 */
const FULL_LOGOS = {
  'buyme.co.il': 'https://buyme.co.il/assets/private-site/logo-with-slogan-CJUGl_X_.svg',
};

/** Public logo image for a domain (Google's site-icon service; no key needed). */
export const logoUrl = (domain) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

/** Images to try for a brand, best first. */
export const logoSources = (domain) => [FULL_LOGOS[domain], logoUrl(domain)].filter(Boolean);
