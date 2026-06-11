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

// Utilities
import { ViewManager } from './utils/ViewManager.js';
import { ICONS, SKIP_REASONS } from './utils/Constants.js';
import { getNextDayIdx } from './utils/UIHelpers.js';

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
  const { program, antrenamente = [] } = data;
  const container = document.getElementById('view-dashboard');
  const renderer = new DashboardRenderer(container, program, antrenamente);

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
    }
  );
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
  });
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

  // Router - determine initial view based on data state
  const data = loadData();
  try {
    if (!data?.profile || !data?.program) {
      startOnboarding();
    } else if (data.program_salvat) {
      await renderDashboard(data);
      viewManager.showView('view-dashboard');
    } else {
      await renderProgram(data);
      viewManager.showView('view-program');
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  }

  // Reset button (if present)
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    clearData();
    location.reload();
  });
});
