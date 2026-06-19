// Renders the dashboard view with stats and upcoming workout

import { ICONS } from '../utils/Constants.js';
import { StatsEngine } from '../engines/StatsEngine.js';
import { GoalEngine } from '../engines/GoalEngine.js';
import { formatVolume, getTodayLabel, formatNum } from '../utils/UIHelpers.js';
import { loadTemplate } from '../utils/TemplateLoader.js';

export class DashboardRenderer {
  constructor(container, program, antrenamente = [], profile = null, goals = []) {
    this.container = container;
    this.program = program;
    this.antrenamente = antrenamente;
    this.profile = profile;
    this.goals = goals;
    this.statsEngine = new StatsEngine();
    this.goalEngine = new GoalEngine();
  }

  async render(onStartNext, onViewProgram, onEditPrefs, explore = {}) {
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
            fill="var(--t1)" font-size="12" font-weight="900" font-family="'Bricolage Grotesque',system-ui,sans-serif">${nextInfo.number}</text>
          <text x="${_cx}" y="${_cy + 8}" text-anchor="middle"
            fill="var(--acc-txt)" font-size="8" font-weight="700" font-family="'Bricolage Grotesque',system-ui,sans-serif">/${nextInfo.totalDays}</text>
        </svg>`;

      document.getElementById('tpl-stat-bolt').innerHTML = ICONS.bolt;
      document.getElementById('tpl-stat-sessions').textContent = totalSessions;

      document.getElementById('tpl-stat-calendar').innerHTML = ICONS.calendar;
      document.getElementById('tpl-stat-week').innerHTML =
        `${weekStats.completed}<span class="stat-sub">/${weekStats.total}</span>`;

      document.getElementById('tpl-stat-chart').innerHTML = ICONS.chart;
      document.getElementById('tpl-stat-volume').textContent = formatVolume(totalVolume);

      // Goals
      this.renderGoals();

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

      // Explore cards: icons + skandenberg config status chip
      document.querySelector('#card-calendar .soon-ico').innerHTML = ICONS.calendar;
      document.querySelector('#card-progres .soon-ico').innerHTML = ICONS.trend;
      document.querySelector('#card-recorduri .soon-ico').innerHTML = ICONS.trophy;
      document.querySelector('#card-realizari .soon-ico').innerHTML = ICONS.bolt;
      document.querySelector('#card-skand .soon-ico').innerHTML = ICONS.arm;
      const skandChip = document.getElementById('skand-chip');
      if (this.profile?.stil_skandenberg) {
        skandChip.textContent = 'Configurat';
        skandChip.classList.add('chip-done');
      } else {
        skandChip.textContent = 'Nou';
      }

      this.attachEventListeners(onStartNext, onViewProgram, onEditPrefs, explore);
    } catch (error) {
      console.error('Error rendering dashboard:', error);
    }
  }

  renderGoals() {
    const wrap = document.getElementById('tpl-goals');
    if (!wrap) return;

    const addBtn = document.querySelector('#btn-add-goal');
    if (addBtn) {
      if (this.goals.length >= 3) {
        addBtn.disabled = true;
        addBtn.title = 'Maxim 3 obiective. Șterge unu pentru a adăuga altul.';
      } else {
        addBtn.disabled = false;
        addBtn.title = 'Adaugă obiectiv';
      }
    }

    if (!this.goals.length) {
      wrap.innerHTML = `<div class="goals-empty">Niciun obiectiv încă. Pune-ți o țintă (ex. 100 kg la bench) și urmărește-ți progresul.</div>`;
      return;
    }
    wrap.innerHTML = this.goals
      .map(g => this.buildGoalCard(g, this.goalEngine.evaluate(g, this.antrenamente, Date.now(), this.profile)))
      .join('');
  }

  buildGoalCard(goal, ev) {
    const unit = goal.tip_tinta === 'rep' ? 'rep' : 'kg';
    const done = ev.status === 'done';
    const scaleHtml = ev.strengthCtx ? this.buildStrengthScale(ev) : '';
    const realismHtml = ev.realism && ev.realism !== 'achievable' ? this.buildRealismBadge(ev) : '';
    return `
      <div class="goal-card${done ? ' goal-done' : ''}" data-goal-id="${goal.id}">
        <button class="goal-del" data-goal-id="${goal.id}" title="Șterge obiectivul">${ICONS.x}</button>
        <div class="goal-head">
          <div class="goal-name">${goal.nume}</div>
          <div class="goal-sub">Obiectiv de ${goal.tip_tinta === 'rep' ? 'repetări' : 'forță'}</div>
        </div>
        <div class="goal-pct">${ev.pct}%</div>
        <div class="goal-bar"><div class="goal-bar-fill" style="width:${ev.pct}%"></div></div>
        <div class="goal-vals">
          <span>Acum <b>${formatNum(ev.current)} ${unit}</b></span>
          <span>Țintă <b>${formatNum(ev.target)} ${unit}</b></span>
        </div>
        ${scaleHtml}
        ${realismHtml}
        <div class="goal-forecast goal-fc-${this.forecastTone(ev.status, ev.realism)}">
          <span class="goal-fc-dot"></span>${this.forecastText(ev, unit)}
        </div>
      </div>`;
  }

  buildStrengthScale(ev) {
    const { curEval, tgtEval, wr, wrClass, absWr } = ev.strengthCtx;
    if (!curEval && !tgtEval) return '';
    const LABELS = ['Înc.', 'Amator', 'Inter.', 'Avansat', 'Elită', 'Rec.'];
    const anchorPcts = [5, 20, 50, 80, 95, 100];
    const markers = anchorPcts.map((p, i) =>
      `<div class="gsc-marker" style="left:${p}%" title="${LABELS[i]}"></div>`).join('');
    const curPos = Math.min(98, curEval?.percentile ?? 0);
    const tgtPos = tgtEval ? Math.min(100, tgtEval.percentile + (ev.realism === 'impossible' ? 10 : 0)) : null;
    const curDot = `<div class="gsc-dot gsc-cur" style="left:${curPos}%" title="Tu acum: ${curEval?.level ?? ''}"></div>`;
    const tgtDot = tgtPos !== null
      ? `<div class="gsc-dot gsc-tgt" style="left:${Math.min(105, tgtPos)}%" title="Ținta: ${tgtEval?.level ?? ''}"></div>`
      : '';
    // Rând cu referințe duale: clasa ta + recordul absolut
    const clsHtml = wr && wrClass
      ? `<span class="gsc-rec-cls" title="Record mondial drug-tested raw, categoria ${wrClass} kg">Cls. ${wrClass} kg: ${wr} kg</span>`
      : '';
    const absHtml = absWr
      ? `<span class="gsc-rec-abs" title="Recordul absolut al omenirii (echipat, netestat)">Rec. absolut: ${absWr} kg ★</span>`
      : '';
    const recordsRow = (clsHtml || absHtml)
      ? `<div class="gsc-records">${clsHtml}${absHtml}</div>`
      : '';
    return `
      <div class="goal-scale">
        <div class="gsc-track">
          <div class="gsc-fill" style="width:${curPos}%"></div>
          ${markers}${curDot}${tgtDot}
        </div>
        <div class="gsc-ticks">
          ${LABELS.slice(0, -1).map((l, i) => `<span class="${i === (curEval?.levelIdx ?? -1) ? 'gsc-tick-active' : ''}">${l}</span>`).join('')}
          <span class="gsc-tick-wr">Rec.</span>
        </div>
        ${recordsRow}
      </div>`;
  }

  buildRealismBadge(ev) {
    const { realism, strengthCtx } = ev;
    const { tgtEval, wr, wrClass, absWr } = strengthCtx || {};
    const clsLabel = wrClass ? ` cls. ${wrClass} kg` : '';
    const msgs = {
      challenging:  `Nivel <b>${tgtEval?.level}</b> — dificil, dar atins de sportivi dedicați.`,
      exceptional:  `Nivel <b>Elită</b> — top 5% dintre cei care se antrenează. Extraordinar.`,
      world_class:  `Aproape de <b>recordul${clsLabel}</b> (drug-tested raw: ${wr} kg). Teritoriu de campion.`,
      impossible:   `Depășești <b>recordul absolut al omenirii</b>${absWr ? ` (${absWr} kg, echipat)` : ''}. Revizuiește ținta.`,
    };
    const tone = realism === 'impossible' ? 'danger' : realism === 'world_class' ? 'warn' : 'info';
    const msg = msgs[realism];
    if (!msg) return '';
    return `<div class="goal-realism goal-realism-${tone}"><span class="goal-realism-dot"></span>${msg}</div>`;
  }

  forecastTone(status, realism) {
    if (realism === 'impossible') return 'wait';
    return (status === 'on_track' || status === 'done') ? 'ok' : 'wait';
  }

  forecastText(ev, unit) {
    switch (ev.status) {
      case 'done':
        return '🎉 Atins! Felicitări — pune-ți o țintă nouă.';
      case 'need_data':
        return `Mai loghează ${ev.needed} ${ev.needed === 1 ? 'sesiune' : 'sesiuni'} cu acest exercițiu ca să estimăm — nu inventăm o dată.`;
      case 'stalled':
        return 'Ritm plat momentan — continuă și reevaluăm pronosticul.';
      case 'slow':
        return `În ritmul actual (+${formatNum(ev.slopePerWeek)} ${unit}/săpt.) e prea lent pentru o estimare clară.`;
      case 'on_track': {
        const luna = new Date(ev.etaTs).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
        return `<b>Pronostic:</b> în ritmul actual (+${formatNum(ev.slopePerWeek)} ${unit}/săpt.), estimat ~ <b>${luna}</b>.`;
      }
      default:
        return '';
    }
  }

  attachEventListeners(onStartNext, onViewProgram, onEditPrefs, explore = {}) {
    document.querySelector('#btn-start-next').addEventListener('click', () => {
      onStartNext?.();
    });

    document.querySelector('#btn-view-program').addEventListener('click', () => {
      onViewProgram?.();
    });

    document.querySelector('#btn-edit-prefs').addEventListener('click', () => {
      onEditPrefs?.();
    });

    document.querySelector('#card-calendar').addEventListener('click', () => explore.onOpenCalendar?.());
    document.querySelector('#card-progres').addEventListener('click', () => explore.onOpenStats?.('progres'));
    document.querySelector('#card-recorduri').addEventListener('click', () => explore.onOpenStats?.('recorduri'));
    document.querySelector('#card-realizari').addEventListener('click', () => explore.onOpenAchievements?.());
    document.querySelector('#card-skand').addEventListener('click', () => explore.onOpenSkand?.());

    document.querySelector('#btn-add-goal')?.addEventListener('click', () => explore.onAddGoal?.());
    this.container.querySelectorAll('.goal-del').forEach(btn => {
      btn.addEventListener('click', () => explore.onDeleteGoal?.(btn.dataset.goalId));
    });
  }
}
