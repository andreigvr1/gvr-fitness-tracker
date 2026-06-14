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
import { StatsEngine } from './engines/StatsEngine.js';

// Renderers
import { ProgramRenderer } from './renderers/ProgramRenderer.js';
import { DashboardRenderer } from './renderers/DashboardRenderer.js';
import { WorkoutRenderer } from './renderers/WorkoutRenderer.js';
import { StatsRenderer } from './renderers/StatsRenderer.js';
import { CalendarRenderer } from './renderers/CalendarRenderer.js';
import { AchievementsRenderer } from './renderers/AchievementsRenderer.js';
import { MeasurementsRenderer } from './renderers/MeasurementsRenderer.js';

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
let currentSession = null;

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

  // Show adaptive suggestions banner if any
  if (suggestions.length) {
    const banner = document.createElement('div');
    banner.className = 'adapt-banner';
    banner.innerHTML = suggestions.map(s => `
      <div class="adapt-item">
        <div class="adapt-msg">${s.mesaj}</div>
        ${s.actiune === 'swap' ? `<button class="adapt-btn" data-ex="${s.exId}">Înlocuiește</button>` : ''}
      </div>`).join('');
    container.querySelector('#prog-footer').before(banner);

    banner.querySelectorAll('.adapt-btn').forEach(btn => {
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
      startOnboarding(true);
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
  const renderer = new StatsRenderer(container, data.program, data.antrenamente || []);
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

  currentSession = new WorkoutSession(program, dayIdx);

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
    ['Vârstă',     p.varsta ? `${p.varsta} ani` : '—'],
    ['Înălțime',   p.inaltime ? `${p.inaltime} cm` : '—'],
    ['Greutate',   p.greutate ? `${p.greutate} kg` : '—'],
    ['Obiectiv',   { sanatate: 'Sănătate / tonifiere', masa: 'Masă musculară', forta: 'Forță / putere', anduranta: 'Anduranță' }[p.obiectiv] ?? '—'],
    ['Zile / săpt.', p.zile ?? '—'],
    ['Experiență', EXP_LABELS[p.experienta] ?? '—'],
  ];

  container.innerHTML = `
    <div class="profil-wrap">
      <h1 class="profil-title">Profil</h1>
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

      <div class="profil-section-title">Backup &amp; date</div>
      <p class="profil-data-hint">Toate datele tale stau doar pe acest dispozitiv. Exportă un backup și ține-l în Drive/email — la nevoie îl reimporți și revii exact unde erai.</p>
      <div class="profil-data-actions">
        <button class="btn btn-ghost" id="btn-export">Exportă datele</button>
        <button class="btn btn-ghost" id="btn-import">Importă date</button>
      </div>
      <input type="file" id="import-file" accept="application/json,.json" hidden>
    </div>`;

  document.getElementById('btn-profil-edit').addEventListener('click', () => startOnboarding(true));

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

  // ── Export ──
  const exportBtn = document.getElementById('btn-export');
  exportBtn.addEventListener('click', () => {
    const ok = exportData(window.APP_VERSION || '');
    if (ok) {
      const orig = exportBtn.textContent;
      exportBtn.textContent = 'Descărcat ✓';
      exportBtn.disabled = true;
      setTimeout(() => { exportBtn.textContent = orig; exportBtn.disabled = false; }, 1800);
    }
  });

  // ── Import ──
  const fileInput = document.getElementById('import-file');
  document.getElementById('btn-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    let text = '';
    try { text = await file.text(); } catch { text = ''; }
    fileInput.value = ''; // permite reimportul aceluiași fișier
    const res = parseBackup(text);
    if (!res.ok) { showImportModal({ error: res.error }); return; }
    showImportModal({ data: res.data, summary: res.summary });
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
const TRANSIENT_VIEW = { antreneaza: 'view-today', onboarding: 'view-onboarding', skand: 'view-skand' };

function resolveRoute() {
  const d = loadData();
  if (!d?.profile || !d?.program) { startOnboarding(); return; }

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
