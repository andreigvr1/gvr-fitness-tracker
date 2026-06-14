// Renders the monthly calendar view with workout days marked + goal forecast milestones

import { ICONS } from '../utils/Constants.js';
import { formatVolume, formatNum } from '../utils/UIHelpers.js';
import { GoalEngine } from '../engines/GoalEngine.js';
import { loadTemplate } from '../utils/TemplateLoader.js';

const DOWS = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];

export class CalendarRenderer {
  constructor(container, antrenamente = [], goals = []) {
    this.container = container;
    this.antrenamente = antrenamente;
    this.goals = goals;
    this.goalEngine = new GoalEngine();
    const now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth();
    this.selectedDay = null; // 'YYYY-M-D'
  }

  // Pronosticuri „on_track" cu dată estimată → milestone-uri pe calendar
  computeMilestones() {
    const unit = t => (t === 'rep' ? 'rep' : 'kg');
    return (this.goals || [])
      .map(g => {
        const ev = this.goalEngine.evaluate(g, this.antrenamente);
        if (ev.status !== 'on_track' || !ev.etaTs) return null;
        const d = new Date(ev.etaTs);
        return { nume: g.nume, tinta: g.tinta, unit: unit(g.tip_tinta), etaTs: ev.etaTs,
          year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
      })
      .filter(Boolean)
      .sort((a, b) => a.etaTs - b.etaTs);
  }

  async render(onBack) {
    const template = await loadTemplate('calendar');
    this.container.innerHTML = '';
    this.container.appendChild(template);

    this.milestones = this.computeMilestones();

    const back = this.container.querySelector('#cal-back');
    back.innerHTML = `${ICONS.back} Înapoi`;
    back.addEventListener('click', () => onBack?.());

    this.container.querySelector('#cal-prev').addEventListener('click', () => this.shiftMonth(-1));
    this.container.querySelector('#cal-next').addEventListener('click', () => this.shiftMonth(1));
    this.container.querySelector('#cal-dows').innerHTML =
      DOWS.map(d => `<span class="cal-dow">${d}</span>`).join('');

    this.drawMonth();
    this.drawForecast();
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

  // milestone-urile estimate în ziua dată din luna afișată
  milestonesOnDay(d) {
    return (this.milestones || []).filter(m => m.year === this.year && m.month === this.month && m.day === d);
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
      const goal = this.milestonesOnDay(d).length > 0;
      const isToday = isThisMonth && today.getDate() === d;
      const isSel = this.selectedDay === this.dayKey(this.year, this.month, d);
      const clickable = has || goal;
      cells += `
        <button class="cal-cell ${has ? 'cal-has' : ''} ${goal ? 'cal-goal' : ''} ${isToday ? 'cal-today' : ''} ${isSel ? 'cal-sel' : ''}"
          data-day="${d}" ${clickable ? '' : 'disabled'}>
          <span class="cal-daynum">${d}</span>
          ${has ? `<span class="cal-dot">${byDay[d].length > 1 ? byDay[d].length : ''}</span>` : ''}
          ${goal ? `<span class="cal-goal-mark">${ICONS.flag}</span>` : ''}
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
        : `<div class="cal-hint">Nicio sesiune în luna asta. Zilele antrenate apar marcate cu accent.</div>`;
      return;
    }

    const day = Number(this.selectedDay.split('-')[2]);
    const sessions = byDay[day] || [];
    const goals = this.milestonesOnDay(day);

    const goalsHTML = goals.map(m => `
      <div class="hist-item cal-goal-item">
        <span class="hist-check cal-goal-ico">${ICONS.flag}</span>
        <div class="hist-info">
          <span class="hist-label">Pronostic: ${m.nume}</span>
          <span class="hist-meta">Estimat ~${formatNum(m.tinta)} ${m.unit} — dacă ții ritmul actual</span>
        </div>
      </div>`).join('');

    const sessHTML = sessions.map(a => {
      const done = (a.exercitii || []).filter(e => !e.skip).length;
      const skipped = (a.exercitii || []).length - done;
      const vol = (a.exercitii || []).reduce((s, e) =>
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

    el.innerHTML = goalsHTML + sessHTML;
  }

  // Lista persistentă de pronostice (toate goal-urile on_track), indiferent de luna afișată
  drawForecast() {
    const el = this.container.querySelector('#cal-forecast');
    if (!el) return;
    if (!this.milestones.length) { el.innerHTML = ''; return; }

    el.innerHTML = `
      <div class="cal-fc-title">${ICONS.flag} Pronostice obiective</div>
      ${this.milestones.map(m => {
        const luna = new Date(m.etaTs).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
        return `<div class="cal-fc-item"><span>${m.nume} → ${formatNum(m.tinta)} ${m.unit}</span><b>~${luna}</b></div>`;
      }).join('')}
      <div class="cal-fc-note">Estimări orientative, pe baza ritmului tău. Marcate cu ${ICONS.flag.replace(/<svg/, '<svg style="width:11px;height:11px;vertical-align:-1px"')} pe zilele estimate.</div>`;
  }
}
