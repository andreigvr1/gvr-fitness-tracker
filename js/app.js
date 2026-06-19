// ── Imports ──────────────────────────────────────────────────────────────────
import { loadData, saveData, clearData } from './storage.js';
import { generateProgram, getRecommendedSplit, getSplitsForZile, getExercisesByIds } from './generator.js';
import { initOnboarding } from './onboarding.js';

// Models
import { WorkoutSession } from './models/WorkoutSession.js';
import { Program } from './models/Program.js';

// Engines
import { ProgressionEngine } from './engines/ProgressionEngine.js';
import { AdaptiveEngine } from './engines/AdaptiveEngine.js';
import { DeloadEngine } from './engines/DeloadEngine.js';
import { StatsEngine } from './engines/StatsEngine.js';

// Renderers
import { ProgramRenderer } from './renderers/ProgramRenderer.js';
import { DashboardRenderer } from './renderers/DashboardRenderer.js';
import { WorkoutRenderer } from './renderers/WorkoutRenderer.js';
import { StatsRenderer } from './renderers/StatsRenderer.js';
import { CalendarRenderer } from './renderers/CalendarRenderer.js';
import { AchievementsRenderer } from './renderers/AchievementsRenderer.js';
import { MeasurementsRenderer } from './renderers/MeasurementsRenderer.js';
import { initWelcome, initChoice, initDaysPicker } from './welcome.js';

// Skandenberg mini-onboarding (configurare; modulul rămâne dezactivat)
import { initSkandConfig } from './skandenberg.js';

// Utilities
import { ViewManager } from './utils/ViewManager.js';
import { ICONS, SKIP_REASONS } from './utils/Constants.js';
import { getNextDayIdx } from './utils/UIHelpers.js';
import { bmiPanelHTML } from './utils/BodyViz.js';
import { exportData, parseBackup } from './utils/DataTransfer.js';

// ── Module State ──────────────────────────────────────────────────────────────
let viewManager = null;
let adaptiveEngine = null;
let deloadEngine = null;
let currentSession = null;

// ── Deload (săptămână de descărcare) ────────────────────────────────────────
function isDeloadActive(data) {
  return !!data?.deload?.activ;
}
// Oferim deload doar dacă: detectăm oboseală, nu e deja activ, și nu a fost refuzat în ultimul ciclu.
function deloadOffer(data) {
  if (isDeloadActive(data)) return null;
  const { program, profile, antrenamente = [] } = data;
  if (!program) return null;
  const refuzatLa = data.deload?.refuzat_la;
  if (refuzatLa != null && (antrenamente.length - refuzatLa) < program.zile.length) return null;
  return deloadEngine.detectFatigue(antrenamente, program, profile);
}
function activateDeload() {
  const d = loadData();
  d.deload = { activ: true, sesiuni_ramase: d.program.zile.length };
  saveData(d);
  return d;
}
function declineDeload() {
  const d = loadData();
  d.deload = { activ: false, refuzat_la: (d.antrenamente || []).length };
  saveData(d);
  return d;
}
// La salvarea unei sesiuni de descărcare: scade contorul; la 0 → gata.
function consumeDeloadSession(d) {
  if (!d.deload?.activ) return;
  d.deload.sesiuni_ramase = (d.deload.sesiuni_ramase || 1) - 1;
  if (d.deload.sesiuni_ramase <= 0) d.deload = { activ: false };
}

