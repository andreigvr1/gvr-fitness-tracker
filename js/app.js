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

// ── Progression engine ────────────────────────────────────────────────────────
function getRecommendation(exId, repMin, repMax, antrenamente, profileExp) {
  const sessions = (antrenamente || [])
    .filter(a => a.exercitii?.some(e => e.ex_id === exId))
    .sort((a, b) => b.data - a.data);

  if (!sessions.length) {
    return { tip: 'calibrare', mesaj: 'Prima sesiune — alege o greutate cu care poți face 2–3 rep în plus față de target. Loghează ce ai făcut și data viitoare recomand eu.' };
  }

  const last    = sessions[0].exercitii.find(e => e.ex_id === exId);
  const weights = last.serii.map(s => s.greutate).filter(Boolean);
  const kg      = weights.length ? Math.max(...weights) : 0;
  const allOk   = last.serii.every(s => s.reusit);
  const atTop   = last.serii.every(s => s.reusit && s.repetari >= repMax);

  // 2 consecutive failed sessions → regress
  if (sessions.length >= 2) {
    const prev = sessions[1].exercitii.find(e => e.ex_id === exId);
    if (prev?.serii.some(s => !s.reusit) && last.serii.some(s => !s.reusit)) {
      const newKg = Math.round(kg * 0.925 / 2.5) * 2.5;
      return { tip: 'regresia', kg: newKg, mesaj: `Stagnare — recomand ${newKg} kg (-7,5%) și reconstruire.` };
    }
  }

  if (!allOk) {
    return { tip: 'mentine', kg, mesaj: `Rămâi la ${kg} kg până închizi toate seriile la ${repMin}–${repMax} rep.` };
  }

  // N clean sessions needed: 1 for beginners (exp=0), 2 otherwise
  const N = profileExp === 0 ? 1 : 2;
  const cleanCount = sessions.filter(s => {
    const e = s.exercitii.find(x => x.ex_id === exId);
    return e?.serii.every(x => x.reusit && x.repetari >= repMax);
  }).length;

  if (atTop && cleanCount >= N) {
    const newKg = kg + 2.5;
    return { tip: 'creste', kg: newKg, mesaj: `+2,5 kg azi! Treci la ${newKg} kg.` };
  }

  if (atTop && cleanCount < N) {
    return { tip: 'aproape', kg, mesaj: `Bine! Încă ${N - cleanCount} sesiune(i) identică și crești.` };
  }

  return { tip: 'mentine', kg, mesaj: `Continuă cu ${kg} kg.` };
}

