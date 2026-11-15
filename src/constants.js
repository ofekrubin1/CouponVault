import { Utensils, ShoppingCart, Shirt, Smartphone, Sofa, Ticket, Sparkles, Ellipsis, Tag } from 'lucide-react';

export const DEFAULT_CATEGORIES = ['מסעדות', 'סופרמרקט', 'אופנה', 'אלקטרוניקה', 'בית', 'פנאי ובילוי', 'טיפוח', 'אחר'];

const CATEGORY_STYLES = {
  מסעדות: { icon: Utensils, color: '#B8943F' },
  סופרמרקט: { icon: ShoppingCart, color: '#2C5F7C' },
  אופנה: { icon: Shirt, color: '#8B6F47' },
  אלקטרוניקה: { icon: Smartphone, color: '#0A1F44' },
  בית: { icon: Sofa, color: '#50535A' },
  'פנאי ובילוי': { icon: Ticket, color: '#4A7CA5' },
  טיפוח: { icon: Sparkles, color: '#9A5B78' },
  אחר: { icon: Ellipsis, color: '#8A8F98' },
};
const CUSTOM_STYLE = { icon: Tag, color: '#8B7355' };
const NONE_STYLE = { icon: Ticket, color: '#0A1F44' };

export const NO_CATEGORY = 'ללא קטגוריה';

export function categoryStyle(name) {
  if (!name || name === NO_CATEGORY) return NONE_STYLE;
  return CATEGORY_STYLES[name] || CUSTOM_STYLE;
}

export const COUPON_TYPES = [
  { key: 'money', label: 'שובר כספי' },
  { key: 'percent', label: 'הנחה באחוזים' },
  { key: 'other', label: 'אחר' },
];

export const DEFAULT_ALERT_DAYS = 14;
export const ALERT_DAY_OPTIONS = [7, 14, 30, 60];
