// The chains the app knows: their names, how they are written on the brands board, and the logos stored with
// the app (public/brands). Plain data; the matching logic is in brands.js.

// [domain, ...names] — names are matched loosely (case / spaces / dashes ignored) anywhere in the text.
// A name starting with "=" must be a whole word (short names like "פז" would otherwise match inside other words).
// Every domain here was checked to be the brand's real site (its icon is the brand's).
export const BRANDS = [
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
  ['burgersbar.co.il', 'בורגרס בר', 'burgers bar', 'burgersbar', '=bbb', 'בי בי בי'],
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
  ['shemo.co.il', 'מיקי שמו', 'miki shemo', 'shemo', '=שמו'],
  ['365mashbir.co.il', 'המשביר לצרכן', 'המשביר', 'משביר', 'mashbir'],
  ['foodappeal.co.il', 'פוד אפיל', 'food appeal', 'foodappeal', 'food apeal'], // its site moved to foodappeal-online.com
  ['minene.net', 'מיננה', 'minene'],
  ['naamanp.co.il', 'נעמן', 'נעמן פורצלן', 'naaman'],
  ['flyingtiger.com', 'פליינג טייגר', 'flying tiger', 'flyingtiger'],
  ['legenda.co.il', "לג'נדה", 'לג׳נדה', 'לגנדה', 'legenda'], // gelato & frozen yogurt
  ['azrielimalls.co.il', 'קניוני עזריאלי', 'עזריאלי', 'azrieli'], // the malls' gift card; azrieli.com itself closed in 2023
  // hotels & cinema
  ['isrotel.com', 'ישרוטל', 'isrotel'],
  ['fattal.co.il', 'פתאל', 'fattal'],
  ['hotcinema.co.il', 'הוט סינמה', 'hot cinema'],
  ['lev.co.il', 'סינמה לב', 'lev cinema'],
];

// How a brand is written on the "brands with a logo" board when its first name isn't the familiar one.
export const LABELS = {
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
  'shemo.co.il': 'מיקי שמו',
};

/**
 * Logos stored with the app (public/brands), taken from each brand's current site: for brands whose site icon is
 * tiny / generic / outdated / only part of the logo, or whose site is gone. `wide` marks a long wordmark: on a
 * coupon it gets a tile twice as wide as it is tall.
 */
export const OWN_LOGOS = {
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
  'kikocosmetics.com': '/brands/kiko.svg',
  'fox.co.il': '/brands/fox.svg',
  'benedict.co.il': { src: '/brands/benedict.png', wide: true },
  'toysrus.co.il': { src: '/brands/toysrus.png', wide: true },
  'dreamcard.co.il': { src: '/brands/dreamcard.png', wide: true },
  'bershka.com': { src: '/brands/bershka.svg', wide: true },
  'decathlon.co.il': { src: '/brands/decathlon.svg', wide: true },
  'lastprice.co.il': { src: '/brands/lastprice.png', wide: true },
  'twentyfourseven.co.il': { src: '/brands/tfs.png', wide: true },
  'stevemadden.co.il': { src: '/brands/stevemadden.png', wide: true },
  'foxhome.co.il': { src: '/brands/foxhome.png', wide: true },
  'japanika.net': { src: '/brands/japanika.png', wide: true },
  'sabon.co.il': { src: '/brands/sabon.png', wide: true },
  'bestore.co.il': '/brands/be.png',
  'roladin.co.il': { src: '/brands/roladin.png', wide: true },
  'castro.com/lovecard': '/brands/lovegiftcard.png',
  'footlocker.co.il': { src: '/brands/footlocker.svg', wide: true },
  'neeman.co.il': { src: '/brands/neeman.png', wide: true },
  'nizat.com': { src: '/brands/nizat.png', wide: true },
  'powergift.co.il': '/brands/powergift.png', // the gift card itself
  'pullandbear.com': { src: '/brands/pullandbear.png', wide: true },
  'officedepot.co.il': { src: '/brands/officedepot.png', wide: true },
  'stradivarius.com': { src: '/brands/stradivarius.png', wide: true },
  'kravitz.co.il': '/brands/kravitz.png',
  'shekem-electric.co.il': { src: '/brands/shekem.png', wide: true },
  'renuar.co.il': { src: '/brands/renuar.png', wide: true },
  'shemo.co.il': { src: '/brands/shemo.png', wide: true },
  '365mashbir.co.il': { src: '/brands/mashbir.png', wide: true },
  'foodappeal.co.il': '/brands/foodappeal.png',
  'minene.net': { src: '/brands/minene.png', wide: true },
  'naamanp.co.il': { src: '/brands/naaman.png', wide: true },
  'flyingtiger.com': { src: '/brands/flyingtiger.png', wide: true },
  'azrielimalls.co.il': { src: '/brands/azrieli.png', wide: true },
  'legenda.co.il': '/brands/legenda.png', // the logo the user sent
};
