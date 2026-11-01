import type { Locale } from './types';

/**
 * Bütün formatlama deterministikdir (server və brauzer eyni nəticə verir),
 * çünki bəzi brauzerlərin ICU-sunda Azərbaycan dili məlumatları natamamdır.
 */
const groupSep: Record<string, string> = { az: ' ', ru: ' ', tr: '.', en: ',' };
const decSep: Record<string, string> = { az: ',', ru: ',', tr: ',', en: '.' };

function group(n: number, locale: string) {
  const sep = groupSep[locale] ?? ' ';
  return Math.trunc(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

export function formatNumber(value: number, locale: string) {
  return `${value < 0 ? '−' : ''}${group(value, locale)}`;
}

export function formatAzn(value: number, locale: string) {
  return `${formatNumber(value, locale)} ₼`;
}

/** Qəpik → "9,90 ₼" */
export function formatQepik(q: number, locale: string) {
  const sign = q < 0 ? '−' : '';
  const abs = Math.abs(q);
  return `${sign}${group(Math.floor(abs / 100), locale)}${decSep[locale] ?? ','}${String(abs % 100).padStart(2, '0')} ₼`;
}

const RT: Record<string, { now: string; m: string; h: string; d: string; mo: string; y: string }> = {
  az: { now: 'indicə', m: '{n} dəq əvvəl', h: '{n} saat əvvəl', d: '{n} gün əvvəl', mo: '{n} ay əvvəl', y: '{n} il əvvəl' },
  en: { now: 'just now', m: '{n} min ago', h: '{n} h ago', d: '{n} d ago', mo: '{n} mo ago', y: '{n} y ago' },
  tr: { now: 'az önce', m: '{n} dk önce', h: '{n} saat önce', d: '{n} gün önce', mo: '{n} ay önce', y: '{n} yıl önce' },
  ru: { now: 'только что', m: '{n} мин назад', h: '{n} ч назад', d: '{n} дн назад', mo: '{n} мес назад', y: '{n} г назад' },
};

export function timeAgo(date: string | Date, locale: string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  const r = RT[locale] ?? RT.az;
  const f = (tpl: string, n: number) => tpl.replace('{n}', String(Math.max(1, Math.floor(n))));
  if (s < 60) return r.now;
  if (s < 3600) return f(r.m, s / 60);
  if (s < 86400) return f(r.h, s / 3600);
  if (s < 86400 * 30) return f(r.d, s / 86400);
  if (s < 86400 * 365) return f(r.mo, s / (86400 * 30));
  return f(r.y, s / (86400 * 365));
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Bakı vaxtı (UTC+4) ilə — server və brauzer eyni nəticə versin */
function baku(d: Date) {
  return new Date(d.getTime() + 4 * 3600 * 1000);
}

export function formatDate(date: string | Date) {
  const d = baku(typeof date === 'string' ? new Date(date) : date);
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

export function formatTime(date: string | Date) {
  const d = baku(typeof date === 'string' ? new Date(date) : date);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export const catName = (c: { name: Record<Locale, string> } | undefined, locale: string) =>
  c ? (c.name[locale as Locale] ?? c.name.az) : '';

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}