// ── Program view ───────────────────────────────────────────────────────────────
function renderProgram(data) {
  const { program, profile } = data;
  const container = document.getElementById('view-program');
  const splits    = getSplitsForZile(profile.zile);

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
        <button class="btn-start-day" data-day="${di}">▶</button>
      </div>
      <div class="day-exs">
        ${day.exercitii.map((ex, ei) => `
          <div class="day-ex" id="dex-${di}-${ei}">
            <div class="dex-main">
              <div class="dex-info">
                <span class="dex-name">${ex.nume}</span>
                <span class="dex-sets">${ex.seturi}×${ex.rep_min}${ex.rep_max !== ex.rep_min ? '–' + ex.rep_max : ''}</span>
              </div>
              ${ex.alternative?.length
                ? `<button class="dex-swap-btn" data-day="${di}" data-ex="${ei}">↔</button>`
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
        <p class="prog-sub">Apasă ▶ pe oricare zi ca să o înceapă.</p>
      </div>
      <div class="split-section">
        <div class="section-label">Split activ</div>
        <div class="split-active-card">
          <div class="sac-name">${program.split_label}</div>
          <div class="sac-desc">${program.split_desc}</div>
        </div>
        <div class="section-label" style="margin-top:12px">Alte variante</div>
        <div class="split-opts">${splitOpts}</div>
      </div>
      <div class="section-label" style="padding:0 16px;margin-bottom:8px">Zilele tale</div>
      <div class="days-list">${daysHTML}</div>
      <div class="prog-footer">
        <button class="btn btn-ghost btn-full" id="btn-regenerate">↺ Altă variantă de exerciții</button>
      </div>
    </div>`;

  container.querySelectorAll('.split-opt').forEach(btn => {
    btn.addEventListener('click', async () => {
      container.querySelector('.days-list').innerHTML = '<div class="loading">Se generează...</div>';
      try {
        const p = await generateProgram(profile, btn.dataset.split);
        const d = loadData(); d.program = p; saveData(d); renderProgram(d);
      } catch(e) { console.error(e); }
    });
  });

  container.querySelector('#btn-regenerate').addEventListener('click', async () => {
    const b = container.querySelector('#btn-regenerate');
    b.disabled = true; b.textContent = 'Se regenerează...';
    try {
      const p = await generateProgram(profile, program.split_id);
      const d = loadData(); d.program = p; saveData(d); renderProgram(d);
    } catch { b.disabled = false; b.textContent = '↺ Altă variantă'; }
  });

  container.querySelectorAll('.dex-swap-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const di = +btn.dataset.day, ei = +btn.dataset.ex;
      const ex = program.zile[di].exercitii[ei];
      const box = document.getElementById(`alts-${di}-${ei}`);
      if (box.style.display !== 'none') { box.style.display = 'none'; return; }
      box.innerHTML = '<div class="alts-loading">Se încarcă...</div>';
      box.style.display = 'block';
      const alts = await getExercisesByIds(ex.alternative);
      if (!alts.length) { box.innerHTML = '<div class="alts-empty">Nicio alternativă.</div>'; return; }
      box.innerHTML = alts.map(a => `
        <button class="alt-opt" data-id="${a.id}" data-day="${di}" data-ex="${ei}">
          <span class="alt-name">${a.nume}</span>
          <span class="alt-meta">${a.tip} · niv.${a.nivel}</span>
        </button>`).join('');
      box.querySelectorAll('.alt-opt').forEach(ab => {
        ab.addEventListener('click', async () => {
          const [newEx] = await getExercisesByIds([ab.dataset.id]);
          if (!newEx) return;
          const old = program.zile[di].exercitii[ei];
          program.zile[di].exercitii[ei] = { ...old, id: newEx.id, nume: newEx.nume, pattern: newEx.pattern, tip: newEx.tip, grupe: newEx.grupe_principale, descriere: newEx.descriere, reguli_speciale: newEx.reguli_speciale, alternative: old.alternative.filter(x => x !== newEx.id).concat(old.id) };
          const d = loadData(); d.program = program; saveData(d); renderProgram(d);
        });
      });
    });
  });

  container.querySelectorAll('.btn-start-day').forEach(btn => {
    btn.addEventListener('click', () => { showView('view-today'); renderToday(data, +btn.dataset.day); });
  });
}

