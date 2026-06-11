// Renders the dashboard view with stats and upcoming workout

import { ICONS } from '../utils/Constants.js';
import { StatsEngine } from '../engines/StatsEngine.js';
import { formatVolume, getTodayLabel } from '../utils/UIHelpers.js';
import { loadTemplate } from '../utils/TemplateLoader.js';

export class DashboardRenderer {
  constructor(container, program, antrenamente = []) {
    this.container = container;
    this.program = program;
    this.antrenamente = antrenamente;
    this.statsEngine = new StatsEngine();
  }

  async render(onStartNext, onViewProgram, onEditPrefs) {
    try {
      const template = await loadTemplate('dashboard');
      this.container.innerHTML = '';
      this.container.appendChild(template);

      const stats = this.statsEngine;
      const totalSessions = stats.getTotalSessions(this.antrenamente);
      const weekStats = stats.getThisWeekCount(this.antrenamente, this.program);
      const totalVolume = stats.getTotalVolume(this.antrenamente);
      const history = stats.getActivityHistory(this.antrenamente);
      const nextInfo = stats.getNextWorkoutInfo(this.program, this.antrenamente);

      // Populate template elements
      document.getElementById('tpl-today-label').textContent = getTodayLabel();
      document.getElementById('btn-edit-prefs').innerHTML = ICONS.settings;

      document.getElementById('tpl-next-day-name').textContent = nextInfo.day.label;
      document.getElementById('tpl-next-day-meta').textContent =
        `Ziua ${nextInfo.number} din ${nextInfo.totalDays} · ${nextInfo.day.exercitii.length} exerciții`;
      const _r = 22, _cx = 28, _cy = 28, _circ = 2 * Math.PI * _r;
      const _progress = nextInfo.totalDays > 0 ? nextInfo.number / nextInfo.totalDays : 0;
      const _offset = _circ * (1 - _progress);
      document.getElementById('tpl-next-day-ring').innerHTML = `
        <svg viewBox="0 0 56 56" width="58" height="58">
          <circle cx="${_cx}" cy="${_cy}" r="${_r}" fill="none"
            stroke="rgba(124,111,247,.18)" stroke-width="3.5"/>
          <circle cx="${_cx}" cy="${_cy}" r="${_r}" fill="none"
            stroke="var(--accent)" stroke-width="3.5" stroke-linecap="round"
            stroke-dasharray="${_circ.toFixed(2)}" stroke-dashoffset="${_offset.toFixed(2)}"
            transform="rotate(-90 ${_cx} ${_cy})"/>
          <text x="${_cx}" y="${_cy - 5}" text-anchor="middle"
            fill="var(--t1)" font-size="12" font-weight="900" font-family="system-ui,sans-serif">${nextInfo.number}</text>
          <text x="${_cx}" y="${_cy + 8}" text-anchor="middle"
            fill="var(--acc-txt)" font-size="8" font-weight="700" font-family="system-ui,sans-serif">/${nextInfo.totalDays}</text>
        </svg>`;

      document.getElementById('tpl-stat-bolt').innerHTML = ICONS.bolt;
      document.getElementById('tpl-stat-sessions').textContent = totalSessions;

      document.getElementById('tpl-stat-calendar').innerHTML = ICONS.calendar;
      document.getElementById('tpl-stat-week').innerHTML =
        `${weekStats.completed}<span class="stat-sub">/${weekStats.total}</span>`;

      document.getElementById('tpl-stat-chart').innerHTML = ICONS.chart;
      document.getElementById('tpl-stat-volume').textContent = formatVolume(totalVolume);

      // Activity history
      const historyList = document.getElementById('tpl-history-list');
      if (history.length) {
        historyList.innerHTML = history.map(h => `
          <div class="hist-item">
            <div class="hist-date">
              <span class="hist-day">${h.dateStr}</span>
              <span class="hist-weekday">${h.weekday}</span>
            </div>
            <div class="hist-info">
              <span class="hist-label">${h.label}</span>
              <span class="hist-meta">${h.completedEx} exerciții${h.skippedEx ? ` · ${h.skippedEx} sărite` : ''}</span>
            </div>
            <span class="hist-check">${ICONS.check}</span>
          </div>`).join('');
      } else {
        historyList.innerHTML = '<div class="hist-empty">Niciun antrenament încă.<br>Primul pas e cel mai important.</div>';
      }

      this.attachEventListeners(onStartNext, onViewProgram, onEditPrefs);
    } catch (error) {
      console.error('Error rendering dashboard:', error);
    }
  }

  attachEventListeners(onStartNext, onViewProgram, onEditPrefs) {
    document.querySelector('#btn-start-next').addEventListener('click', () => {
      onStartNext?.();
    });

    document.querySelector('#btn-view-program').addEventListener('click', () => {
      onViewProgram?.();
    });

    document.querySelector('#btn-edit-prefs').addEventListener('click', () => {
      onEditPrefs?.();
    });
  }
}
