// Renders the dashboard view with stats and upcoming workout

import { ICONS } from '../utils/Constants.js';
import { StatsEngine } from '../engines/StatsEngine.js';
import { formatVolume, getTodayLabel } from '../utils/UIHelpers.js';

export class DashboardRenderer {
  constructor(container, program, antrenamente = []) {
    this.container = container;
    this.program = program;
    this.antrenamente = antrenamente;
    this.statsEngine = new StatsEngine();
  }

  render(onStartNext, onViewProgram, onEditPrefs) {
    const stats = this.statsEngine;
    const totalSessions = stats.getTotalSessions(this.antrenamente);
    const weekStats = stats.getThisWeekCount(this.antrenamente, this.program);
    const totalVolume = stats.getTotalVolume(this.antrenamente);
    const volumeFmt = formatVolume(totalVolume);
    const history = stats.getActivityHistory(this.antrenamente);
    const nextInfo = stats.getNextWorkoutInfo(this.program, this.antrenamente);
    const todayLabel = getTodayLabel();

    const historyHTML = history.length
      ? history.map(h => `
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
        </div>`).join('')
      : '<div class="hist-empty">Niciun antrenament încă.<br>Primul pas e cel mai important.</div>';

    this.container.innerHTML = `
      <div class="dash-wrap">
        <header class="dash-top">
          <div>
            <div class="dash-date">${todayLabel}</div>
            <h1 class="dash-title">Salut! 👋</h1>
          </div>
          <button class="dash-icon-btn" id="btn-edit-prefs" title="Preferințe">${ICONS.settings}</button>
        </header>

        <div class="dash-grid">
        <div class="dash-next-card">
          <div class="dnc-row">
            <div>
              <div class="dnc-label">Următorul antrenament</div>
              <div class="dnc-name">${nextInfo.day.label}</div>
              <div class="dnc-meta">Ziua ${nextInfo.number} din ${nextInfo.totalDays} · ${nextInfo.day.exercitii.length} exerciții</div>
            </div>
            <div class="dnc-ring">${nextInfo.number}<span>/${nextInfo.totalDays}</span></div>
          </div>
          <button class="btn btn-primary btn-full" id="btn-start-next">
            <span class="btn-ico">${ICONS.play}</span> Începe antrenamentul
          </button>
        </div>

        <div class="stat-row">
          <div class="stat-card">
            <div class="stat-ico">${ICONS.bolt}</div>
            <div class="stat-val">${totalSessions}</div>
            <div class="stat-lbl">Antrenamente</div>
          </div>
          <div class="stat-card">
            <div class="stat-ico">${ICONS.calendar}</div>
            <div class="stat-val">${weekStats.completed}<span class="stat-sub">/${weekStats.total}</span></div>
            <div class="stat-lbl">Săptămâna asta</div>
          </div>
          <div class="stat-card">
            <div class="stat-ico">${ICONS.chart}</div>
            <div class="stat-val">${volumeFmt}</div>
            <div class="stat-lbl">Volum ridicat</div>
          </div>
        </div>

        <div class="dash-side">
          <div class="dash-section-head head-activity">
            <span>Activitate recentă</span>
          </div>
          <div class="hist-list">${historyHTML}</div>
        </div>

        <div class="dash-section-head head-soon">
          <span>În curând</span>
        </div>
        <div class="soon-grid">
          <div class="soon-card">
            <div class="soon-ico">${ICONS.calendar}</div>
            <div class="soon-name">Calendar</div>
            <div class="soon-desc">Vizualizare lunară a antrenamentelor</div>
            <span class="soon-chip">În curând</span>
          </div>
          <div class="soon-card">
            <div class="soon-ico">${ICONS.chart}</div>
            <div class="soon-name">Progres</div>
            <div class="soon-desc">Grafice de evoluție per exercițiu</div>
            <span class="soon-chip">În curând</span>
          </div>
          <div class="soon-card">
            <div class="soon-ico">${ICONS.trophy}</div>
            <div class="soon-name">Recorduri</div>
            <div class="soon-desc">Cele mai bune serii ale tale</div>
            <span class="soon-chip">În curând</span>
          </div>
          <div class="soon-card">
            <div class="soon-ico">${ICONS.bolt}</div>
            <div class="soon-name">Skandenberg</div>
            <div class="soon-desc">Modul dedicat de antrenament</div>
            <span class="soon-chip">În curând</span>
          </div>
        </div>

        <div class="dash-footer">
          <button class="btn btn-ghost btn-full" id="btn-view-program"><span class="btn-ico">${ICONS.list}</span> Vezi / modifică programul</button>
        </div>
        </div>
      </div>`;

    this.attachEventListeners(onStartNext, onViewProgram, onEditPrefs);
  }

  attachEventListeners(onStartNext, onViewProgram, onEditPrefs) {
    this.container.querySelector('#btn-start-next').addEventListener('click', () => {
      onStartNext?.();
    });

    this.container.querySelector('#btn-view-program').addEventListener('click', () => {
      onViewProgram?.();
    });

    this.container.querySelector('#btn-edit-prefs').addEventListener('click', () => {
      onEditPrefs?.();
    });
  }
}