// ── View Rendering (delegated to Renderers) ──────────────────────────────────
async function renderProgram(data) {
  const { program, profile, antrenamente = [] } = data;
  const container = document.getElementById('view-program');
  const programObj = new Program(program);
  const suggestions = adaptiveEngine.analyzeSkips(antrenamente, program);

  const renderer = new ProgramRenderer(container, programObj, profile, antrenamente, data.program_salvat);
  await renderer.render(
    // onSplitChange
    async (splitId) => {
      try {
        const newProgram = await generateProgram(profile, splitId);
        const d = loadData();
        d.program = newProgram;
        saveData(d);
        await renderProgram(d);
      } catch (e) {
        console.error(e);
      }
    },
    // onSave
    () => {
      const d = loadData();
      d.program_salvat = true;
      saveData(d);
      viewManager.updateNav('view-dashboard');
      renderDashboard(d);
      viewManager.showView('view-dashboard');
    },
    // onBack
    () => {
      renderDashboard(loadData());
      viewManager.showView('view-dashboard');
    }
  );

  // Deload: notă dacă e deja activ, altfel ofertă dacă detectăm oboseală sistemică.
  let deloadHTML = '';
  if (isDeloadActive(data)) {
    const ram = data.deload?.sesiuni_ramase ?? 0;
    deloadHTML = `
      <div class="adapt-item">
        <div class="adapt-msg">Ești în săptămâna de descărcare — ${ram} ${ram === 1 ? 'sesiune rămasă' : 'sesiuni rămase'}. Greutăți reduse și mai puține serii; revii la progresie normală după.</div>
      </div>`;
  } else {
    const fatigue = deloadOffer(data);
    if (fatigue) deloadHTML = `
      <div class="adapt-item">
        <div class="adapt-msg">Am observat că ai scăzut pe ${fatigue.count} exerciții de bază — semn de oboseală acumulată. Vrei o săptămână mai ușoară (mai puține serii, greutate redusă) ca să te recuperezi?</div>
        <div class="adapt-actions">
          <button class="adapt-btn" data-deload="accept">Da, ușurează</button>
          <button class="adapt-btn adapt-btn-ghost" data-deload="decline">Nu, continui</button>
        </div>
      </div>`;
  }

  // Show adaptive suggestions banner if any
  if (suggestions.length || deloadHTML) {
    const banner = document.createElement('div');
    banner.className = 'adapt-banner';
    banner.innerHTML = deloadHTML + suggestions.map(s => `
      <div class="adapt-item">
        <div class="adapt-msg">${s.mesaj}</div>
        ${s.actiune === 'swap' ? `<button class="adapt-btn" data-ex="${s.exId}">Înlocuiește</button>` : ''}
      </div>`).join('');
    container.querySelector('#prog-footer').before(banner);

    banner.querySelector('[data-deload="accept"]')?.addEventListener('click', async () => {
      await renderProgram(activateDeload());
    });
    banner.querySelector('[data-deload="decline"]')?.addEventListener('click', async () => {
      await renderProgram(declineDeload());
    });

    banner.querySelectorAll('.adapt-btn[data-ex]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const exId = btn.dataset.ex;
        const dayIdx = programObj.zile.findIndex(z => z.exercitii.some(e => e.id === exId));
        if (dayIdx === -1) return;
        const exIdx = programObj.zile[dayIdx].exercitii.findIndex(e => e.id === exId);
        const ex = programObj.zile[dayIdx].exercitii[exIdx];
        if (!ex.alternative?.length) return;
        await programObj.swapExercise(dayIdx, exIdx, ex.alternative[0]);
        const d = loadData();
        d.program = programObj.serialize();
        saveData(d);
        await renderProgram(d);
      });
    });
  }

  // Handle "start day" button from renderer
  container.addEventListener('start-workout', (e) => {
    renderToday(loadData(), e.detail.dayIdx);
    viewManager.showView('view-today');
  });

  // Setup program update listener for exercise modifications
  setupProgramUpdateListener();
}

// Handle program modifications (exercise add/delete/swap)
function setupProgramUpdateListener() {
  const container = document.getElementById('view-program');
  container.addEventListener('program-updated', async (e) => {
    const d = loadData();
    d.program = e.detail.program;
    saveData(d);
    await renderProgram(d);
  });
}

async function renderDashboard(data) {
  const { program, antrenamente = [], profile } = data;
  const goals = data.obiective || [];
  const container = document.getElementById('view-dashboard');
  const renderer = new DashboardRenderer(container, program, antrenamente, profile, goals);

  await renderer.render(
    // onStartNext
    () => {
      const nextIdx = getNextDayIdx(program, antrenamente);
      renderToday(data, nextIdx);
      viewManager.showView('view-today');
    },
    // onViewProgram
    () => {
      renderProgram(data);
      viewManager.showView('view-program');
    },
    // onEditPrefs
    () => {
      showEditProfileModal(loadData());
    },
    // explore cards
    {
      onOpenCalendar: () => renderCalendar(loadData()),
      onOpenStats:    (tab) => renderStatistici(loadData(), tab),
      onOpenSkand:    () => renderSkand(),
      onOpenAchievements: () => renderRealizari(loadData()),
      onAddGoal:      () => showAddGoalModal(),
      onDeleteGoal:   (id) => {
        const d = loadData();
        d.obiective = (d.obiective || []).filter(g => g.id !== id);
        saveData(d);
        renderDashboard(loadData());
      },
    }
  );
}

