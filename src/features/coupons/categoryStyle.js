// How each category looks (icon + colour). Display concern, so it lives with the coupon UI, not the domain.
import { Utensils, ShoppingCart, Shirt, Smartphone, Sofa, Ticket, Sparkles, Ellipsis, Tag } from 'lucide-react';
import { NO_CATEGORY } from '@/domain/constants';

const STYLES = {
  מסעדות: { icon: Utensils, color: '#B8943F' },
  סופרמרקט: { icon: ShoppingCart, color: '#2C5F7C' },
  אופנה: { icon: Shirt, color: '#8B6F47' },
  אלקטרוניקה: { icon: Smartphone, color: '#0A1F44' },
  בית: { icon: Sofa, color: '#50535A' },
  'פנאי ובילוי': { icon: Ticket, color: '#4A7CA5' },
  טיפוח: { icon: Sparkles, color: '#9A5B78' },
  אחר: { icon: Ellipsis, color: '#8A8F98' },
};
const CUSTOM = { icon: Tag, color: '#8B7355' };
const NONE = { icon: Ticket, color: '#0A1F44' };

export function categoryStyle(name) {
  if (!name || name === NO_CATEGORY) return NONE;
  return STYLES[name] || CUSTOM;
}

export const categoryLabel = (name) => (name === NO_CATEGORY ? 'ללא קטגוריה' : name);
