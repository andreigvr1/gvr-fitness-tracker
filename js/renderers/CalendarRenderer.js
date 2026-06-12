// Renders the monthly calendar view with workout days marked

import { ICONS } from '../utils/Constants.js';
import { formatVolume } from '../utils/UIHelpers.js';
import { loadTemplate } from '../utils/TemplateLoader.js';

const DOWS = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];

export class CalendarRenderer {
  constructor(container, antrenamente = []) {
    this.container = container;
    this.antrenamente = antrenamente;
    const now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth();
    this.selectedDay = null; // 'YYYY-M-D'
  }

  async render(onBack) {
    const template = await loadTemplate('calendar');
    this.container.innerHTML = '';
    this.container.appendChild(template);

    const back = this.container.querySelector('#cal-back');
    back.innerHTML = `${ICONS.back} Înapoi`;
    back.addEventListener('click', () => onBack?.());

    this.container.querySelector('#cal-prev').addEventListener('click', () => this.shiftMonth(-1));
    this.container.querySelector('#cal-next').addEventListener('click', () => this.shiftMonth(1));
    this.container.querySelector('#cal-dows').innerHTML =
      DOWS.map(d => `<span class="cal-dow">${d}</span>`).join('');

    this.drawMonth();
  }

  shiftMonth(delta) {
    this.month += delta;
    if (this.month < 0)  { this.month = 11; this.year--; }
    if (this.month > 11) { this.month = 0;  this.year++; }
    this.selectedDay = null;
    this.drawMonth();
  }

  dayKey(y, m, d) { return `${y}-${m}-${d}`; }

  // antrenamentele grupate pe zi calendaristică, pentru luna afișată
  sessionsByDay() {
    const map = {};
    this.antrenamente.forEach(a => {
      const d = new Date(a.data);
      if (d.getFullYear() !== this.year || d.getMonth() !== this.month) return;
      (map[d.getDate()] ||= []).push(a);
    });
    return map;
  }

  drawMonth() {
    const monthName = new Date(this.year, this.month, 1)
      .toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
    this.container.querySelector('#cal-month').textContent =
      monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const byDay = this.sessionsByDay();
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
    const firstDow = (new Date(this.year, this.month, 1).getDay() + 6) % 7; // luni = 0
    const today = new Date();
    const isThisMonth = today.getFullYear() === this.year && today.getMonth() === this.month;

    let cells = '';
    for (let i = 0; i < firstDow; i++) cells += '<span class="cal-cell cal-empty"></span>';
    for (let d = 1; d <= daysInMonth; d++) {
      const has = !!byDay[d];
      const isToday = isThisMonth && today.getDate() === d;
      const isSel = this.selectedDay === this.dayKey(this.year, this.month, d);
      cells += `
        <button class="cal-cell ${has ? 'cal-has' : ''} ${isToday ? 'cal-today' : ''} ${isSel ? 'cal-sel' : ''}"
          data-day="${d}" ${has ? '' : 'disabled'}>
          <span class="cal-daynum">${d}</span>
          ${has ? `<span class="cal-dot">${byDay[d].length > 1 ? byDay[d].length : ''}</span>` : ''}
        </button>`;
    }
    this.container.querySelector('#cal-grid').innerHTML = cells;

    this.container.querySelectorAll('.cal-cell[data-day]:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedDay = this.dayKey(this.year, this.month, Number(btn.dataset.day));
        this.drawMonth();
      });
    });

    this.drawDetail(byDay);
  }

  drawDetail(byDay) {
    const el = this.container.querySelector('#cal-detail');
    const monthCount = Object.values(byDay).reduce((n, arr) => n + arr.length, 0);

    if (!this.selectedDay) {
      el.innerHTML = monthCount
        ? `<div class="cal-hint">${monthCount} ${monthCount === 1 ? 'antrenament' : 'antrenamente'} luna asta — atinge o zi marcată pentru detalii.</div>`
        : `<div class="cal-hint">Nicio sesiune în luna asta. Zilele antrenate apar marcate cu violet.</div>`;
      return;
    }

    const day = Number(this.selectedDay.split('-')[2]);
    const sessions = byDay[day] || [];
    el.innerHTML = sessions.map(a => {
      const done = a.exercitii.filter(e => !e.skip).length;
      const skipped = a.exercitii.length - done;
      const vol = a.exercitii.reduce((s, e) =>
        s + (e.skip ? 0 : (e.serii || []).reduce((v, x) => v + (x.greutate || 0) * (x.repetari || 0), 0)), 0);
      return `
        <div class="hist-item">
          <span class="hist-check">${ICONS.check}</span>
          <div class="hist-info">
            <span class="hist-label">${a.zi_label || 'Antrenament'}</span>
            <span class="hist-meta">${done} exerciții${skipped ? ` · ${skipped} sărite` : ''}${vol ? ` · ${formatVolume(vol)}` : ''}</span>
          </div>
        </div>`;
    }).join('');
  }
}
