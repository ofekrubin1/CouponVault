// How each category looks (icon + colour). Display concern, so it lives with the coupon UI, not the domain.
import { Utensils, ShoppingCart, Shirt, LayoutGrid, Ticket, Tag } from 'lucide-react';
import { NO_CATEGORY } from '@/domain/constants';

const STYLES = {
  כללי: { icon: LayoutGrid, color: '#4A7CA5' },
  אוכל: { icon: Utensils, color: '#B8943F' },
  סופרמרקט: { icon: ShoppingCart, color: '#2C5F7C' },
  ביגוד: { icon: Shirt, color: '#8B6F47' },
};
const CUSTOM = { icon: Tag, color: '#8B7355' };
const NONE = { icon: Ticket, color: '#0A1F44' };

export function categoryStyle(name) {
  if (!name || name === NO_CATEGORY) return NONE;
  return STYLES[name] || CUSTOM;
}

export const categoryLabel = (name) => (name === NO_CATEGORY ? 'ללא קטגוריה' : name);
