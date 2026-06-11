import { loadData, saveData, clearData } from './storage.js';
import { generateProgram, getRecommendedSplit, getSplitsForZile, getExercisesByIds } from './generator.js';
import { initOnboarding } from './onboarding.js';

// ── Views ─────────────────────────────────────────────────────────────────────
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
      <span class="so-label">${s.recomandat ? '★ ' : ''}${s.label}</span>
      <span class="so-desc">${s.desc}</span>
    </button>`).join('');

  const daysHTML = program.zile.map((day, di) => `
    <div class="day-card">
      <div class="day-header">
        <div class="day-num">${di + 1}</div>
        <div>
          <div class="day-type">${day.tip.toUpperCase()}</div>
          <div class="day-label">${day.label}</div>
        </div>
        <button class="btn-start-day" data-day="${di}" title="Începe această zi">▶</button>
      </div>
      <div class="day-exs">
        ${day.exercitii.map((ex, ei) => `
          <div class="day-ex" id="dex-${di}-${ei}">
            <div class="dex-main">
              <div class="dex-info">
                <span class="dex-name">${ex.nume}</span>
                <span class="dex-sets">${ex.seturi}×${ex.rep_min}${ex.rep_max !== ex.rep_min ? '–' + ex.rep_max : ''}</span>
              </div>
              ${ex.alternative && ex.alternative.length > 0
                ? `<button class="dex-swap-btn" data-day="${di}" data-ex="${ei}">↔ Schimbă</button>`
                : ''}
            </div>
            <div class="dex-alts" id="alts-${di}-${ei}" style="display:none"></div>
          </div>`).join('')}
      </div>
    </div>`).join('');

  container.innerHTML = `
    <div class="prog-wrap">
      <div class="prog-header">
        <div class="prog-badge">Programul tău</div>
        <h1 class="prog-title">Gata de antrenat.</h1>
        <p class="prog-sub">Poți modifica split-ul, schimba exerciții individuale sau regenera tot.</p>
      </div>

      <div class="split-section">
        <div class="section-label">Split activ</div>
        <div class="split-active-card">
          <div class="sac-label">Selectat</div>
          <div class="sac-name">${program.split_label}</div>
          <div class="sac-desc">${program.split_desc}</div>
        </div>
        <div class="section-label" style="margin-top:12px">Alte variante</div>
        <div class="split-opts">${splitOpts}</div>
      </div>

      <div class="section-label" style="padding:0 16px; margin-bottom:8px">
        Zilele tale <span style="color:var(--t2); font-weight:400; font-size:10px; text-transform:none; letter-spacing:0">— apasă ▶ pe o zi ca să o înceapă</span>
      </div>
      <div class="days-list">${daysHTML}</div>

      <div class="prog-footer">
        <button class="btn btn-ghost btn-full" id="btn-regenerate">↺ Altă variantă de exerciții</button>
        <button class="btn btn-primary btn-full" id="btn-start">Începe programul →</button>
      </div>
    </div>
  `;

  // Split switching
  container.querySelectorAll('.split-opt').forEach(btn => {
    btn.addEventListener('click', async () => {
      container.querySelector('.days-list').innerHTML = '<div class="loading">Se generează...</div>';
      try {
        const newProgram = await generateProgram(profile, btn.dataset.split);
        const saved = loadData(); saved.program = newProgram; saveData(saved);
        renderProgram(saved);
      } catch (e) { console.error(e); }
    });
  });

  // Regenerate all exercises
  container.querySelector('#btn-regenerate').addEventListener('click', async () => {
    const b = container.querySelector('#btn-regenerate');
    b.disabled = true; b.textContent = 'Se regenerează...';
    try {
      const newProgram = await generateProgram(profile, program.split_id);
      const saved = loadData(); saved.program = newProgram; saveData(saved);
      renderProgram(saved);
    } catch { b.disabled = false; b.textContent = '↺ Altă variantă de exerciții'; }
  });

  // Swap individual exercise
  container.querySelectorAll('.dex-swap-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const di  = +btn.dataset.day;
      const ei  = +btn.dataset.ex;
      const ex  = program.zile[di].exercitii[ei];
      const box = document.getElementById(`alts-${di}-${ei}`);

      if (box.style.display !== 'none') { box.style.display = 'none'; return; }

      box.innerHTML = '<div class="alts-loading">Se încarcă...</div>';
      box.style.display = 'block';

      const alts = await getExercisesByIds(ex.alternative);
      if (!alts.length) { box.innerHTML = '<div class="alts-empty">Nicio alternativă disponibilă.</div>'; return; }

      box.innerHTML = alts.map(a => `
        <button class="alt-opt" data-id="${a.id}" data-day="${di}" data-ex="${ei}">
          <span class="alt-name">${a.nume}</span>
          <span class="alt-meta">${a.tip} · niv.${a.nivel}</span>
        </button>`).join('');

      box.querySelectorAll('.alt-opt').forEach(altBtn => {
        altBtn.addEventListener('click', async () => {
          const newId = altBtn.dataset.id;
          const altsAll = await getExercisesByIds([newId]);
          if (!altsAll.length) return;
          const newEx = altsAll[0];

          // Swap: keep prescription, replace id/name/details
          const old = program.zile[di].exercitii[ei];
          program.zile[di].exercitii[ei] = {
            ...old,
            id: newEx.id, nume: newEx.nume, pattern: newEx.pattern,
            tip: newEx.tip, grupe: newEx.grupe_principale,
            descriere: newEx.descriere, reguli_speciale: newEx.reguli_speciale,
            alternative: old.alternative.filter(id => id !== newId).concat(old.id),
          };

          const saved = loadData(); saved.program = program; saveData(saved);
          renderProgram(saved);
        });
      });
    });
  });

  // Start specific day
  container.querySelectorAll('.btn-start-day').forEach(btn => {
    btn.addEventListener('click', () => {
      showView('view-today');
      renderToday(data, +btn.dataset.day);
    });
  });

  // Start program (go to day picker)
  container.querySelector('#btn-start').addEventListener('click', () => {
    showView('view-today');
    renderToday(data, 0);
  });
}

// ── Today view ────────────────────────────────────────────────────────────────
function renderToday(data, activeDayIdx) {
  const { program } = data;
  const container   = document.getElementById('view-today');
  const day         = program.zile[activeDayIdx];

  const tabs = program.zile.map((d, i) => `
    <button class="day-tab ${i === activeDayIdx ? 'active' : ''}" data-day="${i}">
      ${d.label}
    </button>`).join('');

  const exList = day.exercitii.map((ex, i) => `
    <div class="today-ex">
      <div class="tex-num">${i + 1}</div>
      <div class="tex-info">
        <div class="tex-name">${ex.nume}</div>
        <div class="tex-sets">${ex.seturi} seturi · ${ex.rep_min}${ex.rep_max !== ex.rep_min ? '–' + ex.rep_max : ''} rep${ex.reguli_speciale?.includes('timp') ? ' (sec)' : ''} · pauză ${ex.pauza_sec}s</div>
        <div class="tex-desc">${ex.descriere}</div>
        ${ex.reguli_speciale && !ex.reguli_speciale.includes('timp')
          ? `<div class="tex-rule">⚠ ${ex.reguli_speciale}</div>` : ''}
      </div>
    </div>`).join('');

  container.innerHTML = `
    <div class="today-wrap">
      <div class="today-topbar">
        <button class="btn-back" id="back-to-prog">← Program</button>
        <span class="today-version">v${window.APP_VERSION}</span>
      </div>

      <div class="day-tabs-wrap">
        <div class="day-tabs" id="day-tabs">${tabs}</div>
      </div>

      <div class="today-header">
        <div class="th-meta">${day.tip.toUpperCase()} · Ziua ${activeDayIdx + 1} din ${program.zile.length}</div>
        <h1 class="th-title">${day.label}</h1>
        <div class="th-count">${day.exercitii.length} exerciții</div>
      </div>

      <div class="today-list">${exList}</div>

      <div class="today-footer">
        <div class="coming-soon">
          Logarea seriilor vine în Etapa 4.<br>Deocamdată studiază exercițiile de azi.
        </div>
      </div>
    </div>
  `;

  container.querySelector('#back-to-prog').addEventListener('click', () => {
    showView('view-program');
  });

  container.querySelectorAll('.day-tab').forEach(tab => {
    tab.addEventListener('click', () => renderToday(data, +tab.dataset.day));
  });
}

// ── Service Worker ─────────────────────────────────────────────────────────────
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/gvr-fitness-tracker/sw.js')
    .then(reg => {
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });
    }).catch(() => {});

  // Când un nou SW preia controlul, reîncarcă automat
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

function showUpdateBanner() {
  const existing = document.getElementById('update-banner');
  if (existing) return;
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.innerHTML = `
    <span>Versiune nouă disponibilă</span>
    <button id="btn-update">Actualizează</button>
  `;
  document.body.appendChild(banner);
  document.getElementById('btn-update').addEventListener('click', () => {
    navigator.serviceWorker.getRegistration().then(reg => {
      reg?.waiting?.postMessage('skipWaiting');
    });
  });
}

// ── Boot ───────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  registerSW();
  const data = loadData();
  if (!data?.profile || !data?.program) {
    startOnboarding();
  } else {
    renderProgram(data);
    showView('view-program');
  }

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    clearData(); location.reload();
  });
});
