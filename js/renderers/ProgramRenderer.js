// Renders the program view with splits and day cards

import { ICONS } from '../utils/Constants.js';
import { ico } from '../utils/UIHelpers.js';
import { getExercisesByIds, getSplitsForZile } from '../generator.js';
import { loadTemplate } from '../utils/TemplateLoader.js';
import { ExerciseManager } from '../utils/ExerciseManager.js';

export class ProgramRenderer {
  constructor(container, program, profile, antrenamente = [], programSalvat = false) {
    this.container = container;
    this.program = program;
    this.profile = profile;
    this.antrenamente = antrenamente;
    this.programSalvat = programSalvat;
    this.allExercises = [];
    this.currentDayForAdd = null;
  }

  async render(onSplitChange, onSave, onBack) {
    try {
      // Load all exercises for add/remove functionality
      this.allExercises = await ExerciseManager.loadAll();
      // Store callbacks for re-rendering
      this.onSplitChange = onSplitChange;
      this.onSave = onSave;
      this.onBack = onBack;

      const template = await loadTemplate('program');
      this.container.innerHTML = '';
      this.container.appendChild(template);

      // Populate split info
      document.getElementById('tpl-split-name').textContent = this.program.split_label;
      document.getElementById('tpl-split-desc').textContent = this.program.split_desc;

      // Populate split options
      const splitOpts = document.getElementById('tpl-split-opts');
      const splits = getSplitsForZile(this.profile.zile, this.profile.experienta, this.profile.obiectiv)
        .filter(s => s.id !== this.program.split_id);
      splitOpts.innerHTML = splits.map(s => `
        <button class="split-opt" data-split="${s.id}">
          <span class="so-label">${s.recomandat ? '★ ' : ''}${s.label}</span>
          <span class="so-desc">${s.desc}</span>
        </button>`).join('');

      // Mod simplu (program custom): ascundem „alte variante" — schimbarea split-ului
      // ar regenera și ar șterge ce a construit utilizatorul.
      if (this.program.split_id === 'custom') {
        splitOpts.style.display = 'none';
        if (splitOpts.previousElementSibling) splitOpts.previousElementSibling.style.display = 'none';
      }

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
              <div class="dex-actions">
                ${ex.alternative?.length ? `<button class="dex-swap-btn" data-day="${di}" data-ex="${ei}">${ICONS.swap}</button>` : ''}
                <button class="dex-delete-btn" data-day="${di}" data-ex="${ei}" title="Șterge exercițiu">${ICONS.x}</button>
              </div>
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
            <button class="btn-add-exercise" data-day="${di}">+ Adaugă exercițiu</button>
          </div>`;
      }).join('');

      // Update button icons and visibility
      document.getElementById('btn-save-program').firstElementChild.innerHTML = ICONS.check;
      const backBtn = document.getElementById('btn-to-dashboard');
      backBtn.firstElementChild.innerHTML = ICONS.back;

      this.attachEventListeners(onSplitChange, onSave, onBack);
    } catch (error) {
      console.error('Error rendering program:', error);
    }
  }

  attachEventListeners(onSplitChange, onSave, onBack) {
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
            container.dispatchEvent(new CustomEvent('program-updated', { 
              detail: { program: this.program.serialize() } 
            }));
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

    // Delete exercise buttons
    container.querySelectorAll('.dex-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const dayIdx = +btn.dataset.day;
        const exIdx = +btn.dataset.ex;
        const ex = this.program.zile[dayIdx].exercitii[exIdx];
        const ok = await this.confirmDelete(ex?.nume || 'Exercițiul');
        if (ok) {
          this.program.zile[dayIdx].exercitii.splice(exIdx, 1);
          container.dispatchEvent(new CustomEvent('program-updated', { 
            detail: { program: this.program.serialize() } 
          }));
        }
      });
    });

    // Add exercise buttons
    container.querySelectorAll('.btn-add-exercise').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentDayForAdd = +btn.dataset.day;
        this.showAddExerciseModal();
      });
    });

    // Modal close buttons
    const closeBtn = container.querySelector('#close-add-exercise');
    if (closeBtn) closeBtn.innerHTML = ICONS.x;
    const cancelBtn = container.querySelector('#cancel-add-exercise');
    const overlay = container.querySelector('.modal-overlay');
    [closeBtn, cancelBtn, overlay].forEach(el => {
      if (el) el.addEventListener('click', () => this.hideAddExerciseModal());
    });

    // Modal filters
    const muscleSelect = container.querySelector('#filter-muscle-group');
    const typeSelect = container.querySelector('#filter-exercise-type');
    const exSelect = container.querySelector('#filter-exercise');

    if (muscleSelect) {
      muscleSelect.addEventListener('change', () => this.updateExerciseList());
    }
    if (typeSelect) {
      typeSelect.addEventListener('change', () => this.updateExerciseList());
    }
    if (exSelect) {
      exSelect.addEventListener('change', () => this.updateExercisePreview());
    }

    // Confirm add exercise
    const confirmBtn = container.querySelector('#confirm-add-exercise');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.confirmAddExercise(onSave, onBack));
    }

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
        onBack?.();
      });
    }
  }

  confirmDelete(name) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content modal-confirm">
          <div class="confirm-ico">${ICONS.trash}</div>
          <h2 class="confirm-title">Ștergi exercițiul?</h2>
          <p class="confirm-text"><b>${name}</b> dispare din această zi. Poți să-l adaugi din nou oricând.</p>
          <div class="confirm-actions">
            <button class="btn btn-ghost" data-act="cancel">Anulează</button>
            <button class="btn btn-primary" data-act="ok">Șterge</button>
          </div>
        </div>`;
      this.container.appendChild(modal);
      const done = (val) => { modal.remove(); resolve(val); };
      modal.querySelector('[data-act="cancel"]').addEventListener('click', () => done(false));
      modal.querySelector('.modal-overlay').addEventListener('click', () => done(false));
      modal.querySelector('[data-act="ok"]').addEventListener('click', () => done(true));
    });
  }

  showAddExerciseModal() {
    const modal = this.container.querySelector('.modal-add-exercise');
    if (!modal) return;
    modal.style.display = 'flex';

    // Populate muscle group dropdown
    const muscleSelect = this.container.querySelector('#filter-muscle-group');
    const muscleGroups = ExerciseManager.getMuscleGroups(this.allExercises);
    muscleSelect.innerHTML = '<option value="">— Selectează grupa —</option>' +
      muscleGroups.map(m => `<option value="${m}">${m}</option>`).join('');

    // Reset filters
    muscleSelect.value = '';
    this.container.querySelector('#filter-exercise-type').value = '';
    this.container.querySelector('#filter-exercise').innerHTML = '<option value="">— Selectează exercițiu —</option>';
    this.hideExercisePreview();
  }

  hideAddExerciseModal() {
    const modal = this.container.querySelector('.modal-add-exercise');
    if (modal) modal.style.display = 'none';
  }

  updateExerciseList() {
    const muscleGroup = this.container.querySelector('#filter-muscle-group').value;
    const type = this.container.querySelector('#filter-exercise-type').value;
    const exSelect = this.container.querySelector('#filter-exercise');

    const filtered = ExerciseManager.filterByMuscleAndType(this.allExercises, muscleGroup, type);
    exSelect.innerHTML = '<option value="">— Selectează exercițiu —</option>' +
      filtered.map(ex => `<option value="${ex.id}">${ex.nume}</option>`).join('');

    this.hideExercisePreview();
  }

  updateExercisePreview() {
    const exId = this.container.querySelector('#filter-exercise').value;
    if (!exId) {
      this.hideExercisePreview();
      return;
    }

    const ex = this.allExercises.find(e => e.id === exId);
    if (!ex) return;

    this.container.querySelector('#prev-name').textContent = ex.nume;
    this.container.querySelector('#prev-desc').textContent = ex.descriere || '';
    this.container.querySelector('#ex-preview').style.display = 'block';
    this.container.querySelector('#confirm-add-exercise').disabled = false;
  }

  hideExercisePreview() {
    this.container.querySelector('#ex-preview').style.display = 'none';
    this.container.querySelector('#confirm-add-exercise').disabled = true;
  }

  confirmAddExercise(onSave, onBack) {
    const exId = this.container.querySelector('#filter-exercise').value;
    if (!exId || this.currentDayForAdd === null) return;

    const ex = this.allExercises.find(e => e.id === exId);
    if (!ex) return;

    // Add exercise to the day
    const newEx = {
      id: ex.id,
      nume: ex.nume,
      seturi: 3,
      rep_min: 8,
      rep_max: 12,
      tip: ex.tip,
      nivel: ex.nivel
    };

    this.program.zile[this.currentDayForAdd].exercitii.push(newEx);
    
    this.hideAddExerciseModal();
    this.container.dispatchEvent(new CustomEvent('program-updated', { 
      detail: { program: this.program.serialize() } 
    }));
  }
}