// ── Today view — full logging ─────────────────────────────────────────────────
function renderToday(data, activeDayIdx) {
  const { program, profile, antrenamente = [] } = data;
  const container = document.getElementById('view-today');
  const day       = program.zile[activeDayIdx];

  // Workout session state
  const session = {
    data: Date.now(),
    zi_index: activeDayIdx,
    zi_label: day.label,
    exercitii: day.exercitii.map(ex => ({
      ex_id: ex.id,
      serii: Array.from({ length: ex.seturi }, () => ({
        greutate: null, repetari: null, reusit: null,
        target_min: ex.rep_min, target_max: ex.rep_max,
      })),
    })),
  };

  const tabs = program.zile.map((d, i) => `
    <button class="day-tab ${i === activeDayIdx ? 'active' : ''}" data-day="${i}">${d.label}</button>`).join('');

  function buildExHTML(ex, exIdx) {
    const rec = getRecommendation(ex.id, ex.rep_min, ex.rep_max, antrenamente, profile.experienta);
    const suggestKg = rec.kg || '';
    const isStaticEx = ex.reguli_speciale?.includes('timp');
    const tempoEx  = ex.reguli_speciale?.includes('tempo 3-1-3');

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
              value="${ex.rep_min}" min="1" step="1" placeholder="${isStaticEx ? 'sec' : 'rep'}">
            <span class="set-field-lbl">${isStaticEx ? 's' : 'rep'}</span>
          </div>
          <button class="step-btn" data-target="r-${exIdx}-${si}" data-step="1">+</button>
        </div>
        <div class="set-result-btns">
          <button class="set-ok"  data-ex="${exIdx}" data-set="${si}">✓</button>
          <button class="set-fail" data-ex="${exIdx}" data-set="${si}">✗</button>
        </div>
      </div>`).join('');

    return `
      <div class="log-ex-card" id="ex-card-${exIdx}" data-ex-idx="${exIdx}">
        <div class="log-ex-header" data-toggle="${exIdx}">
          <div class="log-ex-status" id="ex-status-${exIdx}">○</div>
          <div class="log-ex-info">
            <div class="log-ex-name">${ex.nume}</div>
            <div class="log-ex-meta">${ex.seturi} serii · ${ex.rep_min}${ex.rep_max !== ex.rep_min ? '–' + ex.rep_max : ''} ${isStaticEx ? 'sec' : 'rep'} · pauză ${ex.pauza_sec}s</div>
          </div>
          <div class="log-ex-chevron" id="chev-${exIdx}">▼</div>
        </div>
        <div class="log-ex-body" id="ex-body-${exIdx}">
          ${rec.tip === 'calibrare'
            ? `<div class="rec-banner rec-calibrare">⚑ ${rec.mesaj}</div>`
            : rec.tip === 'creste'
              ? `<div class="rec-banner rec-creste">↑ ${rec.mesaj}</div>`
              : rec.tip === 'regresia'
                ? `<div class="rec-banner rec-regresia">↓ ${rec.mesaj}</div>`
                : `<div class="rec-banner rec-info">→ ${rec.mesaj}</div>`}
          ${tempoEx ? '<div class="tempo-explain">⏱ Tempo 3-1-3 = 3 sec coborâre · 1 sec pauză jos · 3 sec ridicare</div>' : ''}
          <div class="log-ex-desc">${ex.descriere}</div>
          <div class="log-sets-list">${setsHTML}</div>
        </div>
      </div>`;
  }

  container.innerHTML = `
    <div class="today-wrap">
      <div class="today-topbar">
        <button class="btn-back" id="back-to-prog">← Program</button>
        <div class="topbar-counter" id="ex-counter">0 / ${day.exercitii.length}</div>
      </div>
      <div class="day-tabs-wrap"><div class="day-tabs">${tabs}</div></div>
      <div class="today-header">
        <div class="th-meta">${day.tip.toUpperCase()} · Ziua ${activeDayIdx + 1} din ${program.zile.length}</div>
        <h1 class="th-title">${day.label}</h1>
      </div>
      <div class="log-list" id="log-list">
        ${day.exercitii.map((ex, i) => buildExHTML(ex, i)).join('')}
      </div>
      <div class="today-footer" id="today-footer" style="display:none">
        <div class="done-banner">🎉 Antrenament finalizat!</div>
        <button class="btn btn-primary btn-full" id="btn-save-session">Salvează antrenamentul</button>
        <button class="btn btn-ghost btn-full" id="back-prog-2">← Înapoi la program</button>
      </div>
    </div>`;

  // ── Collapse/expand ──
  let openIdx = 0;
  function openEx(idx) {
    document.querySelectorAll('.log-ex-body').forEach((b, i) => {
      b.style.display = i === idx ? 'block' : 'none';
      document.getElementById(`chev-${i}`).textContent = i === idx ? '▲' : '▼';
    });
    openIdx = idx;
  }
  openEx(0);

  container.querySelectorAll('[data-toggle]').forEach(el => {
    el.addEventListener('click', () => openEx(+el.dataset.toggle));
  });

  // ── Stepper buttons ──
  container.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp  = document.getElementById(btn.dataset.target);
      const step = +btn.dataset.step;
      const cur  = parseFloat(inp.value) || 0;
      inp.value  = Math.max(0, Math.round((cur + step) * 10) / 10);
    });
  });

  // ── Set result ──
  let doneCount = 0;
  function updateCounter() {
    const done = session.exercitii.filter(e => e.serii.every(s => s.reusit !== null)).length;
    document.getElementById('ex-counter').textContent = `${done} / ${day.exercitii.length}`;
    if (done === day.exercitii.length) {
      document.getElementById('today-footer').style.display = 'flex';
    }
  }

  function handleSetResult(exIdx, setIdx, reusit) {
    const row = document.getElementById(`set-${exIdx}-${setIdx}`);
    const kg  = parseFloat(document.getElementById(`w-${exIdx}-${setIdx}`).value) || 0;
    const rep = parseInt(document.getElementById(`r-${exIdx}-${setIdx}`).value) || 0;

    session.exercitii[exIdx].serii[setIdx] = {
      greutate: kg, repetari: rep, reusit,
      target_min: day.exercitii[exIdx].rep_min,
      target_max: day.exercitii[exIdx].rep_max,
    };

    row.dataset.done  = '1';
    row.style.opacity = '0.7';
    row.querySelector('.set-ok').style.background  = reusit ? 'var(--green)' : '';
    row.querySelector('.set-ok').style.color        = reusit ? '#0d0d0f' : '';
    row.querySelector('.set-fail').style.background = !reusit ? 'var(--orange)' : '';
    row.querySelector('.set-fail').style.color      = !reusit ? '#0d0d0f' : '';

    // Pre-fill next set with same values
    const nextRow = document.getElementById(`set-${exIdx}-${setIdx + 1}`);
    if (nextRow && !nextRow.dataset.done) {
      document.getElementById(`w-${exIdx}-${setIdx + 1}`).value = kg || '';
      document.getElementById(`r-${exIdx}-${setIdx + 1}`).value = rep || day.exercitii[exIdx].rep_min;
    }

    // Check if exercise complete
    const allSetsDone = session.exercitii[exIdx].serii.every(s => s.reusit !== null);
    if (allSetsDone) {
      const statusEl = document.getElementById(`ex-status-${exIdx}`);
      const allOk    = session.exercitii[exIdx].serii.every(s => s.reusit);
      statusEl.textContent = allOk ? '✓' : '△';
      statusEl.style.color = allOk ? 'var(--green)' : 'var(--orange)';
      // Open next exercise
      if (exIdx + 1 < day.exercitii.length) {
        setTimeout(() => openEx(exIdx + 1), 300);
      }
    }

    updateCounter();
  }

  container.querySelectorAll('.set-ok').forEach(btn => {
    btn.addEventListener('click', () => handleSetResult(+btn.dataset.ex, +btn.dataset.set, true));
  });
  container.querySelectorAll('.set-fail').forEach(btn => {
    btn.addEventListener('click', () => handleSetResult(+btn.dataset.ex, +btn.dataset.set, false));
  });

  // ── Save session ──
  container.querySelector('#btn-save-session')?.addEventListener('click', () => {
    const d = loadData();
    d.antrenamente = [...(d.antrenamente || []), session];
    saveData(d);
    container.querySelector('#btn-save-session').textContent = 'Salvat ✓';
    container.querySelector('#btn-save-session').disabled = true;
  });

  container.querySelector('#back-to-prog').addEventListener('click', () => showView('view-program'));
  container.querySelector('#back-prog-2')?.addEventListener('click', () => showView('view-program'));
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
        const sw = reg.installing;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner();
        });
      });
    }).catch(() => {});
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
  document.getElementById('btn-reset')?.addEventListener('click', () => { clearData(); location.reload(); });
});
