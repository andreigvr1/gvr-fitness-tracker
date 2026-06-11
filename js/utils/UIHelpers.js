// Shared UI helpers and formatters

import { ICONS, SKIP_REASONS } from './Constants.js';

export function ico(name, cls = '') {
  return `<span class="ico ${cls}">${ICONS[name]}</span>`;
}

export function getSkipReasonLabel(motivId) {
  return SKIP_REASONS.find(r => r.id === motivId)?.label || '';
}

export function formatDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
}

export function formatWeekday(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString('ro-RO', { weekday: 'short' });
}

export function formatVolume(kg) {
  return kg >= 1000 ? (kg / 1000).toFixed(1).replace('.', ',') + ' t' : Math.round(kg) + ' kg';
}

export function getTodayLabel() {
  const now = new Date();
  const azi = now.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
  return azi.charAt(0).toUpperCase() + azi.slice(1);
}

export function getWeekStart() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

export function getNextDayIdx(program, antrenamente) {
  const completed = (antrenamente || [])
    .filter(a => a.zi_complet)
    .sort((a, b) => b.data - a.data);
  if (!completed.length) return 0;
  return (completed[0].zi_index + 1) % program.zile.length;
}
