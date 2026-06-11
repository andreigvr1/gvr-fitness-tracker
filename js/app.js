import { loadData, saveData, clearData } from './storage.js';
import { generateProgram, getRecommendedSplit, getSplitsForZile, getExercisesByIds } from './generator.js';
import { initOnboarding } from './onboarding.js';

// ── Views ─────────────────────────────────────────────────────────────────────
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  updateNav(id);
  window.scrollTo(0, 0);
}

// ── Navigație principală ──────────────────────────────────────────────────────
function updateNav(viewId) {
  const nav = document.getElementById('app-nav');
  if (!nav) return;
  const data = loadData();
  // Nav doar după salvarea programului; ascuns în onboarding și în timpul antrenamentului (focus mode)
  const visible = data?.program_salvat && (viewId === 'view-dashboard' || viewId === 'view-program');
  nav.hidden = !visible;
  document.body.classList.toggle('has-nav', visible);
  nav.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active',
      (b.dataset.nav === 'dashboard' && viewId === 'view-dashboard') ||
      (b.dataset.nav === 'program'   && viewId === 'view-program'));
  });
}

function initNav() {
  document.getElementById('app-nav')?.addEventListener('click', e => {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;
    const d = loadData();
    if (!d?.program) return;
    if (btn.dataset.nav === 'dashboard') { renderDashboard(d); showView('view-dashboard'); }
    if (btn.dataset.nav === 'program')   { renderProgram(d);   showView('view-program'); }
    if (btn.dataset.nav === 'start')     { renderToday(d, getNextDayIdx(d.program, d.antrenamente)); showView('view-today'); }
  });
}

// ── Onboarding ────────────────────────────────────────────────────────────────
function startOnboarding() {
  showView('view-onboarding');
  initOnboarding(document.getElementById('view-onboarding'), (data) => {
    renderProgram(data);
    showView('view-program');
  });
}

