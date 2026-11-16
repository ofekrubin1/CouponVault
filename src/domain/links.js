// URLs inside free text (store, notes). Pure functions.

const URL_RE = /((?:https?:\/\/|www\.)[^\s<>"']+[^\s<>"'.,;:!?)\]])/gi;

/** Whole value is a link (e.g. the store field holds a web shop address). */
export const isUrl = (s) => /^(https?:\/\/|www\.)\S+$/i.test((s || '').trim());

export const toHref = (s) => (/^https?:\/\//i.test(s) ? s : `https://${s}`);

/** "https://www.htzone.co.il/voucher-zone/10" → "htzone.co.il" (null if not a URL). */
export function urlHost(s) {
  try {
    return new URL(toHref((s || '').trim())).hostname.replace(/^www\./i, '');
  } catch {
    return null;
  }
}

/** Short label for a store: the site name when it's a link, otherwise the text as is. */
export const displayStore = (store) => (isUrl(store) ? urlHost(store) || store : store || '');

/** Split text into plain and link parts: [{ text, href? }]. */
export function splitLinks(text) {
  const out = [];
  let last = 0;
  for (const m of (text || '').matchAll(URL_RE)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[0], href: toHref(m[0]) });
    last = m.index + m[0].length;
  }
  if (last < (text || '').length) out.push({ text: text.slice(last) });
  return out;
}
