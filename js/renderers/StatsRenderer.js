// Renders the Statistici hub: Sumar / Progres / Recorduri tabs

import { ICONS } from '../utils/Constants.js';
import { StatsEngine } from '../engines/StatsEngine.js';
import { formatVolume, formatDate } from '../utils/UIHelpers.js';
import { loadTemplate } from '../utils/TemplateLoader.js';
import { ExerciseManager } from '../utils/ExerciseManager.js';

export class StatsRenderer {
  constructor(container, program, antrenamente = []) {
    this.container = container;
    this.program = program;
    this.antrenamente = antrenamente;
    this.stats = new StatsEngine();
    this.exNames = {};        // ex_id → nume
    this.selectedEx = null;   // exercițiul ales în tab-ul Progres
  }

  async render(tab = 'sumar') {
    const template = await loadTemplate('statistici');
    this.container.innerHTML = '';
    this.container.appendChild(template);

    // Numele exercițiilor (istoricul stochează doar id-uri)
    const all = await ExerciseManager.loadAll();
    this.exNames = Object.fromEntries(all.map(e => [e.id, e.nume]));

    this.container.querySelectorAll('.stats-tab').forEach(btn => {
      btn.addEventListener('click', () => this.showTab(btn.dataset.tab));
    });

    this.showTab(tab);
  }

