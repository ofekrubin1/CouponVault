import { format, parseISO } from 'date-fns';

export const round2 = (n) => Math.round(n * 100) / 100;



/** dd/MM/yyyy from a date or an ISO timestamp. */
export function formatDate(iso) {
  if (!iso) return '';
  return format(parseISO(iso.slice(0, 10)), 'dd/MM/yyyy');
}

export const money = (n) => `₪${Number(n || 0).toLocaleString('he-IL', { maximumFractionDigits: 2 })}`;

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || '';
