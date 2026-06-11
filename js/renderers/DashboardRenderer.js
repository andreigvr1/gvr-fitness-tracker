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
      document.getElementById('tpl-next-day-ring').innerHTML =
        `${nextInfo.number}<span>/${nextInfo.totalDays}</span>`;

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
