import { loadData, saveData, clearData } from './storage.js';
import { generateProgram, getRecommendedSplit, getSplitsForZile } from './generator.js';
import { initOnboarding } from './onboarding.js';

const APP_VERSION = '0.3.0';

// ── Views ────────────────────────────────────────────────────────────────────
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

// ── Onboarding ────────────────────────────────────────────────────────────────
function startOnboarding() {
  showView('view-onboarding');
  initOnboarding(document.getElementById('view-onboarding'), (data) => {
    renderProgram(data);
    showView('view-program');
  });
}

// ── Program view ───────────────────────────────────────────────────────────────
function renderProgram(data) {
  const { program, profile } = data;
  const container = document.getElementById('view-program');

  const splits = getSplitsForZile(profile.zile);
  const splitOpts = splits.map(s => `
    <button class="split-opt ${s.id === program.split_id ? 'active' : ''}" data-split="${s.id}">
      <span class="so-label">${s.label}</span>
      <span class="so-desc">${s.desc}</span>
    </button>`).join('');

  const daysHTML = program.zile.map((day, i) => `
    <div class="day-card">
      <div class="day-header">
        <div class="day-num">${i + 1}</div>
        <div>
          <div class="day-type">${day.tip.toUpperCase()}</div>
          <div class="day-label">${day.label}</div>
        </div>
      </div>
      <div class="day-exs">
        ${day.exercitii.map(ex => `
          <div class="day-ex">
            <span class="dex-name">${ex.nume}</span>
            <span class="dex-sets">${ex.seturi}×${ex.rep_min}${ex.rep_max !== ex.rep_min ? '–'+ex.rep_max : ''}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');

  container.innerHTML = `
    <div class="prog-wrap">
      <div class="prog-header">
        <div class="prog-badge">Programul tău</div>
        <h1 class="prog-title">Gata de antrenat.</h1>
        <p class="prog-sub">Poți modifica split-ul sau regenera exercițiile înainte să începi.</p>
      </div>

      <div class="split-section">
        <div class="section-label">Split recomandat</div>
        <div class="split-active-card">
          <div class="sac-label">Selectat</div>
          <div class="sac-name">${program.split_label}</div>
          <div class="sac-desc">${program.split_desc}</div>
        </div>
        <div class="section-label" style="margin-top:12px">Alte variante</div>
        <div class="split-opts" id="split-opts">${splitOpts}</div>
      </div>

      <div class="section-label" style="padding: 0 16px; margin-bottom:8px">Zilele tale</div>
      <div class="days-list" id="days-list">${daysHTML}</div>

      <div class="prog-footer">
        <button class="btn btn-ghost btn-full" id="btn-regenerate">↺ Altă variantă de exerciții</button>
        <button class="btn btn-primary btn-full" id="btn-start">Începe programul →</button>
      </div>
    </div>
  `;

  // Split switching
  container.querySelectorAll('.split-opt').forEach(btn => {
    btn.addEventListener('click', async () => {
      container.querySelector('#days-list').innerHTML = '<div class="loading">Se generează...</div>';
      const newSplitId = btn.dataset.split;
      try {
        const newProgram = await generateProgram(profile, newSplitId);
        const saved = loadData();
        saved.program = newProgram;
        saveData(saved);
        renderProgram(saved);
      } catch (e) { console.error(e); }
    });
  });

  // Regenerate exercises
  container.querySelector('#btn-regenerate').addEventListener('click', async () => {
    const btn2 = container.querySelector('#btn-regenerate');
    btn2.disabled = true; btn2.textContent = 'Se regenerează...';
    try {
      const newProgram = await generateProgram(profile, program.split_id);
      const saved = loadData();
      saved.program = newProgram;
      saveData(saved);
      renderProgram(saved);
    } catch (e) { btn2.disabled = false; btn2.textContent = '↺ Altă variantă de exerciții'; }
  });

  // Start
  container.querySelector('#btn-start').addEventListener('click', () => {
    showView('view-today');
    renderToday(data);
  });
}

// ── Today view (placeholder — logarea completă vine în Etapa 4) ───────────────
function renderToday(data) {
  const { program } = data;
  const container = document.getElementById('view-today');
  const day = program.zile[0];

  container.innerHTML = `
    <div class="today-wrap">
      <div class="today-header">
        <div class="th-meta">Ziua 1 din ${program.zile.length}</div>
        <h1 class="th-title">${day.label}</h1>
      </div>
      <div class="today-list">
        ${day.exercitii.map((ex, i) => `
          <div class="today-ex">
            <div class="tex-num">${i + 1}</div>
            <div class="tex-info">
              <div class="tex-name">${ex.nume}</div>
              <div class="tex-sets">${ex.seturi} seturi · ${ex.rep_min}${ex.rep_max !== ex.rep_min ? '–'+ex.rep_max : ''} rep${ex.reguli_speciale?.includes('timp') ? ' (sec)' : ''}</div>
              <div class="tex-desc">${ex.descriere}</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="today-footer">
        <p class="coming-soon">Logarea seriilor vine în curând — deocamdată studiază exercițiile de azi.</p>
        <button class="btn btn-ghost btn-full" onclick="document.getElementById('view-today').classList.remove('active'); document.getElementById('view-program').classList.add('active')">← Înapoi la program</button>
      </div>
    </div>
  `;
}

// ── Service Worker ────────────────────────────────────────────────────────────
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/gvr-fitness-tracker/sw.js').catch(() => {});
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  registerSW();

  const data = loadData();

  if (!data || !data.profile) {
    startOnboarding();
  } else if (!data.program) {
    startOnboarding();
  } else {
    renderProgram(data);
    showView('view-program');
  }

  // Debug: reset button (hidden)
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    clearData();
    location.reload();
  });
});
