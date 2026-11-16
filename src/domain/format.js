import { addMonths, format, parseISO } from 'date-fns';

export const round2 = (n) => Math.round(n * 100) / 100;

export const toISODate = (d) => format(d, 'yyyy-MM-dd');

/** YYYY-MM-DD `months` from now (expiry presets). */
export const presetDate = (months, now = new Date()) => toISODate(addMonths(now, months));

/** dd/MM/yyyy from a date or an ISO timestamp. */
export function formatDate(iso) {
  if (!iso) return '';
  return format(parseISO(iso.slice(0, 10)), 'dd/MM/yyyy');
}

export const money = (n) => `₪${Number(n || 0).toLocaleString('he-IL', { maximumFractionDigits: 2 })}`;

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || '';
