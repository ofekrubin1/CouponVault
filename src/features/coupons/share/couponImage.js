// Draws a coupon as a PNG card (the blue ticket from the coupon screen) for sharing.
// Pure canvas drawing; the logo is the one stored with the app, else the brand's site icon, else its first letter.
import { brandDomain, isWideLogo, logoSources } from '@/domain/brands';
import { balanceOf, isMoney, isPhysical } from '@/domain/coupon';
import { formatDate, money } from '@/domain/format';
import { displayStore } from '@/domain/links';

const W = 1080;
const PAD = 56; // around the card
const IN = 64; // inside the card
const FONT = 'Inter, "Segoe UI", -apple-system, BlinkMacSystemFont, Heebo, Arial, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "Courier New", monospace';
const BG = '#EEF1F6';
const C = { navy: '#0A1F44', gold: '#C9A45B', champagne: '#E6CB8B', white: '#FFFFFF' };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Sets a font that makes `text` fit in maxW (down to `min` px); returns the text, cut with "…" if still too long. */
function fit(ctx, text, maxW, weight, size, min = size * 0.6, family = FONT) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${family}`;
    if (ctx.measureText(text).width <= maxW) return text;
    s -= 2;
  } while (s >= min);
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t}…`;
}

function text(ctx, str, x, y, { color, align = 'right', dir = 'rtl' } = {}) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.direction = dir;
  ctx.fillText(str, x, y);
}

function loadImage(src, cors) {
  return new Promise((resolve) => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img.naturalWidth >= 24 || !cors ? img : null);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** The brand's logo as an image that can be drawn without "tainting" the canvas (null when there's none). */
async function loadLogo(domain) {
  if (!domain) return null;
  for (const src of logoSources(domain)) {
    const img = await loadImage(src, !src.startsWith('/'));
    if (img) return img;
  }
  return null;
}

function worth(c) {
  if (isMoney(c)) {
    const left = balanceOf(c);
    return { label: 'יתרה לניצול', big: money(left), sub: c.value && left !== c.value ? `מתוך ${money(c.value)}` : '' };
  }
  if (c.type === 'percent' && c.value) return { label: 'הנחה', big: `${c.value}%`, sub: '' };
  if (c.type === 'product') return { label: 'שובר למוצר', big: '', sub: '' };
  return { label: 'קופון', big: '', sub: '' };
}