// Modal de adăugare obiectiv: alegi un exercițiu din program + tip (kg/rep) + ținta.
function showAddGoalModal() {
  const data = loadData();
  
  // Verifica limita de 3 obiective
  if ((data.obiective || []).length >= 3) {
    showInfoModal('Limita de obiective', 'Poți avea maxim 3 obiective active simultan. Șterge sau atinge un obiectiv ca să adaugi altul nou.');
    return;
  }

  // exercițiile unice din program (cele pe care le antrenezi)
  const seen = new Set();
  const exOptions = [];
  (data.program?.zile || []).forEach(zi => (zi.exercitii || []).forEach(ex => {
    if (!seen.has(ex.id)) {
      seen.add(ex.id);
      exOptions.push({ id: ex.id, nume: ex.nume, bw: ex.echipament?.every(e => e === 'corp') ?? false });
    }
  }));
  // Centura permite kg la exercițiile bodyweight (la fel ca la logare, spec cap. 7)
  const hasCentura = (data.profile?.echipament || []).includes('centura_greutati');

  if (!exOptions.length) {
    showInfoModal('Niciun exercițiu', 'Întâi salvează-ți un program, apoi poți pune obiective pe exercițiile din el.');
    return;
  }

  const ov = document.createElement('div');
  ov.className = 'modal';
  ov.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header"><h2>Obiectiv nou</h2><button class="modal-close" id="goal-x">×</button></div>
      <div class="modal-body">
        <div class="filter-group">
          <label for="goal-ex">Exercițiu</label>
          <select id="goal-ex" class="goal-select">
            ${exOptions.map(o => `<option value="${o.id}">${o.nume}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label>Tip de țintă</label>
          <div class="goal-tip-row">
            <button class="goal-tip-opt selected" data-tip="kg">Greutate (kg)</button>
            <button class="goal-tip-opt" data-tip="rep">Repetări</button>
          </div>
          <div class="goal-tip-note" id="goal-tip-note"></div>
        </div>
        <div class="filter-group">
          <label for="goal-target">Ținta (<span id="goal-unit">kg</span>)</label>
          <input id="goal-target" class="goal-target-input" type="number" inputmode="decimal" min="1" step="0.5" placeholder="ex. 100">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="goal-cancel">Anulează</button>
        <button class="btn btn-primary" id="goal-save">Salvează obiectivul</button>
      </div>
    </div>`;
  document.body.appendChild(ov);

  let tip = 'kg';
  const close = () => ov.remove();
  ov.querySelector('.modal-overlay').addEventListener('click', close);
  ov.querySelector('#goal-x').addEventListener('click', close);
  ov.querySelector('#goal-cancel').addEventListener('click', close);

  const kgBtn  = ov.querySelector('.goal-tip-opt[data-tip="kg"]');
  const repBtn = ov.querySelector('.goal-tip-opt[data-tip="rep"]');
  const note   = ov.querySelector('#goal-tip-note');

  const setTip = (t) => {
    tip = t;
    kgBtn.classList.toggle('selected', t === 'kg');
    repBtn.classList.toggle('selected', t === 'rep');
    ov.querySelector('#goal-unit').textContent = t === 'rep' ? 'rep' : 'kg';
    ov.querySelector('#goal-target').step = t === 'rep' ? '1' : '0.5';
  };

  // La exerciții pur cu greutatea corpului (fără centură) ținta e doar pe repetări.
  const applyExerciseConstraints = () => {
    const ex = exOptions.find(o => o.id === ov.querySelector('#goal-ex').value);
    const kgBlocked = ex?.bw && !hasCentura;
    kgBtn.disabled = kgBlocked;
    kgBtn.classList.toggle('disabled', kgBlocked);
    note.textContent = kgBlocked ? 'Exercițiu cu greutatea corpului — ținta e pe repetări.' : '';
    if (kgBlocked) setTip('rep');
  };

  kgBtn.addEventListener('click', () => { if (!kgBtn.disabled) setTip('kg'); });
  repBtn.addEventListener('click', () => setTip('rep'));
  ov.querySelector('#goal-ex').addEventListener('change', applyExerciseConstraints);
  applyExerciseConstraints();

  ov.querySelector('#goal-save').addEventListener('click', () => {
    const exId = ov.querySelector('#goal-ex').value;
    const nume = exOptions.find(o => o.id === exId)?.nume || exId;
    const tinta = parseFloat(ov.querySelector('#goal-target').value);
    if (!tinta || tinta <= 0) { ov.querySelector('#goal-target').focus(); return; }

    const d = loadData();
    d.obiective = d.obiective || [];
    d.obiective.push({
      id: 'g' + Date.now(),
      ex_id: exId, nume,
      tip_tinta: tip, tinta,
      creat_la: Date.now(),
    });
    saveData(d);
    close();
    renderDashboard(loadData());
  });
}

// Mic modal informativ (un singur buton).
function showInfoModal(title, msg) {
  const ov = document.createElement('div');
  ov.className = 'modal';
  ov.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header"><h2>${title}</h2></div>
      <div class="modal-body"><p class="import-warn">${msg}</p></div>
      <div class="modal-footer"><button class="btn btn-primary" id="info-ok">Am înțeles</button></div>
    </div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.querySelector('.modal-overlay').addEventListener('click', close);
  ov.querySelector('#info-ok').addEventListener('click', close);
}

// ── Statistici / Calendar / Skandenberg ───────────────────────────────────────
async function renderStatistici(data, tab = 'sumar') {
  const container = document.getElementById('view-statistici');
  const renderer = new StatsRenderer(container, data.program, data.antrenamente || [], data.profile || {}, data.masuratori || []);
  viewManager.showView('view-statistici');
  await renderer.render(tab);
}

async function renderCalendar(data) {
  const container = document.getElementById('view-calendar');
  const renderer = new CalendarRenderer(container, data.antrenamente || [], data.obiective || []);
  viewManager.showView('view-calendar');
  await renderer.render(() => {
    renderDashboard(loadData());
    viewManager.showView('view-dashboard');
  });
}

function renderSkand() {
  const container = document.getElementById('view-skand');
  viewManager.showView('view-skand');
  initSkandConfig(container, () => {
    renderDashboard(loadData());
    viewManager.showView('view-dashboard');
  });
}

async function renderRealizari(data) {
  const container = document.getElementById('view-realizari');
  const renderer = new AchievementsRenderer(container, data);
  viewManager.showView('view-realizari');
  await renderer.render(() => {
    renderDashboard(loadData());
    viewManager.showView('view-dashboard');
  });
}

async function renderToday(data, dayIdx) {
  const { program, profile, antrenamente = [] } = data;
  const container = document.getElementById('view-today');

  currentSession = new WorkoutSession(program, dayIdx, { deload: isDeloadActive(data) });

  const renderer = new WorkoutRenderer(
    container,
    currentSession,
    program,
    profile,
    antrenamente
  );

  await renderer.render(
    // onSessionSaved
    (sessionData) => {
      const d = loadData();
      d.antrenamente = [...(d.antrenamente || []), sessionData];
      consumeDeloadSession(d); // dacă era săptămână de descărcare, scade contorul
      saveData(d);
      currentSession = null;

      if (d.program_salvat) {
        renderDashboard(d);
        viewManager.showView('view-dashboard');
      } else {
        renderProgram(d);
        viewManager.showView('view-program');
      }
    },
    // onGoBack
    () => {
      currentSession = null;
      const d = loadData();
      if (d.program_salvat) {
        renderDashboard(d);
        viewManager.showView('view-dashboard');
      } else {
        renderProgram(d);
        viewManager.showView('view-program');
      }
    }
  );

  // Handle day tab switching
  container.addEventListener('switch-day', (e) => {
    renderToday(loadData(), e.detail.dayIdx);
  });
}

// ── Profil ────────────────────────────────────────────────────────────────────
const EXP_LABELS = ['Încep de la zero', 'Sub 1 an', '1–3 ani', 'Peste 3 ani'];

function renderProfil(data) {
  const p = data.profile;
  const container = document.getElementById('view-profil');
  const bmi = bmiPanelHTML(p.gen, p.inaltime, p.greutate);

  const rows = [
    ['Gen',        p.gen === 'feminin' ? 'Femeie' : p.gen === 'masculin' ? 'Bărbat' : '—'],
    ['Înălțime',   p.inaltime ? `${p.inaltime} cm` : '—'],
    ['Greutate',   p.greutate ? `${p.greutate} kg` : '—'],
    ['Obiectiv',   { sanatate: 'Sănătate / tonifiere', masa: 'Masă musculară', forta: 'Forță / putere', anduranta: 'Anduranță' }[p.obiectiv] ?? '—'],
    ['Zile / săpt.', p.zile ?? '—'],
    ['Experiență', EXP_LABELS[p.experienta] ?? '—'],
  ];

  container.innerHTML = `
    <div class="profil-wrap">
      <h1 class="profil-title">Setări</h1>

      <div class="profil-section-title">Profil</div>
      ${bmi ? `<div class="bmi-panel ${bmi.cls}">${bmi.html}</div>`
            : `<div class="profil-empty">Adaugă înălțimea și greutatea din Editează profilul ca să vezi BMI-ul tău.</div>`}
      <div class="profil-card">
        ${rows.map(([k, v]) => `
          <div class="profil-row">
            <span class="profil-key">${k}</span>
            <span class="profil-val">${v}</span>
          </div>`).join('')}
      </div>
      <button class="btn btn-primary profil-edit" id="btn-profil-edit">Editează profilul</button>

      <div id="meas-section"></div>

      <div class="profil-section-title">Afișare</div>
      <div class="profil-card">
        <div class="profil-row">
          <span class="profil-key">Temă</span>
          <div class="theme-seg" id="theme-seg">
            <button class="theme-seg-btn" data-theme="chalk">Chalk</button>
            <button class="theme-seg-btn" data-theme="slate">Slate</button>
          </div>
        </div>
      </div>

      <div class="profil-section-title">Date</div>
      <p class="profil-data-hint">Datele tale sunt salvate doar pe acest dispozitiv. „Șterge toate datele" pornește aplicația de la zero — profil, program și istoric. Acțiunea nu se poate anula.</p>
      <button class="btn btn-danger btn-full" id="btn-clear-data">Șterge toate datele</button>

    </div>`;

  document.getElementById('btn-profil-edit').addEventListener('click', () => showEditProfileModal(loadData()));
  document.getElementById('btn-clear-data').addEventListener('click', () => showClearDataModal());

  // ── Măsurători (jurnal de corp în timp) ──
  const measSection = document.getElementById('meas-section');
  if (measSection) {
    new MeasurementsRenderer(measSection, () => renderProfil(loadData())).render();
  }

  // ── Temă ──
  const themeSeg = document.getElementById('theme-seg');
  if (themeSeg) {
    const applyActive = () => {
      const cur = document.documentElement.dataset.theme || 'chalk';
      themeSeg.querySelectorAll('.theme-seg-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.theme === cur));
    };
    applyActive();
    themeSeg.querySelectorAll('.theme-seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.theme;
        document.documentElement.dataset.theme = next;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = next === 'slate' ? '#141310' : '#F2F1EC';
        const d = loadData() || {};
        d.tema = next;
        saveData(d);
        applyActive();
      });
    });
  }

  // Butoanele Export/Import au fost scoase din UI (decizie 15.06.2026). Codul de
  // transfer (DataTransfer.js + showImportModal) rămâne adormit, ușor de reactivat.
  // De decis înainte de lansare: o plasă de backup (reactivare sau sync cloud v2).
}

