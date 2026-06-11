// Renders the program view with splits and day cards

import { ICONS } from '../utils/Constants.js';
import { ico } from '../utils/UIHelpers.js';
import { getExercisesByIds, getSplitsForZile } from '../generator.js';
import { loadTemplate } from '../utils/TemplateLoader.js';

export class ProgramRenderer {
  constructor(container, program, profile, antrenamente = []) {
    this.container = container;
    this.program = program;
    this.profile = profile;
    this.antrenamente = antrenamente;
  }

  async render(onSplitChange, onRegenerate, onSave, onViewProgram) {
    try {
      const template = await loadTemplate('program');
      this.container.innerHTML = '';
      this.container.appendChild(template);

      // Populate split info
      document.getElementById('tpl-split-name').textContent = this.program.split_label;
      document.getElementById('tpl-split-desc').textContent = this.program.split_desc;

      // Populate split options
      const splitOpts = document.getElementById('tpl-split-opts');
      const splits = getSplitsForZile(this.profile.zile);
      splitOpts.innerHTML = splits.map(s => `
        <button class="split-opt ${s.id === this.program.split_id ? 'active' : ''}" data-split="${s.id}">
          <span class="so-label">${s.recomandat ? '★ ' : ''}${s.label}</span>
          <span class="so-desc">${s.desc}</span>
        </button>`).join('');

      // Populate days
      const completedDays = new Set(
        this.antrenamente.filter(a => a.zi_complet).map(a => `${a.zi_index}`)
      );
      const daysList = document.getElementById('tpl-days-list');
      daysList.innerHTML = this.program.zile.map((day, di) => {
        const done = completedDays.has(`${di}`);
        const exsHTML = day.exercitii.map((ex, ei) => `
          <div class="day-ex" id="dex-${di}-${ei}">
            <div class="dex-main">
              <div class="dex-info">
                <span class="dex-name">${ex.nume}</span>
                <span class="dex-sets">${ex.seturi}×${ex.rep_min}${ex.rep_max !== ex.rep_min ? '–' + ex.rep_max : ''}</span>
              </div>
              ${ex.alternative?.length ? `<button class="dex-swap-btn" data-day="${di}" data-ex="${ei}">${ICONS.swap}</button>` : ''}
            </div>
            <div class="dex-alts" id="alts-${di}-${ei}" style="display:none"></div>
          </div>`).join('');

        return `
          <div class="day-card ${done ? 'day-done' : ''}">
            <div class="day-header">
              <div class="day-num ${done ? 'day-num-done' : ''}">${done ? `${ico('check')}` : di + 1}</div>
              <div>
                <div class="day-type">${day.tip.toUpperCase()}</div>
                <div class="day-label">${day.label}</div>
              </div>
              <button class="btn-start-day" data-day="${di}">${ICONS.play}</button>
            </div>
            <div class="day-exs">${exsHTML}</div>
          </div>`;
      }).join('');

      // Update button icons and visibility
      document.getElementById('btn-save-program').firstElementChild.innerHTML = ICONS.check;
      document.getElementById('btn-regenerate').firstElementChild.innerHTML = ICONS.refresh;
      const backBtn = document.getElementById('btn-to-dashboard');
      if (this.profile?.program_salvat) {
        backBtn.style.display = 'block';
        backBtn.firstElementChild.innerHTML = ICONS.back;
      }

      this.attachEventListeners(onSplitChange, onRegenerate, onSave, onViewProgram);
    } catch (error) {
      console.error('Error rendering program:', error);
    }
  }

  attachEventListeners(onSplitChange, onRegenerate, onSave, onViewProgram) {
    const container = this.container;

    // Split switching
    container.querySelectorAll('.split-opt').forEach(btn => {
      btn.addEventListener('click', async () => {
        container.querySelector('.days-list').innerHTML = '<div class="loading">Se generează...</div>';
        try {
          await onSplitChange(btn.dataset.split);
        } catch (e) {
          console.error(e);
        }
      });
    });

    // Regenerate exercises
    const regBtn = container.querySelector('#btn-regenerate');
    if (regBtn) {
      regBtn.addEventListener('click', async () => {
        regBtn.disabled = true;
        const originalText = regBtn.innerHTML;
        regBtn.textContent = 'Se regenerează...';
        try {
          await onRegenerate();
        } catch (e) {
          regBtn.disabled = false;
          regBtn.innerHTML = originalText;
        }
      });
    }

    // Exercise swapping
    container.querySelectorAll('.dex-swap-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const di = +btn.dataset.day;
        const ei = +btn.dataset.ex;
        const box = document.getElementById(`alts-${di}-${ei}`);

        if (box.style.display !== 'none') {
          box.style.display = 'none';
          return;
        }

        box.innerHTML = '<div class="alts-loading">Se încarcă...</div>';
        box.style.display = 'block';

        const ex = this.program.zile[di].exercitii[ei];
        const alts = await getExercisesByIds(ex.alternative);

        if (!alts.length) {
          box.innerHTML = '<div class="alts-empty">Nicio alternativă.</div>';
          return;
        }

        box.innerHTML = alts.map(a => `
          <button class="alt-opt" data-id="${a.id}" data-day="${di}" data-ex="${ei}">
            <span class="alt-name">${a.nume}</span>
            <span class="alt-meta">${a.tip} · niv.${a.nivel}</span>
          </button>`).join('');

        box.querySelectorAll('.alt-opt').forEach(altBtn => {
          altBtn.addEventListener('click', async () => {
            const [newEx] = await getExercisesByIds([altBtn.dataset.id]);
            if (!newEx) return;
            await this.program.swapExercise(+di, +ei, newEx.id);
            onViewProgram?.();
          });
        });
      });
    });

    // Start day buttons
    container.querySelectorAll('.btn-start-day').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const dayIdx = +btn.dataset.day;
        const event = new CustomEvent('start-workout', { detail: { dayIdx } });
        container.dispatchEvent(event);
      });
    });

    // Save program
    const saveBtn = container.querySelector('#btn-save-program');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        onSave?.();
      });
    }

    // Back to dashboard
    const backBtn = container.querySelector('#btn-to-dashboard');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const event = new CustomEvent('view-dashboard');
        container.dispatchEvent(event);
      });
    }
  }
}