/** A PNG Blob of the coupon card. */
export async function renderCouponImage(coupon) {
  // the page only loads the font weights it shows; make sure the card's are there before drawing
  if (document.fonts?.load) await Promise.all(['400', '500', '600', '700'].map((w) => document.fonts.load(`${w} 40px Inter`).catch(() => null)));
  if (document.fonts?.ready) await document.fonts.ready;
  const domain = brandDomain(coupon);
  const logo = await loadLogo(domain);
  const v = worth(coupon);

  // heights of the blocks that are there, top to bottom
  const H_HEAD = 200;
  const H_VALUE = v.big ? (v.sub ? 280 : 230) : 110;
  const H_CUT = 70;
  const H_CODE = coupon.code ? 230 : 0;
  const H_CVV = coupon.cvv ? 170 : 0;
  const lines = [coupon.expiry ? `בתוקף עד ${formatDate(coupon.expiry)}` : 'ללא תאריך תפוגה', isPhysical(coupon) ? 'שובר פיזי · צריך להביא אותו' : ''].filter(Boolean);
  const H_LINES = lines.length * 64 + 20;
  const H_FOOT = 110;
  const cardH = IN + H_HEAD + H_VALUE + H_CUT + H_CODE + H_CVV + H_LINES + H_FOOT;
  const H = cardH + PAD * 2;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // the card: soft blue gradient, a gold glow in the corner
  const x0 = PAD;
  const y0 = PAD;
  const cw = W - PAD * 2;
  const right = x0 + cw - IN;
  const left = x0 + IN;
  ctx.save();
  roundRect(ctx, x0, y0, cw, cardH, 56);
  ctx.shadowColor = 'rgba(10,31,68,0.22)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  const g = ctx.createLinearGradient(x0, y0, x0 + cw, y0 + cardH);
  g.addColorStop(0, '#7F96C9');
  g.addColorStop(0.5, '#6580B8');
  g.addColorStop(1, '#4F689F');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x0, y0, cw, cardH, 56);
  ctx.clip();
  const glow = ctx.createRadialGradient(x0 + 40, y0 + 20, 0, x0 + 40, y0 + 20, 460);
  glow.addColorStop(0, 'rgba(240,215,160,0.42)');
  glow.addColorStop(1, 'rgba(240,215,160,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x0, y0, cw, cardH);
  ctx.restore();

  // header: logo tile on the right, title and store beside it
  let y = y0 + IN;
  const wide = domain && logo && isWideLogo(domain);
  const tileW = wide ? 300 : 150;
  const tileH = 150;
  const tileX = right - tileW;
  roundRect(ctx, tileX, y, tileW, tileH, 32);
  ctx.fillStyle = C.white;
  ctx.fill();
  if (logo) {
    const k = Math.min((tileW - 36) / logo.naturalWidth, (tileH - 36) / logo.naturalHeight);
    const lw = logo.naturalWidth * k;
    const lh = logo.naturalHeight * k;
    ctx.drawImage(logo, tileX + (tileW - lw) / 2, y + (tileH - lh) / 2, lw, lh);
  } else {
    ctx.font = `700 72px ${FONT}`;
    text(ctx, (displayStore(coupon.store) || coupon.title || '?').trim().charAt(0), tileX + tileW / 2, y + 100, { color: '#5C74AA', align: 'center' });
  }
  const headW = tileX - 36 - left;
  text(ctx, fit(ctx, coupon.title || '', headW, 700, 60, 38), tileX - 36, y + 70, { color: C.white });
  text(ctx, fit(ctx, displayStore(coupon.store), headW, 400, 40, 28), tileX - 36, y + 128, { color: 'rgba(255,255,255,0.82)' });
  y += H_HEAD;

  // value
  ctx.font = `500 36px ${FONT}`;
  text(ctx, v.label, right, y + 40, { color: 'rgba(255,255,255,0.62)' });
  if (v.big) {
    ctx.font = `700 150px ${FONT}`;
    text(ctx, v.big, right, y + 190, { color: C.white, dir: 'ltr' });
    if (v.sub) {
      ctx.font = `400 40px ${FONT}`;
      text(ctx, v.sub, right, y + 250, { color: 'rgba(255,255,255,0.62)' });
    }
  }
  y += H_VALUE;

  // the tear line, with a notch on each side
  ctx.save();
  ctx.setLineDash([16, 14]);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0 + 50, y + H_CUT / 2);
  ctx.lineTo(x0 + cw - 50, y + H_CUT / 2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = BG;
  for (const cx of [x0, x0 + cw]) {
    ctx.beginPath();
    ctx.arc(cx, y + H_CUT / 2, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  y += H_CUT;

  // code (and verification code) in white "tear-off" boxes with a dashed gold border
  const box = (label, value, h, size) => {
    roundRect(ctx, left, y, cw - IN * 2, h - 40, 32);
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.fill();
    ctx.save();
    ctx.setLineDash([14, 10]);
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
    ctx.font = `600 30px ${FONT}`;
    text(ctx, label, right - 36, y + 56, { color: '#8F6F2C' });
    const shown = fit(ctx, value, cw - IN * 2 - 72, 700, size, 36, MONO);
    text(ctx, shown, x0 + cw / 2, y + h - 80, { color: C.navy, align: 'center', dir: 'ltr' });
    y += h;
  };
  if (coupon.code) box('קוד קופון', coupon.code, H_CODE, 76);
  if (coupon.cvv) box('קוד אימות', coupon.cvv, H_CVV, 64);

  // expiry, physical
  y += 20;
  for (const line of lines) {
    ctx.font = `500 40px ${FONT}`;
    text(ctx, line, right, y + 44, { color: C.white });
    y += 64;
  }

  // footer
  ctx.font = `700 38px ${FONT}`;
  text(ctx, 'CouponVault', x0 + cw / 2, y0 + cardH - 50, { color: C.champagne, align: 'center', dir: 'ltr' });

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('no image'))), 'image/png'));
}