  showTab(tab) {
    this.container.querySelectorAll('.stats-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab));
    const body = this.container.querySelector('#stats-body');

    if (tab === 'sumar')     body.innerHTML = this.renderSumar();
    if (tab === 'progres')   { body.innerHTML = this.renderProgres(); this.attachProgresHandlers(); }
    if (tab === 'recorduri') body.innerHTML = this.renderRecorduri();
  }

  exName(id) {
    return this.exNames[id] || id.replaceAll('_', ' ');
  }

  // ── Sumar ────────────────────────────────────────────────────────────────────
  renderSumar() {
    const a = this.antrenamente;
    const total = this.stats.getTotalSessions(a);

    if (!total) {
      return `<div class="stats-empty">
        <p><strong>Încă nimic de numărat.</strong></p>
        <p>După primul antrenament salvat, aici vezi totalurile tale: sesiuni, volum, serii reușite și ritmul pe săptămâni.</p>
      </div>`;
    }

    const week = this.stats.getThisWeekCount(a, this.program);
    const volume = this.stats.getTotalVolume(a);
    const sets = this.stats.getTotalSuccessfulSets(a);
    const distinct = this.stats.getDistinctExercisesCount(a);
    const weekly = this.stats.getWeeklyCounts(a, 8);
    const weeksActive = weekly.filter(w => w.count > 0).length;

    const card = (ico, val, lbl) => `
      <div class="stat-card">
        <div class="stat-ico">${ico}</div>
        <div class="stat-val">${val}</div>
        <div class="stat-lbl">${lbl}</div>
      </div>`;

    return `
      <div class="stats-cards">
        ${card(ICONS.bolt, total, 'Antrenamente totale')}
        ${card(ICONS.calendar, `${week.completed}<span class="stat-sub">/${week.total}</span>`, 'Săptămâna asta')}
        ${card(ICONS.chart, formatVolume(volume), 'Volum total ridicat')}
        ${card(ICONS.check, sets, 'Serii reușite')}
        ${card(ICONS.list, distinct, 'Exerciții lucrate')}
        ${card(ICONS.flag, `${weeksActive}<span class="stat-sub">/8</span>`, 'Săptămâni active')}
      </div>
      <div class="stats-section-head">Ultimele 8 săptămâni</div>
      <div class="stats-chart-card">${this.weeklyBarsSVG(weekly)}</div>`;
  }

  weeklyBarsSVG(weekly) {
    const W = 320, H = 110, pad = 8, gap = 10;
    const barW = (W - pad * 2 - gap * (weekly.length - 1)) / weekly.length;
    const max = Math.max(1, ...weekly.map(w => w.count));
    const bars = weekly.map((w, i) => {
      const h = w.count === 0 ? 3 : (w.count / max) * (H - 34);
      const x = pad + i * (barW + gap);
      const y = H - 22 - h;
      const lbl = new Date(w.start).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
      return `
        <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4"
          fill="${w.count === 0 ? 'var(--surf2)' : 'var(--accent)'}" opacity="${w.count === 0 ? 1 : 0.9}"/>
        ${w.count > 0 ? `<text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" fill="var(--t1)"
          font-size="11" font-weight="800" font-family="system-ui,sans-serif">${w.count}</text>` : ''}
        ${i % 2 === 0 ? `<text x="${x + barW / 2}" y="${H - 6}" text-anchor="middle" fill="var(--t3)"
          font-size="8.5" font-family="system-ui,sans-serif">${lbl}</text>` : ''}`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="stats-svg" role="img" aria-label="Antrenamente pe săptămâni">${bars}</svg>`;
  }

  // ── Progres ──────────────────────────────────────────────────────────────────
  renderProgres() {
    const series = this.stats.getExerciseSeries(this.antrenamente);
    const eligible = Object.entries(series)
      .filter(([, pts]) => pts.length >= 2)
      .sort((x, y) => y[1].length - x[1].length);

    if (!eligible.length) {
      return `<div class="stats-empty">
        <p><strong>Graficul are nevoie de istorie.</strong></p>
        <p>După ce loghezi același exercițiu în cel puțin 2 antrenamente, aici îi vezi evoluția greutății în timp.</p>
      </div>`;
    }

    if (!this.selectedEx || !series[this.selectedEx] || series[this.selectedEx].length < 2) {
      this.selectedEx = eligible[0][0];
    }
    const pts = series[this.selectedEx];
    const isBW = pts.every(p => !p.greutate);

    const options = eligible.map(([id, p]) =>
      `<option value="${id}" ${id === this.selectedEx ? 'selected' : ''}>${this.exName(id)} (${p.length} sesiuni)</option>`).join('');

    const first = pts[0], last = pts[pts.length - 1];
    const v0 = isBW ? first.repetari : first.greutate;
    const v1 = isBW ? last.repetari : last.greutate;
    const unit = isBW ? 'rep' : 'kg';
    const delta = v1 - v0;
    const deltaTxt = delta > 0 ? `+${delta} ${unit} de la prima sesiune` :
                     delta < 0 ? `${delta} ${unit} față de prima sesiune` :
                     'constant de la prima sesiune';

    return `
      <div class="filter-group">
        <label for="progres-select">Exercițiul</label>
        <select class="filter-select" id="progres-select">${options}</select>
      </div>
      <div class="stats-chart-card">
        ${this.lineChartSVG(pts, isBW)}
        <div class="progres-delta ${delta > 0 ? 'delta-up' : delta < 0 ? 'delta-down' : ''}">
          ${delta > 0 ? ICONS.up : delta < 0 ? ICONS.down : ''}
          <span>${deltaTxt}</span>
        </div>
      </div>`;
  }

  attachProgresHandlers() {
    this.container.querySelector('#progres-select')?.addEventListener('change', (e) => {
      this.selectedEx = e.target.value;
      this.showTab('progres');
    });
  }

  lineChartSVG(pts, isBW) {
    const W = 320, H = 170, padL = 34, padR = 14, padT = 16, padB = 26;
    const vals = pts.map(p => isBW ? p.repetari : p.greutate);
    const min = Math.min(...vals), max = Math.max(...vals);
    const span = max - min || 1;
    const x = i => padL + (pts.length === 1 ? 0 : (i / (pts.length - 1)) * (W - padL - padR));
    const y = v => padT + (1 - (v - min) / span) * (H - padT - padB);

    const line = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${padL},${H - padB} ${line} ${x(vals.length - 1).toFixed(1)},${H - padB}`;
    const dots = vals.map((v, i) =>
      `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.4" fill="var(--accent)" stroke="var(--bg)" stroke-width="1.5"/>`).join('');

    const unit = isBW ? 'rep' : 'kg';
    const d0 = formatDate(pts[0].data), d1 = formatDate(pts[pts.length - 1].data);

    return `<svg viewBox="0 0 ${W} ${H}" class="stats-svg" role="img" aria-label="Evoluția exercițiului">
      <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="var(--border)" stroke-width="1"/>
      <text x="${padL - 6}" y="${y(max) + 4}" text-anchor="end" fill="var(--t2)" font-size="10" font-weight="700" font-family="system-ui,sans-serif">${max}</text>
      <text x="${padL - 6}" y="${y(min) + 4}" text-anchor="end" fill="var(--t2)" font-size="10" font-weight="700" font-family="system-ui,sans-serif">${min}</text>
      <text x="${padL - 6}" y="${padT - 4}" text-anchor="end" fill="var(--t3)" font-size="8.5" font-family="system-ui,sans-serif">${unit}</text>
      <polygon points="${area}" fill="var(--accent)" opacity="0.12"/>
      <polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}
      <text x="${padL}" y="${H - 8}" fill="var(--t3)" font-size="9" font-family="system-ui,sans-serif">${d0}</text>
      <text x="${W - padR}" y="${H - 8}" text-anchor="end" fill="var(--t3)" font-size="9" font-family="system-ui,sans-serif">${d1}</text>
    </svg>`;
  }

  // ── Recorduri ────────────────────────────────────────────────────────────────
  renderRecorduri() {
    const records = this.stats.getRecords(this.antrenamente);

    if (!records.length) {
      return `<div class="stats-empty">
        <p><strong>Recordurile se câștigă, nu se afișează.</strong></p>
        <p>Fiecare serie reușită pe care o loghezi poate deveni record personal. După primul antrenament, lista începe aici.</p>
      </div>`;
    }

    return `<div class="rec-list">
      ${records.map((r, i) => `
        <div class="rec-item">
          <span class="rec-trophy ${i === 0 ? 'rec-gold' : ''}">${ICONS.trophy}</span>
          <div class="rec-info">
            <span class="rec-name">${this.exName(r.exId)}</span>
            <span class="rec-meta">${formatDate(r.data)} · ${r.sesiuni} ${r.sesiuni === 1 ? 'sesiune' : 'sesiuni'}</span>
          </div>
          <span class="rec-val">${r.greutate ? `${r.greutate} kg × ${r.repetari}` : `${r.repetari} rep`}</span>
        </div>`).join('')}
    </div>`;
  }
}
