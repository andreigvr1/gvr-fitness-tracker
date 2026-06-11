// Renders the workout logging view (today) with full session management

import { ICONS, SKIP_REASONS } from '../utils/Constants.js';
import { ico, getSkipReasonLabel } from '../utils/UIHelpers.js';
import { ProgressionEngine } from '../engines/ProgressionEngine.js';
import { loadTemplate } from '../utils/TemplateLoader.js';

export class WorkoutRenderer {
  constructor(container, session, program, profile, antrenamente = []) {
    this.container = container;
    this.session = session;
    this.program = program;
    this.profile = profile;
    this.antrenamente = antrenamente;
    this.progressionEngine = new ProgressionEngine();
    this.resolved = new Array(session.exercitii.length).fill(false);
    this.openIdx = 0;
  }

  async render(onSessionSaved, onGoBack) {
    try {
      const template = await loadTemplate('today');
      this.container.innerHTML = '';
      this.container.appendChild(template);

      const day = this.program.zile[this.session.zi_index];

      // Populate header and tabs
      document.getElementById('ex-counter').textContent = `0 / ${day.exercitii.length}`;
      document.getElementById('tpl-day-meta').textContent =
        `${day.tip.toUpperCase()} · Ziua ${this.session.zi_index + 1} din ${this.program.zile.length}`;
      document.getElementById('tpl-day-title').textContent = day.label;

      // Populate day tabs
      const tabsContainer = document.getElementById('tpl-day-tabs');
      tabsContainer.innerHTML = this.program.zile.map((d, i) => `
        <button class="day-tab ${i === this.session.zi_index ? 'active' : ''}" data-day="${i}">${d.label}</button>`).join('');

      // Populate exercises
      const logList = document.getElementById('log-list');
      logList.innerHTML = day.exercitii.map((ex, i) => this.buildExerciseHTML(ex, i)).join('');

      this.attachEventListeners(onSessionSaved, onGoBack);
      this.openExercise(0);
    } catch (error) {
      console.error('Error rendering workout:', error);
    }
  }

  buildExerciseHTML(ex, exIdx) {
    const LOWER_PATTERNS = new Set(['squat','hinge','unilateral picior','flexie genunchi','izolare-fesieri','izolare-gambe']);
    const isLowerBody        = LOWER_PATTERNS.has(ex.pattern);
    const isBodyweight       = ex.echipament?.every(e => e === 'corp') ?? false;
    const hasCenturaGreutati = this.profile.echipament?.includes('centura_greutati') ?? false;

    const rec = this.progressionEngine.getRecommendation(
      ex.id,
      ex.rep_min,
      ex.rep_max,
      this.antrenamente,
      this.profile.experienta,
      { isLowerBody, isBodyweight, hasCenturaGreutati, gen: this.profile.gen }
    );
    const suggestKg = rec.kg || '';
    const isStatic = ex.reguli_speciale?.includes('timp');
    const hasTempo = ex.reguli_speciale?.includes('tempo 3-1-3');
    const VALGUS_PATTERNS = new Set(['squat','unilateral picior','flexie genunchi']);
    const showValgusCue  = this.profile.gen === 'feminin' && VALGUS_PATTERNS.has(ex.pattern);

    const setsHTML = Array.from({ length: ex.seturi }, (_, si) => `
      <div class="log-set" id="set-${exIdx}-${si}" data-done="0">
        <span class="set-num">S${si + 1}</span>
        <div class="set-field-group">
          <button class="step-btn" data-target="w-${exIdx}-${si}" data-step="-2.5">−</button>
          <div class="set-field-wrap">
            <input id="w-${exIdx}-${si}" class="set-input" type="number" inputmode="decimal"
              value="${suggestKg}" min="0" step="2.5" placeholder="kg">
            <span class="set-field-lbl">kg</span>
          </div>
          <button class="step-btn" data-target="w-${exIdx}-${si}" data-step="2.5">+</button>
        </div>
        <span class="set-x">×</span>
        <div class="set-field-group">
          <button class="step-btn" data-target="r-${exIdx}-${si}" data-step="-1">−</button>
          <div class="set-field-wrap">
            <input id="r-${exIdx}-${si}" class="set-input set-reps" type="number" inputmode="numeric"
              value="${ex.rep_min}" min="1" step="1" placeholder="${isStatic ? 'sec' : 'rep'}">
            <span class="set-field-lbl">${isStatic ? 's' : 'rep'}</span>
          </div>
          <button class="step-btn" data-target="r-${exIdx}-${si}" data-step="1">+</button>
        </div>
        <div class="set-result-btns">
          <button class="set-ok"   data-ex="${exIdx}" data-set="${si}">${ICONS.check}</button>
          <button class="set-fail" data-ex="${exIdx}" data-set="${si}">${ICONS.x}</button>
        </div>
      </div>`).join('');

    return `
      <div class="log-ex-card" id="ex-card-${exIdx}" data-ex-idx="${exIdx}">
        <div class="log-ex-header" data-toggle="${exIdx}">
          <div class="log-ex-status" id="ex-status-${exIdx}">○</div>
          <div class="log-ex-info">
            <div class="log-ex-name">${ex.nume}</div>
            <div class="log-ex-meta">${ex.seturi} serii · ${ex.rep_min}${ex.rep_max !== ex.rep_min ? '–' + ex.rep_max : ''} ${isStatic ? 'sec' : 'rep'} · pauză ${ex.pauza_sec}s</div>
          </div>
          <button class="ex-skip-btn" data-ex="${exIdx}">${ICONS.skip}<span>Sari</span></button>
          <div class="log-ex-chevron" id="chev-${exIdx}">▾</div>
        </div>
        <div class="log-ex-body" id="ex-body-${exIdx}">
          ${rec.tip === 'calibrare'
        ? `<div class="rec-banner rec-calibrare">${ico('flag')}<span>${rec.mesaj}</span></div>`
        : rec.tip === 'creste'
          ? `<div class="rec-banner rec-creste">${ico('up')}<span>${rec.mesaj}</span></div>`
          : rec.tip === 'scade'
            ? `<div class="rec-banner rec-regresia">${ico('down')}<span>${rec.mesaj}</span></div>`
            : `<div class="rec-banner rec-info">${ico('arrow')}<span>${rec.mesaj}</span></div>`}
          ${hasTempo ? `<div class="tempo-explain">${ico('timer')}<span>Tempo 3-1-3 = 3 sec coborâre · 1 sec pauză jos · 3 sec ridicare</span></div>` : ''}
          ${showValgusCue ? `<div class="tempo-explain cue-valgus">${ico('flag')}<span>Menține genunchii deasupra degetelor mari — evită prăbușirea spre interior.</span></div>` : ''}
          <div class="log-ex-desc">${ex.descriere}</div>
          <div class="log-sets-list">${setsHTML}</div>
        </div>
      </div>`;
  }