// ── Editor scurt de profil (înlocuiește re-rularea onboarding-ului la editare) ──
// Editezi câmpurile pe o singură pagină. Dacă schimbi ceva ce afectează structura
// programului (gen / obiectiv / zile / experiență), oferim regenerarea programului.
function showEditProfileModal(data) {
  const p = (data && data.profile) || {};
  const OBIECTIVE = [
    ['sanatate', 'Sănătate / tonifiere'],
    ['masa', 'Masă musculară'],
    ['forta', 'Forță / putere'],
    ['anduranta', 'Anduranță'],
  ];
  const sel = (id, label, options, current) => `
    <div class="filter-group">
      <label for="${id}">${label}</label>
      <select class="filter-select" id="${id}">
        ${options.map(([v, l]) => `<option value="${v}" ${String(v) === String(current) ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
    </div>`;

  const ov = document.createElement('div');
  ov.className = 'modal';
  ov.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Editează profilul</h2>
        <button class="modal-close" id="ep-close" aria-label="Închide">✕</button>
      </div>
      <div class="modal-body">
        ${sel('ep-gen', 'Gen', [['masculin', 'Bărbat'], ['feminin', 'Femeie']], p.gen)}
        <div class="filter-group">
          <label for="ep-inaltime">Înălțime (cm)</label>
          <input class="filter-select" id="ep-inaltime" type="number" inputmode="numeric" min="130" max="230" placeholder="—" value="${p.inaltime ?? ''}">
        </div>
        <div class="filter-group">
          <label for="ep-greutate">Greutate (kg)</label>
          <input class="filter-select" id="ep-greutate" type="number" inputmode="decimal" min="30" max="300" placeholder="—" value="${p.greutate ?? ''}">
        </div>
        ${sel('ep-obiectiv', 'Obiectiv', OBIECTIVE, p.obiectiv)}
        ${sel('ep-zile', 'Zile / săptămână', [[2, '2 zile'], [3, '3 zile'], [4, '4 zile'], [5, '5 zile']], p.zile)}
        ${sel('ep-experienta', 'Experiență', EXP_LABELS.map((l, i) => [i, l]), p.experienta)}
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="ep-cancel">Anulează</button>
        <button class="btn btn-primary" id="ep-save">Salvează</button>
      </div>
    </div>`;
  document.body.appendChild(ov);

  const close = () => ov.remove();
  ov.querySelector('.modal-overlay').addEventListener('click', close);
  ov.querySelector('#ep-close').addEventListener('click', close);
  ov.querySelector('#ep-cancel').addEventListener('click', close);

  ov.querySelector('#ep-save').addEventListener('click', () => {
    const numOrNull = (v, lo, hi) => {
      const n = parseFloat(v);
      return (!isNaN(n) && n >= lo && n <= hi) ? n : null;
    };
    const next = {
      gen:        ov.querySelector('#ep-gen').value,
      inaltime:   numOrNull(ov.querySelector('#ep-inaltime').value, 130, 230),
      greutate:   numOrNull(ov.querySelector('#ep-greutate').value, 30, 300),
      obiectiv:   ov.querySelector('#ep-obiectiv').value,
      zile:       Number(ov.querySelector('#ep-zile').value),
      experienta: Number(ov.querySelector('#ep-experienta').value),
    };
    const fresh = loadData() || data;
    const old = fresh.profile || {};
    const newProfile = { ...old, ...next };

    // Câmpurile care schimbă structura programului → oferim regenerarea.
    const affectsProgram =
      old.gen !== newProfile.gen ||
      old.obiectiv !== newProfile.obiectiv ||
      old.zile !== newProfile.zile ||
      old.experienta !== newProfile.experienta;

    close();

    if (affectsProgram) {
      showRegenConfirmModal(fresh, newProfile);
    } else {
      saveData({ ...fresh, profile: newProfile });
      renderProfil(loadData());
    }
  });
}

// Confirmarea de regenerare după schimbarea unei setări ce afectează programul.
function showRegenConfirmModal(data, newProfile) {
  const ov = document.createElement('div');
  ov.className = 'modal';
  ov.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header"><h2>Regenerez programul?</h2></div>
      <div class="modal-body">
        <p class="import-warn">Ai schimbat setări care influențează ce exerciții primești (obiectiv, zile, experiență sau gen). Vrei un program nou pe baza lor?</p>
        <p class="profil-data-hint">Dacă regenerezi, programul curent (inclusiv schimbările făcute manual) se înlocuiește. Istoricul antrenamentelor rămâne neatins. Cu „Doar salvează" păstrezi programul actual.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="rg-keep">Doar salvează</button>
        <button class="btn btn-primary" id="rg-regen">Regenerează programul</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.querySelector('.modal-overlay').addEventListener('click', close);

  ov.querySelector('#rg-keep').addEventListener('click', () => {
    const fresh = loadData() || data;
    saveData({ ...fresh, profile: newProfile });
    close();
    renderProfil(loadData());
  });

  ov.querySelector('#rg-regen').addEventListener('click', async () => {
    const btn = ov.querySelector('#rg-regen');
    btn.disabled = true;
    btn.textContent = 'Se generează...';
    try {
      const splitId = getRecommendedSplit(newProfile.zile, newProfile.experienta, newProfile.obiectiv);
      const program = await generateProgram(newProfile, splitId);
      const fresh = loadData() || data;
      saveData({ ...fresh, profile: newProfile, program, program_salvat: false });
      close();
      const d = loadData();
      renderProgram(d);
      viewManager.showView('view-program');
    } catch (e) {
      console.error('Regen error:', e);
      btn.disabled = false;
      btn.textContent = 'Încearcă din nou';
    }
  });
}

// Confirmare pentru ștergerea completă a datelor (ireversibil).
function showClearDataModal() {
  const ov = document.createElement('div');
  ov.className = 'modal';
  ov.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header"><h2>Ștergi toate datele?</h2></div>
      <div class="modal-body">
        <p class="import-warn">Asta șterge <strong>tot</strong>: profilul, programul și istoricul antrenamentelor. Aplicația repornește de la zero. Acțiunea nu se poate anula.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="cd-cancel">Anulează</button>
        <button class="btn btn-danger" id="cd-confirm">Șterge tot</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.querySelector('.modal-overlay').addEventListener('click', close);
  ov.querySelector('#cd-cancel').addEventListener('click', close);
  ov.querySelector('#cd-confirm').addEventListener('click', () => {
    clearData();
    location.reload();
  });
}

// Ecran de confirmare / eroare pentru import. La confirmare suprascrie și reîncarcă.
function showImportModal({ data, summary, error }) {
  const ov = document.createElement('div');
  ov.className = 'modal';
  const body = error
    ? `<div class="import-error">${error}<br><span>Datele tale actuale au rămas neatinse.</span></div>`
    : `<p class="import-warn">Asta înlocuiește <strong>tot</strong> ce ai acum în aplicație cu datele din fișier. Acțiunea nu se poate anula.</p>
       <div class="import-summary">
         <div><span>Profil</span><strong>${summary.gen}, ${summary.obj}, ${summary.zile}</strong></div>
         <div><span>Antrenamente</span><strong>${summary.n}</strong></div>
         <div><span>Ultima activitate</span><strong>${summary.last}</strong></div>
       </div>`;
  const footer = error
    ? `<button class="btn btn-primary" id="imp-close">Am înțeles</button>`
    : `<button class="btn btn-ghost" id="imp-cancel">Anulează</button>
       <button class="btn btn-primary" id="imp-confirm">Importă și suprascrie</button>`;

  ov.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header"><h2>${error ? 'Import eșuat' : 'Confirmi importul?'}</h2></div>
      <div class="modal-body">${body}</div>
      <div class="modal-footer">${footer}</div>
    </div>`;
  document.body.appendChild(ov);

  const close = () => ov.remove();
  ov.querySelector('.modal-overlay').addEventListener('click', close);
  ov.querySelector('#imp-cancel')?.addEventListener('click', close);
  ov.querySelector('#imp-close')?.addEventListener('click', close);
  ov.querySelector('#imp-confirm')?.addEventListener('click', () => {
    saveData(data);
    location.reload();
  });
}

// ── Onboarding ────────────────────────────────────────────────────────────────
function startOnboarding(editMode = false) {
  viewManager.showView('view-onboarding');
  const container = document.getElementById('view-onboarding');
  const existingData = loadData();

  const opts = editMode ? {
    existingProfile: existingData?.profile,
    onCancel: () => {
      const d = loadData();
      if (d?.program_salvat) {
        renderDashboard(d);
        viewManager.showView('view-dashboard');
      } else {
        renderProgram(d);
        viewManager.showView('view-program');
      }
    },
  } : {};

  initOnboarding(container, (data) => {
    renderProgram(data);
    viewManager.showView('view-program');
  }, opts);
}

// ── Navigation ────────────────────────────────────────────────────────────────
function initNav() {
  document.getElementById('app-nav')?.addEventListener('click', e => {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;
    const d = loadData();
    if (!d?.program) return;
    if (btn.dataset.nav === 'dashboard') {
      renderDashboard(d);
      viewManager.showView('view-dashboard');
    }
    if (btn.dataset.nav === 'program') {
      renderProgram(d);
      viewManager.showView('view-program');
    }
    if (btn.dataset.nav === 'start') {
      const nextIdx = getNextDayIdx(d.program, d.antrenamente);
      renderToday(d, nextIdx);
      viewManager.showView('view-today');
    }
    if (btn.dataset.nav === 'profil') {
      renderProfil(d);
      viewManager.showView('view-profil');
    }
    if (btn.dataset.nav === 'statistici') {
      renderStatistici(d);
    }
  });

  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || 'chalk';
    const next = current === 'slate' ? 'chalk' : 'slate';
    document.documentElement.dataset.theme = next;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = next === 'slate' ? '#141310' : '#F2F1EC';
    const d = loadData() || {};
    d.tema = next;
    saveData(d);
  });
}

// ── Router (hash-based) ───────────────────────────────────────────────────────
// URL-uri de tip …/#program. Persistente: deep-link, refresh și Back funcționează.
// Ecranele tranzitorii (antrenament, onboarding, skand) nu se pot deep-linka.
const ROUTE_RENDER = {
  dashboard:  d => { renderDashboard(d); viewManager.showView('view-dashboard'); },
  program:    d => { renderProgram(d);   viewManager.showView('view-program'); },
  profil:     d => { renderProfil(d);    viewManager.showView('view-profil'); },
  statistici: d => renderStatistici(d),   // showView intern
  calendar:   d => renderCalendar(d),     // showView intern
  realizari:  d => renderRealizari(d),    // showView intern
};
const ROUTE_VIEW = {
  dashboard: 'view-dashboard', program: 'view-program', profil: 'view-profil',
  statistici: 'view-statistici', calendar: 'view-calendar', realizari: 'view-realizari',
};
const TRANSIENT_VIEW = { welcome: 'view-welcome', setup: 'view-setup', antreneaza: 'view-today', onboarding: 'view-onboarding', skand: 'view-skand' };
const INTRO_VIEWS = ['view-welcome', 'view-setup', 'view-onboarding'];

function showWelcome() {
  initWelcome(document.getElementById('view-welcome'), () => showSetup());
  viewManager.showView('view-welcome');
}

// Ecran de alegere: mod simplu vs personalizat.
function showSetup() {
  initChoice(document.getElementById('view-setup'), {
    onPersonalizat: () => startOnboarding(),
    onSimplu: () => showDaysPicker(),
  });
  viewManager.showView('view-setup');
}

function showDaysPicker() {
  initDaysPicker(document.getElementById('view-setup'),
    (n) => startSimpleProgram(n),
    () => showSetup());
  viewManager.showView('view-setup');
}

// Mod simplu: profil minim implicit + program gol cu N zile → ecranul Program (adaugi exerciții).
function startSimpleProgram(nDays) {
  const profile = {
    gen: null, inaltime: null, greutate: null,
    obiectiv: 'sanatate', zile: nDays, timp: 60, experienta: 1,
    echipament: ['corp'], manere: [], grupe_prioritare: [], articulatii_sensibile: [],
    skandenberg: false, stil_skandenberg: null, interfata: 'completa', mod: 'simplu',
  };
  const program = {
    split_id: 'custom', split_label: 'Programul meu', split_desc: 'Construit de tine',
    zile: Array.from({ length: nDays }, (_, i) => ({ label: `Zi ${i + 1}`, tip: 'full', exercitii: [] })),
  };
  const existing = loadData() || {};
  const data = {
    ...existing, profile, program,
    antrenamente: existing.antrenamente || [],
    preferinte: existing.preferinte || { nu_imi_place: [], ma_doare: [] },
    program_salvat: false,
  };
  saveData(data);
  renderProgram(data);
  viewManager.showView('view-program');
}

function resolveRoute() {
  const d = loadData();
  // Utilizator nou (fără profil) → welcome → alegere mod. Cât timp e pe un ecran de
  // intro (welcome/setup/onboarding), îl lăsăm acolo — nu-l forțăm înapoi la welcome.
  if (!d?.profile) {
    const inIntro = INTRO_VIEWS.some(v => document.getElementById(v)?.classList.contains('active'));
    if (!inIntro) showWelcome();
    return;
  }
  if (!d?.program) { startOnboarding(); return; }

  let route = (location.hash || '').replace(/^#/, '');

  // Ecran tranzitoriu: rămâi pe el dacă e activ (navigare internă); altfel (refresh/
  // deep-link, fără starea necesară) cazi pe ecranul implicit.
  if (TRANSIENT_VIEW[route]) {
    if (document.getElementById(TRANSIENT_VIEW[route])?.classList.contains('active')) return;
    route = '';
  }

  // Rută invalidă sau program nesalvat → ecran implicit.
  if (!ROUTE_RENDER[route] || !d.program_salvat) {
    route = d.program_salvat ? 'dashboard' : 'program';
  }

  // Deja pe ecranul cerut (ex. hash setat de showView) → nu re-randa.
  if (document.getElementById(ROUTE_VIEW[route])?.classList.contains('active')) return;

  ROUTE_RENDER[route](d);
}

// ── Service Worker ────────────────────────────────────────────────────────────
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/gvr-fitness-tracker/sw.js')
    .then(reg => {
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner();
        });
      });
    }).catch(() => { });
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
}

function showUpdateBanner() {
  if (document.getElementById('update-banner')) return;
  const b = document.createElement('div');
  b.id = 'update-banner';
  b.innerHTML = `<span>Versiune nouă disponibilă</span><button id="btn-update">Actualizează</button>`;
  document.body.appendChild(b);
  document.getElementById('btn-update').addEventListener('click', () => {
    navigator.serviceWorker.getRegistration().then(r => r?.waiting?.postMessage('skipWaiting'));
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize managers and engines
  viewManager = new ViewManager(loadData());
  adaptiveEngine = new AdaptiveEngine();
  deloadEngine = new DeloadEngine();

  // Register service worker
  registerSW();
  initNav();

  // Router pe hash: Back/refresh/deep-link funcționează (vezi resolveRoute)
  window.addEventListener('hashchange', resolveRoute);
  try {
    resolveRoute();
  } catch (error) {
    console.error('Error during initialization:', error);
  }

  // Reset button (if present)
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    clearData();
    location.reload();
  });
});
