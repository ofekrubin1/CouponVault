// Known chains → web domain, so a coupon can show the brand's logo. Matched against the store, then the title.
// A store that is a link uses that site directly. Pure functions.
import { isUrl, urlHost } from './links';

// [domain, ...names] — names are matched loosely (case / spaces / dashes ignored) anywhere in the text.
// A name starting with "=" must be a whole word (short names like "פז" would otherwise match inside other words).
// Every domain here was checked to be the brand's real site (its icon is the brand's).
const BRANDS = [
  ['shufersal.co.il', 'שופרסל', 'shufersal', 'תו הזהב', 'tav hazahav'],
  ['rami-levy.co.il', 'רמי לוי', 'rami levy'],
  ['victoryonline.co.il', 'ויקטורי', 'victory'],
  ['yochananof.co.il', 'יוחננוף'],
  ['tivtaam.co.il', 'טיב טעם'],
  ['osherad.co.il', 'אושר עד'],
  ['carrefour.co.il', 'קרפור', 'carrefour', 'יינות ביתן', 'ybitan'], // Yeinot Bitan became Carrefour
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
  ['aliexpress.com', 'עלי אקספרס', 'aliexpress'],
  ['buyme.co.il', 'buyme', 'ביימי', 'בי מי'],
  ['htzone.co.il', 'htzone', 'hitech zone', 'הייטקזון', 'הייטק זון'],
  ['mcdonalds.co.il', 'מקדונלדס', 'mcdonalds', "mcdonald's"],
  ['aroma.co.il', 'ארומה', 'aroma'],
  ['cafegreg.co.il', 'קפה גרג', 'greg'], // no site any more: logo stored with the app
  ['dominos.co.il', 'דומינוס', 'dominos'],
  ['pizzahut.co.il', 'פיצה האט', 'pizza hut'],
  ['burgerking.co.il', 'בורגר קינג', 'burger king'],
  ['yesplanet.co.il', 'יס פלאנט', 'yes planet'],
  ['cinema-city.co.il', 'סינמה סיטי', 'cinema city'],
  ['steimatzky.co.il', 'סטימצקי', 'steimatzky'],
  ['booknet.co.il', 'צומת ספרים'],
  ['wolt.com', 'וולט', 'wolt'],
  ['10bis.co.il', 'תן ביס', '10bis'],
  // gift cards & clubs
  ['dreamcard.co.il', 'דרים קארד', 'דרים כארד', 'dreamcard', 'dream card'],
  ['hvr.co.il', 'כרטיס חבר', 'מועדון חבר', 'hever', '=חבר'],
  // delivery & meal cards
  ['mishloha.co.il', 'משלוחה', 'mishloha'],
  // restaurants, cafés, sweets
  ['kfc.co.il', 'kfc', 'קיי אף סי'],
  ['papajohns.co.il', 'פאפא גונס', 'papa johns'],
  ['burgersbar.co.il', 'בורגרס בר', 'burgers bar', 'burgersbar'],
  ['agadir.co.il', 'אגאדיר', 'agadir'],
  ['japanika.net', 'גפניקה', 'japanika'],
  ['arcaffe.co.il', 'ארקפה', 'arcaffe'],
  ['cafecafe.co.il', 'קפה קפה', 'cafe cafe'],
  ['landwer.co.il', 'לנדוור', 'landwer'],
  ['benedict.co.il', 'בנדיקט', 'benedict'],
  ['goldaglida.co.il', 'גולדה', 'golda'],
  // fashion & shoes
  ['mango.com', 'מנגו', 'mango'],
  ['pullandbear.com', 'פול אנד בר', 'pull&bear', 'pull and bear'],
  ['bershka.com', 'ברשקה', 'bershka'],
  ['stradivarius.com', 'סטרדיווריוס', 'stradivarius'],
  ['zarahome.com', 'זארה הום', 'zara home'],
  ['twentyfourseven.co.il', 'טוונטי פור סבן', 'twentyfourseven', 'twenty four seven'],
  ['h-o.co.il', 'h&o', 'אייץ אנד או'],
  ['delta.co.il', 'דלתא', 'delta'],
  ['factory54.co.il', 'פקטורי 54', 'factory 54', 'factory54'],
  ['lastprice.co.il', 'לאסט פרייס', 'last price', 'lastprice'],
  ['skechers.co.il', 'סקצרס', 'skechers'],
  ['crocs.co.il', 'קרוקס', 'crocs'],
  ['stevemadden.co.il', 'סטיב מאדן', 'steve madden'],
  // beauty & pharma
  ['bestore.co.il', 'be פארם', 'בי פארם', 'be pharm', 'bepharm', '=be', 'ניו פארם', 'new pharm', 'newpharm'], // New Pharm became Be (Shufersal)
  ['laline.co.il', 'לאליין', 'laline'],
  ['sabon.co.il', 'sabon'],
  ['kikocosmetics.com', 'קיקו', 'kiko'],
  ['maccosmetics.co.il', 'mac cosmetics', '=מאק', '=mac'],
  // home, kids, office
  ['foxhome.co.il', 'פוקס הום', 'fox home'],
  ['vardinon.co.il', 'ורדינון', 'vardinon'],
  ['maxstock.co.il', 'מקס סטוק', 'max stock', 'maxstock'],
  ['ace.co.il', 'ace hardware', '=אייס', '=ace'],
  ['toysrus.co.il', 'טויס אר אס', 'toys r us', 'toysrus'],
  ['shilav.co.il', 'שילב', 'shilav'],
  ['officedepot.co.il', 'אופיס דיפו', 'office depot'],
  ['kravitz.co.il', 'קרביץ', 'kravitz'],
  ['decathlon.co.il', 'דקטלון', 'decathlon'],
  ['idigital.co.il', 'איידיגיטל', 'idigital'],
  // supermarkets & convenience
  ['hazi-hinam.co.il', 'חצי חינם'],
  ['ampm.co.il', 'am:pm', 'ampm', 'איי אם פי אם'],
  // fuel
  ['paz.co.il', 'paz yellow', '=פז', '=paz'],
  ['yellow.co.il', 'yellow', '=ילו'],
  ['delek.co.il', 'חברת דלק', '=דלק', '=delek'],
  ['sonol.co.il', 'סונול', 'sonol'],
  ['doralon.co.il', 'דור אלון', 'doralon', 'dor alon'],
  // added on request
  ['footlocker.co.il', 'פוט לוקר', 'foot locker', 'footlocker'],
  ['roladin.co.il', 'רולדין', 'roladin'],
  ['neeman.co.il', 'מאפה נאמן', 'maafe neeman', '=נאמן'],
  ['nizat.com', 'ניצת הדובדבן', 'ניצת', 'nizat'],
  ['castro.com/lovecard', 'love gift card', 'lovegiftcard', 'לאב גיפט', 'love card', 'לאב קארד'], // Castro group's gift card
  ['powergift.co.il', 'פאוור גיפט', 'פאואר גיפט', 'power gift', 'powergift', 'power card'],
  ['365mashbir.co.il', 'המשביר לצרכן', 'המשביר', 'משביר', 'mashbir'],
  // hotels & cinema
  ['isrotel.com', 'ישרוטל', 'isrotel'],
  ['fattal.co.il', 'פתאל', 'fattal'],
  ['hotcinema.co.il', 'הוט סינמה', 'hot cinema'],
  ['lev.co.il', 'סינמה לב', 'lev cinema'],
];

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