  openExercise(idx) {
    document.querySelectorAll('.log-ex-body').forEach((b, i) => {
      b.style.display = i === idx ? 'block' : 'none';
      const chev = document.getElementById(`chev-${i}`);
      if (chev) chev.textContent = i === idx ? '▴' : '▾';
    });
    this.openIdx = idx;
  }

  updateProgress() {
    const done = this.resolved.filter(Boolean).length;
    document.getElementById('ex-counter').textContent = `${done} / ${this.program.zile[this.session.zi_index].exercitii.length}`;
    const fill = document.getElementById('today-progress-fill');
    if (fill) fill.style.width = `${(done / this.program.zile[this.session.zi_index].exercitii.length) * 100}%`;
  }

  markResolved(exIdx) {
    this.resolved[exIdx] = true;
    this.updateProgress();
    setTimeout(() => {
      if (this.resolved.every(Boolean)) this.finishDay();
    }, 350);
  }

  finishDay() {
    const pendingSkips = this.session.getPendingSkips();
    if (pendingSkips.length) {
      this.showSkipReasonScreen(pendingSkips);
    } else {
      this.showDoneFooter();
    }
  }

  showDoneFooter() {
    const skipped = this.session.exercitii.filter(e => e.skip).length;
    const footer = document.getElementById('today-footer');
    footer.style.display = 'flex';
    if (skipped > 0) {
      const banner = document.getElementById('done-banner');
      banner.innerHTML = `${ico('check')}<span>Antrenament finalizat (${skipped} ${skipped === 1 ? 'exercițiu sărit' : 'exerciții sărite'})</span>`;
      banner.classList.add('done-banner-partial');
    }
  }