// ── Skip reasons ──────────────────────────────────────────────────────────────
const SKIP_REASONS = [
  { id: 'oboseala',   label: 'Nu am mai putut fizic',              icon: '😓' },
  { id: 'timp',       label: 'Nu am mai avut timp',                icon: '⏰' },
  { id: 'durere',     label: 'Mă durea articulația / zona',        icon: '🤕' },
  { id: 'prea_greu',  label: 'Exercițiul era prea greu',           icon: '⚠️' },
  { id: 'echipament', label: 'Nu am avut echipamentul la îndemână',icon: '🔧' },
  { id: 'altceva',    label: 'Alt motiv',                          icon: '💬' },
];

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

  if (last.skip) {
    return { tip: 'info', mesaj: `Ultima sesiune ai sărit acest exercițiu. Continuă cu ${kg || '?'} kg.` };
  }

  const allOk = last.serii.every(s => s.reusit);
  const atTop = last.serii.every(s => s.reusit && s.repetari >= repMax);

  if (sessions.length >= 2) {
    const prev = sessions[1].exercitii.find(e => e.ex_id === exId);
    if (!prev?.skip && prev?.serii.some(s => !s.reusit) && last.serii.some(s => !s.reusit)) {
      const newKg = Math.round(kg * 0.925 / 2.5) * 2.5;
      return { tip: 'regresia', kg: newKg, mesaj: `Stagnare — recomand ${newKg} kg (-7,5%) și reconstruire.` };
    }
  }

  if (!allOk) {
    return { tip: 'mentine', kg, mesaj: `Rămâi la ${kg} kg până închizi toate seriile la ${repMin}–${repMax} rep.` };
  }

  const N = profileExp === 0 ? 1 : 2;
  const cleanCount = sessions.filter(s => {
    const e = s.exercitii.find(x => x.ex_id === exId);
    return !e?.skip && e?.serii.every(x => x.reusit && x.repetari >= repMax);
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

// ── Adaptive skip analysis ────────────────────────────────────────────────────
function analyzeSkips(antrenamente, program) {
  const suggestions = [];
  const exSkips = {};

  for (const session of antrenamente) {
    for (const ex of session.exercitii || []) {
      if (!ex.skip || ex.skip.motiv === '__pending__') continue;
      if (!exSkips[ex.ex_id]) exSkips[ex.ex_id] = [];
      exSkips[ex.ex_id].push(ex.skip.motiv);
    }
  }

  for (const [exId, motivs] of Object.entries(exSkips)) {
    const durereCount = motivs.filter(m => m === 'durere').length;
    if (durereCount >= 2) {
      const dayEx = program?.zile?.flatMap(z => z.exercitii).find(e => e.id === exId);
      suggestions.push({ tip: 'durere', exId, mesaj: `Am observat că ${dayEx?.nume || exId} îți cauzează durere de ${durereCount} ori. Recomand să îl înlocuim.`, actiune: 'swap' });
    }

    const greuCount = motivs.filter(m => m === 'prea_greu').length;
    if (greuCount >= 2) {
      const dayEx = program?.zile?.flatMap(z => z.exercitii).find(e => e.id === exId);
      suggestions.push({ tip: 'prea_greu', exId, mesaj: `${dayEx?.nume || exId} pare prea greu momentan (sărit de ${greuCount} ori). Recomand o variantă mai ușoară.`, actiune: 'swap' });
    }
  }

  const timpSessions = antrenamente.filter(s => s.exercitii?.some(e => e.skip?.motiv === 'timp')).length;
  if (timpSessions >= 3) {
    suggestions.push({ tip: 'timp', mesaj: `De ${timpSessions} ori nu ai terminat din lipsă de timp. Vrei să reducem durata antrenamentului?`, actiune: 'info' });
  }

  const oboselaSessions = antrenamente.filter(s => s.exercitii?.some(e => e.skip?.motiv === 'oboseala')).length;
  if (oboselaSessions >= 3) {
    suggestions.push({ tip: 'oboseala', mesaj: `Ai raportat oboseală acumulată de ${oboselaSessions} ori. Recomand o săptămână cu volum redus.`, actiune: 'info' });
  }

  const seen = new Set();
  return suggestions.filter(s => {
    const key = s.tip + (s.exId || '');
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

// ── Program view ───────────────────────────────────────────────────────────────
function renderProgram(data) {
  const { program, profile, antrenamente = [] } = data;
  const container = document.getElementById('view-program');
  const splits    = getSplitsForZile(profile.zile);

  const completedDays = new Set(
    antrenamente.filter(a => a.zi_complet).map(a => `${a.zi_index}`)
  );

  const splitOpts = splits.map(s => `
    <button class="split-opt ${s.id === program.split_id ? 'active' : ''}" data-split="${s.id}">
      <span class="so-label">${s.recomandat ? '★ ' : ''}${s.label}</span>
      <span class="so-desc">${s.desc}</span>
    </button>`).join('');

  const daysHTML = program.zile.map((day, di) => {
    const done = completedDays.has(`${di}`);
    return `
    <div class="day-card ${done ? 'day-done' : ''}">
      <div class="day-header">
        <div class="day-num ${done ? 'day-num-done' : ''}">${done ? ico('check') : di + 1}</div>
        <div>
          <div class="day-type">${day.tip.toUpperCase()}</div>
          <div class="day-label">${day.label}</div>
        </div>
        <button class="btn-start-day" data-day="${di}">${ICONS.play}</button>
      </div>
      <div class="day-exs">
        ${day.exercitii.map((ex, ei) => `
          <div class="day-ex" id="dex-${di}-${ei}">
            <div class="dex-main">
              <div class="dex-info">
                <span class="dex-name">${ex.nume}</span>
                <span class="dex-sets">${ex.seturi}×${ex.rep_min}${ex.rep_max !== ex.rep_min ? '–' + ex.rep_max : ''}</span>
              </div>
              ${ex.alternative?.length ? `<button class="dex-swap-btn" data-day="${di}" data-ex="${ei}">${ICONS.swap}</button>` : ''}
            </div>
            <div class="dex-alts" id="alts-${di}-${ei}" style="display:none"></div>
          </div>`).join('')}
      </div>
    </div>`; }).join('');

  container.innerHTML = `
    <div class="prog-wrap">
      <div class="prog-header">
        <div class="prog-badge">Programul tău</div>
        <h1 class="prog-title">Gata de antrenat.</h1>
        <p class="prog-sub">Pornește oricare zi cu butonul de play.</p>
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
      <div class="prog-footer" id="prog-footer">
        <button class="btn btn-primary btn-full" id="btn-save-program"><span class="btn-ico">${ICONS.check}</span> Salvează programul</button>
        <button class="btn btn-ghost btn-full" id="btn-regenerate"><span class="btn-ico">${ICONS.refresh}</span> Altă variantă de exerciții</button>
        ${data.program_salvat ? `<button class="btn btn-ghost btn-full" id="btn-to-dashboard"><span class="btn-ico">${ICONS.back}</span> Înapoi la dashboard</button>` : ''}
      </div>
    </div>`;

  const suggestions = analyzeSkips(antrenamente, program);
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
        const exId   = btn.dataset.ex;
        const dayIdx = program.zile.findIndex(z => z.exercitii.some(e => e.id === exId));
        if (dayIdx === -1) return;
        const exIdx  = program.zile[dayIdx].exercitii.findIndex(e => e.id === exId);
        const ex     = program.zile[dayIdx].exercitii[exIdx];
        if (!ex.alternative?.length) return;
        const [newEx] = await getExercisesByIds([ex.alternative[0]]);
        if (!newEx) return;
        program.zile[dayIdx].exercitii[exIdx] = { ...ex, id: newEx.id, nume: newEx.nume, tip: newEx.tip, grupe: newEx.grupe_principale, descriere: newEx.descriere, reguli_speciale: newEx.reguli_speciale, alternative: ex.alternative.filter(x => x !== newEx.id).concat(ex.id) };
        const d = loadData(); d.program = program; saveData(d); renderProgram(d);
      });
    });
  }

  container.querySelectorAll('.split-opt').forEach(btn => {
    btn.addEventListener('click', async () => {
      container.querySelector('.days-list').innerHTML = '<div class="loading">Se generează...</div>';
      try { const p = await generateProgram(profile, btn.dataset.split); const d = loadData(); d.program = p; saveData(d); renderProgram(d); } catch(e) { console.error(e); }
    });
  });

  container.querySelector('#btn-regenerate').addEventListener('click', async () => {
    const b = container.querySelector('#btn-regenerate');
    b.disabled = true; b.textContent = 'Se regenerează...';
    try { const p = await generateProgram(profile, program.split_id); const d = loadData(); d.program = p; saveData(d); renderProgram(d); }
    catch { b.disabled = false; b.innerHTML = `<span class="btn-ico">${ICONS.refresh}</span> Altă variantă`; }
  });

  container.querySelectorAll('.dex-swap-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const di = +btn.dataset.day, ei = +btn.dataset.ex;
      const ex  = program.zile[di].exercitii[ei];
      const box = document.getElementById(`alts-${di}-${ei}`);
      if (box.style.display !== 'none') { box.style.display = 'none'; return; }
      box.innerHTML = '<div class="alts-loading">Se încarcă...</div>'; box.style.display = 'block';
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

  container.querySelector('#btn-save-program').addEventListener('click', () => {
    const d = loadData(); d.program_salvat = true; saveData(d);
    renderDashboard(d); showView('view-dashboard');
  });
  container.querySelector('#btn-to-dashboard')?.addEventListener('click', () => {
    renderDashboard(loadData()); showView('view-dashboard');
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function getNextDayIdx(program, antrenamente) {
  const completed = (antrenamente || []).filter(a => a.zi_complet).sort((a, b) => b.data - a.data);
  if (!completed.length) return 0;
  return (completed[0].zi_index + 1) % program.zile.length;
}

const ICONS = {
  bolt:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  chart:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  trophy:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>',
  list:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  play:     '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
  check:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  swap:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  skip:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="5" y1="19" x2="19" y2="5"/></svg>',
  back:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  refresh:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  up:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
  down:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
  flag:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
  arrow:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  timer:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="10" y1="1" x2="14" y2="1"/></svg>',
};
const ico = (name, cls = '') => `<span class="ico ${cls}">${ICONS[name]}</span>`;

function renderDashboard(data) {
  const { program, antrenamente = [] } = data;
  const container = document.getElementById('view-dashboard');
  const nextIdx   = getNextDayIdx(program, antrenamente);
  const nextDay   = program.zile[nextIdx];
  const completed = antrenamente.filter(a => a.zi_complet).sort((a, b) => b.data - a.data);

  // Statistici
  const now        = new Date();
  const startWeek  = new Date(now); startWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); startWeek.setHours(0,0,0,0);
  const thisWeek   = completed.filter(a => a.data >= startWeek.getTime()).length;
  const totalVolum = completed.reduce((sum, a) =>
    sum + a.exercitii.reduce((s, e) => s + (e.skip ? 0 : e.serii.reduce((v, x) => v + (x.greutate || 0) * (x.repetari || 0), 0)), 0), 0);
  const volumFmt   = totalVolum >= 1000 ? (totalVolum / 1000).toFixed(1).replace('.', ',') + ' t' : Math.round(totalVolum) + ' kg';

  const azi = now.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });

  const historyHTML = completed.length
    ? completed.slice(0, 7).map(a => {
        const d = new Date(a.data);
        const skipped = a.exercitii.filter(e => e.skip).length;
        return `
        <div class="hist-item">
          <div class="hist-date">
            <span class="hist-day">${d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}</span>
            <span class="hist-weekday">${d.toLocaleDateString('ro-RO', { weekday: 'short' })}</span>
          </div>
          <div class="hist-info">
            <span class="hist-label">${a.zi_label}</span>
            <span class="hist-meta">${a.exercitii.length - skipped} exerciții${skipped ? ` · ${skipped} sărite` : ''}</span>
          </div>
          <span class="hist-check">${ICONS.check}</span>
        </div>`;
      }).join('')
    : '<div class="hist-empty">Niciun antrenament încă.<br>Primul pas e cel mai important.</div>';

  container.innerHTML = `
    <div class="dash-wrap">
      <header class="dash-top">
        <div>
          <div class="dash-date">${azi.charAt(0).toUpperCase() + azi.slice(1)}</div>
          <h1 class="dash-title">Salut! 👋</h1>
        </div>
        <button class="dash-icon-btn" id="btn-edit-prefs" title="Preferințe">${ICONS.settings}</button>
      </header>

      <div class="dash-next-card">
        <div class="dnc-row">
          <div>
            <div class="dnc-label">Următorul antrenament</div>
            <div class="dnc-name">${nextDay.label}</div>
            <div class="dnc-meta">Ziua ${nextIdx + 1} din ${program.zile.length} · ${nextDay.exercitii.length} exerciții · ~${data.profile.timp} min</div>
          </div>
          <div class="dnc-ring">${nextIdx + 1}<span>/${program.zile.length}</span></div>
        </div>
        <button class="btn btn-primary btn-full" id="btn-start-next">
          <span class="btn-ico">${ICONS.play}</span> Începe antrenamentul
        </button>
      </div>

      <div class="stat-row">
        <div class="stat-card">
          <div class="stat-ico">${ICONS.bolt}</div>
          <div class="stat-val">${completed.length}</div>
          <div class="stat-lbl">Antrenamente</div>
        </div>
        <div class="stat-card">
          <div class="stat-ico">${ICONS.calendar}</div>
          <div class="stat-val">${thisWeek}<span class="stat-sub">/${program.zile.length}</span></div>
          <div class="stat-lbl">Săptămâna asta</div>
        </div>
        <div class="stat-card">
          <div class="stat-ico">${ICONS.chart}</div>
          <div class="stat-val">${volumFmt}</div>
          <div class="stat-lbl">Volum ridicat</div>
        </div>
      </div>

      <div class="dash-section-head">
        <span>Activitate recentă</span>
      </div>
      <div class="hist-list">${historyHTML}</div>

      <div class="dash-section-head">
        <span>În curând</span>
      </div>
      <div class="soon-grid">
        <div class="soon-card">
          <div class="soon-ico">${ICONS.calendar}</div>
          <div class="soon-name">Calendar</div>
          <div class="soon-desc">Vizualizare lunară a antrenamentelor</div>
          <span class="soon-chip">În curând</span>
        </div>
        <div class="soon-card">
          <div class="soon-ico">${ICONS.chart}</div>
          <div class="soon-name">Progres</div>
          <div class="soon-desc">Grafice de evoluție per exercițiu</div>
          <span class="soon-chip">În curând</span>
        </div>
        <div class="soon-card">
          <div class="soon-ico">${ICONS.trophy}</div>
          <div class="soon-name">Recorduri</div>
          <div class="soon-desc">Cele mai bune serii ale tale</div>
          <span class="soon-chip">În curând</span>
        </div>
        <div class="soon-card">
          <div class="soon-ico">${ICONS.bolt}</div>
          <div class="soon-name">Skandenberg</div>
          <div class="soon-desc">Modul dedicat de antrenament</div>
          <span class="soon-chip">În curând</span>
        </div>
      </div>

      <div class="dash-footer">
        <button class="btn btn-ghost btn-full" id="btn-view-program"><span class="btn-ico">${ICONS.list}</span> Vezi / modifică programul</button>
      </div>
    </div>`;

  container.querySelector('#btn-start-next').addEventListener('click', () => {
    showView('view-today'); renderToday(data, nextIdx);
  });
  container.querySelector('#btn-view-program').addEventListener('click', () => {
    renderProgram(loadData()); showView('view-program');
  });
  container.querySelector('#btn-edit-prefs').addEventListener('click', () => {
    startOnboarding();
  });
}

// ── Today view — full logging ─────────────────────────────────────────────────
function renderToday(data, activeDayIdx) {
  const { program, profile, antrenamente = [] } = data;
  const container = document.getElementById('view-today');
  const day       = program.zile[activeDayIdx];

  const session = {
    data: Date.now(),
    zi_index: activeDayIdx,
    zi_label: day.label,
    zi_complet: false,
    exercitii: day.exercitii.map(ex => ({
      ex_id: ex.id,
      skip: null,
      serii: Array.from({ length: ex.seturi }, () => ({
        greutate: null, repetari: null, reusit: null,
        target_min: ex.rep_min, target_max: ex.rep_max,
      })),
    })),
  };

  const resolved = new Array(day.exercitii.length).fill(false);

  const tabs = program.zile.map((d, i) => `
    <button class="day-tab ${i === activeDayIdx ? 'active' : ''}" data-day="${i}">${d.label}</button>`).join('');

  function buildExHTML(ex, exIdx) {
    const rec       = getRecommendation(ex.id, ex.rep_min, ex.rep_max, antrenamente, profile.experienta);
    const suggestKg = rec.kg || '';
    const isStatic  = ex.reguli_speciale?.includes('timp');
    const hasTempo  = ex.reguli_speciale?.includes('tempo 3-1-3');

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
              : rec.tip === 'regresia'
                ? `<div class="rec-banner rec-regresia">${ico('down')}<span>${rec.mesaj}</span></div>`
                : `<div class="rec-banner rec-info">${ico('arrow')}<span>${rec.mesaj}</span></div>`}
          ${hasTempo ? `<div class="tempo-explain">${ico('timer')}<span>Tempo 3-1-3 = 3 sec coborâre · 1 sec pauză jos · 3 sec ridicare</span></div>` : ''}
          <div class="log-ex-desc">${ex.descriere}</div>
          <div class="log-sets-list">${setsHTML}</div>
        </div>
      </div>`;
  }

  container.innerHTML = `
    <div class="today-wrap">
      <div class="today-topbar">
        <button class="btn-back" id="back-to-prog">${ICONS.back}<span>Înapoi</span></button>
        <div class="topbar-counter" id="ex-counter">0 / ${day.exercitii.length}</div>
      </div>
      <div class="today-progress"><div class="today-progress-fill" id="today-progress-fill" style="width:0%"></div></div>
      <div class="day-tabs-wrap"><div class="day-tabs">${tabs}</div></div>
      <div class="today-header">
        <div class="th-meta">${day.tip.toUpperCase()} · Ziua ${activeDayIdx + 1} din ${program.zile.length}</div>
        <h1 class="th-title">${day.label}</h1>
      </div>
      <div id="log-list" class="log-list">
        ${day.exercitii.map((ex, i) => buildExHTML(ex, i)).join('')}
      </div>
      <div class="today-footer" id="today-footer" style="display:none">
        <div class="done-banner" id="done-banner">${ico('check')}<span>Antrenament finalizat!</span></div>
        <button class="btn btn-primary btn-full" id="btn-save-session">Salvează antrenamentul</button>
        <button class="btn btn-ghost btn-full" id="back-prog-2">Înapoi fără salvare</button>
      </div>
    </div>`;

  // ── Collapse / expand ──
  let openIdx = 0;
  function openEx(idx) {
    document.querySelectorAll('.log-ex-body').forEach((b, i) => {
      b.style.display = i === idx ? 'block' : 'none';
      const chev = document.getElementById(`chev-${i}`);
      if (chev) chev.textContent = i === idx ? '▴' : '▾';
    });
    openIdx = idx;
  }
  openEx(0);

  container.querySelectorAll('[data-toggle]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.ex-skip-btn')) return;
      openEx(+el.dataset.toggle);
    });
  });

  // ── Stepper buttons ──
  container.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      const cur = parseFloat(inp.value) || 0;
      inp.value = Math.max(0, Math.round((cur + +btn.dataset.step) * 10) / 10);
    });
  });

  // ── Resolve tracking ──
  function updateCounter() {
    const done = resolved.filter(Boolean).length;
    document.getElementById('ex-counter').textContent = `${done} / ${day.exercitii.length}`;
    const fill = document.getElementById('today-progress-fill');
    if (fill) fill.style.width = `${(done / day.exercitii.length) * 100}%`;
  }

  function markResolved(exIdx) {
    resolved[exIdx] = true;
    updateCounter();
    setTimeout(() => {
      if (resolved.every(Boolean)) finishDay();
    }, 350);
  }

  function finishDay() {
    const pendingSkips = session.exercitii.filter(e => e.skip?.motiv === '__pending__');
    if (pendingSkips.length) {
      showSkipReasonScreen(pendingSkips);
    } else {
      showDoneFooter();
    }
  }

  function showDoneFooter() {
    const skipped = session.exercitii.filter(e => e.skip).length;
    const footer  = document.getElementById('today-footer');
    footer.style.display = 'flex';
    if (skipped > 0) {
      const banner = document.getElementById('done-banner');
      banner.innerHTML = `${ico('check')}<span>Antrenament finalizat (${skipped} ${skipped === 1 ? 'exercițiu sărit' : 'exerciții sărite'})</span>`;
      banner.classList.add('done-banner-partial');
    }
  }

  // ── Skip button ──
  container.querySelectorAll('.ex-skip-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const exIdx = +btn.dataset.ex;
      if (resolved[exIdx]) return;

      session.exercitii[exIdx].skip = { motiv: '__pending__', label: '' };

      const card  = document.getElementById(`ex-card-${exIdx}`);
      const body  = document.getElementById(`ex-body-${exIdx}`);
      const stat  = document.getElementById(`ex-status-${exIdx}`);
      const chev  = document.getElementById(`chev-${exIdx}`);

      card.classList.add('ex-skipped');
      stat.innerHTML = ICONS.skip; stat.style.color = 'var(--t2)'; stat.style.borderColor = 'var(--t3)';
      body.style.display = 'none'; chev.textContent = '';
      btn.style.display = 'none';

      markResolved(exIdx);
    });
  });

  // ── Skip reason screen ──
  function showSkipReasonScreen(pendingSkips) {
    const skippedItems = pendingSkips.map(e => ({
      sessionEx: e,
      dayEx: day.exercitii[session.exercitii.indexOf(e)],
      idx: session.exercitii.indexOf(e),
    }));

    const list = document.getElementById('log-list');
    list.style.padding = '0';
    list.innerHTML = `
      <div class="skip-reason-wrap">
        <div class="skip-reason-title">De ce ai sărit ${skippedItems.length === 1 ? 'exercițiul' : 'exercițiile'}?</div>
        <div class="skip-reason-sub">Răspunsul tău ajută aplicația să îți adapteze antrenamentele viitoare.</div>
        ${skippedItems.map(item => `
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
        selected[exIdx] = { motiv: btn.dataset.motiv, label: SKIP_REASONS.find(r => r.id === btn.dataset.motiv)?.label || '' };
        document.getElementById('btn-skip-done').disabled = !skippedItems.every(item => selected[item.idx]);
      });
    });

    document.getElementById('btn-skip-done').addEventListener('click', () => {
      for (const [idx, reason] of Object.entries(selected)) {
        session.exercitii[+idx].skip = reason;
      }
      list.innerHTML = '';
      list.style.padding = '';
      showDoneFooter();
    });
  }

  // ── Set result ──
  function handleSetResult(exIdx, setIdx, reusit) {
    const row = document.getElementById(`set-${exIdx}-${setIdx}`);
    if (!row || row.dataset.done === '1') return;

    const kg  = parseFloat(document.getElementById(`w-${exIdx}-${setIdx}`).value) || 0;
    const rep = parseInt(document.getElementById(`r-${exIdx}-${setIdx}`).value)   || 0;

    session.exercitii[exIdx].serii[setIdx] = {
      greutate: kg, repetari: rep, reusit,
      target_min: day.exercitii[exIdx].rep_min,
      target_max: day.exercitii[exIdx].rep_max,
    };

    row.dataset.done  = '1';
    row.style.opacity = '0.65';
    row.querySelector('.set-ok').style.cssText   = reusit  ? 'background:var(--green);color:#0d0d0f;border-color:var(--green)' : '';
    row.querySelector('.set-fail').style.cssText = !reusit ? 'background:var(--orange);color:#0d0d0f;border-color:var(--orange)' : '';

    const next = document.getElementById(`set-${exIdx}-${setIdx + 1}`);
    if (next && next.dataset.done !== '1') {
      document.getElementById(`w-${exIdx}-${setIdx + 1}`).value = kg || '';
      document.getElementById(`r-${exIdx}-${setIdx + 1}`).value = rep || day.exercitii[exIdx].rep_min;
    }

    const allSetsDone = session.exercitii[exIdx].serii.every(s => s.reusit !== null);
    if (allSetsDone) {
      const stat  = document.getElementById(`ex-status-${exIdx}`);
      const allOk = session.exercitii[exIdx].serii.every(s => s.reusit);
      stat.innerHTML     = allOk ? ICONS.check : ICONS.x;
      stat.style.color   = allOk ? 'var(--green)' : 'var(--orange)';
      stat.style.borderColor = allOk ? 'var(--green)' : 'var(--orange)';
      document.getElementById(`ex-card-${exIdx}`).classList.add('is-done');
      markResolved(exIdx);
      if (exIdx + 1 < day.exercitii.length && !resolved[exIdx + 1]) setTimeout(() => openEx(exIdx + 1), 300);
    }
  }

  container.querySelectorAll('.set-ok').forEach(btn => {
    btn.addEventListener('click', () => handleSetResult(+btn.dataset.ex, +btn.dataset.set, true));
  });
  container.querySelectorAll('.set-fail').forEach(btn => {
    btn.addEventListener('click', () => handleSetResult(+btn.dataset.ex, +btn.dataset.set, false));
  });

  // ── Save session ──
  function goBack() {
    const d = loadData();
    if (d.program_salvat) { renderDashboard(d); showView('view-dashboard'); }
    else { renderProgram(d); showView('view-program'); }
  }

  container.addEventListener('click', e => {
    if (e.target.id === 'btn-save-session') {
      session.zi_complet = true;
      const d = loadData(); d.antrenamente = [...(d.antrenamente || []), session]; saveData(d);
      e.target.textContent = 'Salvat ✓'; e.target.disabled = true;
      setTimeout(goBack, 700);
    }
    if (e.target.id === 'back-prog-2') goBack();
  });

  container.querySelector('#back-to-prog').addEventListener('click', goBack);
  container.querySelectorAll('.day-tab').forEach(tab => {
    tab.addEventListener('click', () => renderToday(loadData(), +tab.dataset.day));
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
  initNav();
  const data = loadData();
  if (!data?.profile || !data?.program) {
    startOnboarding();
  } else if (data.program_salvat) {
    renderDashboard(data);
    showView('view-dashboard');
  } else {
    renderProgram(data);
    showView('view-program');
  }
  document.getElementById('btn-reset')?.addEventListener('click', () => { clearData(); location.reload(); });
});