// How a brand is written on the "brands with a logo" board when its first name isn't the familiar one.
const LABELS = {
  'shufersal.co.il': 'שופרסל · תו הזהב',
  'hm.com': 'H&M',
  'h-o.co.il': 'H&O',
  'ksp.co.il': 'KSP',
  'kfc.co.il': 'KFC',
  'buyme.co.il': 'BuyMe',
  'htzone.co.il': 'HTZone',
  'sabon.co.il': 'Sabon',
  'maccosmetics.co.il': 'MAC',
  'ampm.co.il': 'AM:PM',
  'yellow.co.il': 'Yellow',
  'delek.co.il': 'דלק',
  'hvr.co.il': 'חבר',
  'bestore.co.il': 'Be פארם',
  'castro.com/lovecard': 'Love Gift Card',
  'powergift.co.il': 'Power Gift',
};
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

/**
 * Logos stored with the app (public/brands), taken from each brand's current site: for brands whose site icon is
 * tiny / generic / outdated / only part of the logo, or whose site is gone. `wide` marks a long wordmark: it is
 * shown on the brands board, while the small square tile on a coupon keeps the brand's square site icon.
 */
const OWN_LOGOS = {
  'buyme.co.il': '/brands/buyme.svg',
  'victoryonline.co.il': '/brands/victory.svg',
  'terminalx.com': '/brands/terminalx.png',
  'ace.co.il': '/brands/ace.png',
  'hazi-hinam.co.il': '/brands/hazi-hinam.svg',
  'hotcinema.co.il': '/brands/hotcinema.png',
  'agadir.co.il': '/brands/agadir.svg',
  'shilav.co.il': '/brands/shilav.png',
  'yochananof.co.il': '/brands/yochananof.png',
  'cafegreg.co.il': '/brands/cafegreg.png',
  'tivtaam.co.il': '/brands/tivtaam.png',
  'cafecafe.co.il': '/brands/cafecafe.svg',
  'crocs.co.il': '/brands/crocs.svg',
  'kikocosmetics.com': '/brands/kiko.svg',
  'fox.co.il': '/brands/fox.svg',
  'benedict.co.il': '/brands/benedict.png',
  'toysrus.co.il': { src: '/brands/toysrus.png', wide: true },
  'dreamcard.co.il': { src: '/brands/dreamcard.png', wide: true },
  'bershka.com': { src: '/brands/bershka.svg', wide: true },
  'decathlon.co.il': { src: '/brands/decathlon.svg', wide: true },
  'lastprice.co.il': { src: '/brands/lastprice.svg', wide: true },
  'twentyfourseven.co.il': { src: '/brands/tfs.png', wide: true },
  'stevemadden.co.il': { src: '/brands/stevemadden.png', wide: true },
  'foxhome.co.il': { src: '/brands/foxhome.png', wide: true },
  'japanika.net': { src: '/brands/japanika.png', wide: true },
  'sabon.co.il': { src: '/brands/sabon.png', wide: true },
  'bestore.co.il': '/brands/be.png',
  'roladin.co.il': '/brands/roladin.png',
  'castro.com/lovecard': '/brands/lovegiftcard.png',
  'footlocker.co.il': { src: '/brands/footlocker.svg', wide: true },
  'neeman.co.il': { src: '/brands/neeman.png', wide: true },
  'nizat.com': { src: '/brands/nizat.png', wide: true },
  'powergift.co.il': { src: '/brands/powergift.png', wide: true },
  '365mashbir.co.il': { src: '/brands/mashbir.png', wide: true },
};
const ownLogo = (domain) => {
  const o = OWN_LOGOS[domain];
  return typeof o === 'string' ? { src: o, wide: false } : o || null;
};

/** True for images stored with the app (always the real logo, any size). */
export const isOwnLogo = (src) => src.startsWith('/brands/');

/** Public logo image for a domain (Google's site-icon service; no key needed). */
export const logoUrl = (domain) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

/**
 * Images to try for a brand, best first. `shape` is the space it's shown in: 'square' (coupon tile) or 'wide'
 * (brands board). A long wordmark is unreadable in a small square, so there the site icon comes first.
 */
export function logoSources(domain, shape = 'square') {
  const own = ownLogo(domain);
  const icon = logoUrl(domain);
  if (!own) return [icon];
  return own.wide && shape === 'square' ? [icon, own.src] : [own.src, icon];
}