  showSkipReasonScreen(pendingSkipIndices) {
    const day = this.program.zile[this.session.zi_index];
    const pendingSkips = pendingSkipIndices.map(idx => ({
      idx,
      sessionEx: this.session.exercitii[idx],
      dayEx: day.exercitii[idx],
    }));

    const list = document.getElementById('log-list');
    list.style.padding = '0';
    list.innerHTML = `
      <div class="skip-reason-wrap">
        <div class="skip-reason-title">De ce ai sărit ${pendingSkips.length === 1 ? 'exercițiul' : 'exercițiile'}?</div>
        <div class="skip-reason-sub">Răspunsul tău ajută aplicația să îți adapteze antrenamentele viitoare.</div>
        ${pendingSkips.map(item => `
          <div class="skip-ex-block">
            <div class="skip-ex-name">${item.dayEx.nume}</div>
            <div class="skip-reasons-grid">
              ${SKIP_REASONS.map(r => `
                <button class="skip-reason-opt" data-ex="${item.idx}" data-motiv="${r.id}">
                  <span class="skip-r-radio"></span>
                  <span class="skip-r-label">${r.label}</span>
                </button>`).join('')}
            </div>
          </div>`).join('')}
        <button class="btn btn-primary btn-full" id="btn-skip-done" style="margin-top:8px" disabled>Continuă →</button>
      </div>`;

    const selected = {};
    list.querySelectorAll('.skip-reason-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const exIdx = btn.dataset.ex;
        list.querySelectorAll(`[data-ex="${exIdx}"].skip-reason-opt`).forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selected[exIdx] = {
          motiv: btn.dataset.motiv,
          label: getSkipReasonLabel(btn.dataset.motiv),
        };
        document.getElementById('btn-skip-done').disabled = !pendingSkips.every(item => selected[item.idx]);
      });
    });

    document.getElementById('btn-skip-done').addEventListener('click', () => {
      for (const [idx, reason] of Object.entries(selected)) {
        this.session.setSkipReason(+idx, reason.motiv, reason.label);
      }
      list.innerHTML = '';
      list.style.padding = '';
      this.showDoneFooter();
    });
  }

  handleSetResult(exIdx, setIdx, reusit) {
    const row = document.getElementById(`set-${exIdx}-${setIdx}`);
    if (!row || row.dataset.done === '1') return;

    const kg = parseFloat(document.getElementById(`w-${exIdx}-${setIdx}`).value) || 0;
    const rep = parseInt(document.getElementById(`r-${exIdx}-${setIdx}`).value) || 0;

    this.session.markSetDone(exIdx, setIdx, kg, rep, reusit);

    row.dataset.done = '1';
    row.classList.add('set-flash');
    row.addEventListener('animationend', () => { row.classList.remove('set-flash'); row.style.opacity = '0.62'; }, { once: true });
    row.querySelector('.set-ok').style.cssText = reusit ? 'background:var(--green);color:#0d0d0f;border-color:var(--green)' : '';
    row.querySelector('.set-fail').style.cssText = !reusit ? 'background:var(--orange);color:#0d0d0f;border-color:var(--orange)' : '';

    const next = document.getElementById(`set-${exIdx}-${setIdx + 1}`);
    if (next && next.dataset.done !== '1') {
      document.getElementById(`w-${exIdx}-${setIdx + 1}`).value = kg || '';
      document.getElementById(`r-${exIdx}-${setIdx + 1}`).value = rep || this.program.zile[this.session.zi_index].exercitii[exIdx].rep_min;
    }

    const allSetsDone = this.session.exercitii[exIdx].serii.every(s => s.reusit !== null);
    if (allSetsDone) {
      const stat = document.getElementById(`ex-status-${exIdx}`);
      const allOk = this.session.exercitii[exIdx].serii.every(s => s.reusit);
      stat.innerHTML = allOk ? ICONS.check : ICONS.x;
      stat.style.color = allOk ? 'var(--green)' : 'var(--orange)';
      stat.style.borderColor = allOk ? 'var(--green)' : 'var(--orange)';
      document.getElementById(`ex-card-${exIdx}`).classList.add('is-done');
      this.markResolved(exIdx);
      if (exIdx + 1 < this.program.zile[this.session.zi_index].exercitii.length && !this.resolved[exIdx + 1]) {
        setTimeout(() => this.openExercise(exIdx + 1), 300);
      }
    }
  }

  attachEventListeners(onSessionSaved, onGoBack) {
    const day = this.program.zile[this.session.zi_index];

    // Exercise header collapse/expand
    this.container.querySelectorAll('[data-toggle]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.ex-skip-btn')) return;
        this.openExercise(+el.dataset.toggle);
      });
    });

    // Stepper buttons
    this.container.querySelectorAll('.step-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.dataset.target);
        const cur = parseFloat(inp.value) || 0;
        inp.value = Math.max(0, Math.round((cur + +btn.dataset.step) * 10) / 10);
      });
    });

    // Skip button
    this.container.querySelectorAll('.ex-skip-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const exIdx = +btn.dataset.ex;
        if (this.resolved[exIdx]) return;

        this.session.skipExercise(exIdx);

        const card = document.getElementById(`ex-card-${exIdx}`);
        const body = document.getElementById(`ex-body-${exIdx}`);
        const stat = document.getElementById(`ex-status-${exIdx}`);
        const chev = document.getElementById(`chev-${exIdx}`);

        card.classList.add('ex-skipped');
        stat.innerHTML = ICONS.skip;
        stat.style.color = 'var(--t2)';
        stat.style.borderColor = 'var(--t3)';
        body.style.display = 'none';
        chev.textContent = '';
        btn.style.display = 'none';

        this.markResolved(exIdx);
      });
    });

    // Set result buttons
    this.container.querySelectorAll('.set-ok').forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleSetResult(+btn.dataset.ex, +btn.dataset.set, true);
      });
    });

    this.container.querySelectorAll('.set-fail').forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleSetResult(+btn.dataset.ex, +btn.dataset.set, false);
      });
    });

    // Back buttons
    this.container.querySelector('#back-to-prog').addEventListener('click', () => {
      onGoBack?.();
    });

    this.container.querySelector('#back-prog-2').addEventListener('click', () => {
      onGoBack?.();
    });

    // Day tabs
    this.container.querySelectorAll('.day-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const event = new CustomEvent('switch-day', { detail: { dayIdx: +tab.dataset.day } });
        this.container.dispatchEvent(event);
      });
    });

    // Save session
    const saveBtn = this.container.querySelector('#btn-save-session');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.session.zi_complet = true;
        saveBtn.textContent = 'Salvat ✓';
        saveBtn.disabled = true;
        setTimeout(() => {
          onSessionSaved?.(this.session.serialize());
        }, 700);
      });
    }
  }
}
