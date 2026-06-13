import { generateProgram, getRecommendedSplit, getSplitsForZile } from './generator.js';
import { saveData, loadData } from './storage.js';
import { bmiPanelHTML } from './utils/BodyViz.js';

// ── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'gen',
    q: 'Ești femeie sau bărbat?',
    tip: 'single',
    sub_global: 'Influențează selecția exercițiilor și progresia greutăților',
    opt: [
      { val: 'masculin', label: 'Bărbat' },
      { val: 'feminin',  label: 'Femeie' },
    ],
  },
  {
    id: 'measurements',
    q: 'Înălțimea și greutatea ta?',
    tip: 'measurements',
    sub_global: 'Folosite pentru a personaliza exercițiile și valorile de start',
  },
  {
    id: 'obiectiv',
    q: 'Obiectivul tău principal?',
    tip: 'single',
    opt: [
      { val: 'sanatate',  label: 'Sănătate generală / tonifiere' },
      { val: 'masa',      label: 'Masă musculară' },
      { val: 'forta',     label: 'Forță / putere' },
      { val: 'anduranta', label: 'Anduranță / condiție fizică' },
    ],
  },
  {
    id: 'zile',
    q: 'Câte zile pe săptămână poți antrena?',
    tip: 'single',
    opt: [
      { val: 2, label: '2 zile', sub: 'Tot corpul, de 2 ori pe săptămână' },
      { val: 3, label: '3 zile', sub: 'Frecvență mare pe fiecare grupă' },
      { val: 4, label: '4 zile', sub: 'Fiecare grupă de ~2 ori' },
      { val: 5, label: '5 zile', sub: 'Zile tematice, volum mare' },
    ],
  },
  {
    id: 'timp',
    q: 'Cât timp ai pe sesiune?',
    tip: 'single',
    opt: [
      { val: 30, label: '~30 minute', sub: '4 exerciții' },
      { val: 45, label: '~45 minute', sub: '5 exerciții' },
      { val: 60, label: '~60 minute', sub: '7 exerciții' },
      { val: 75, label: '75+ minute', sub: '9 exerciții' },
    ],
  },
  {
    id: 'experienta',
    q: 'Experiența ta cu greutățile?',
    tip: 'single',
    opt: [
      { val: 0, label: 'Încep de la zero' },
      { val: 1, label: 'Sub 1 an' },
      { val: 2, label: '1–3 ani' },
      { val: 3, label: 'Peste 3 ani' },
    ],
  },
  {
    id: 'echipament',
    q: 'Ce echipament ai?',
    tip: 'equipment',
  },
  {
    id: 'grupe_prioritare',
    q: 'Grupe musculare prioritare?',
    tip: 'multi',
    sub_global: 'Alege 0–3 grupe pe care vrei să le accentuezi',
    max: 3,
    opt: [
      { val: 'piept',      label: 'Piept' },
      { val: 'spate',      label: 'Spate' },
      { val: 'umeri',      label: 'Umeri' },
      { val: 'biceps',     label: 'Brațe (biceps)' },
      { val: 'triceps',    label: 'Brațe (triceps)' },
      { val: 'fesieri',    label: 'Fesieri' },
      { val: 'cvadriceps', label: 'Picioare' },
      { val: 'abdomen',    label: 'Abdomen' },
    ],
  },
  {
    id: 'articulatii',
    q: 'Articulații sensibile sau accidentări?',
    tip: 'multi',
    opt: [
      { val: 'niciuna', label: 'Niciuna',                  excl: true },
      { val: 'umar',    label: 'Umăr' },
      { val: 'genunchi',label: 'Genunchi' },
      { val: 'lombar',  label: 'Lombar (spate jos)' },
      { val: 'cot',     label: 'Cot / încheietură' },
    ],
  },

];

// ── State ────────────────────────────────────────────────────────────────────
let step = 0;
let answers = {
  gen: null,
  inaltime: null, greutate: null,
  obiectiv: null, zile: null, timp: null, experienta: null,
  echipament: ['corp'],
  grupe_prioritare: [], articulatii: [],
};
let _container = null;
let _onComplete = null;
let _onCancel   = null;
let _editMode   = false;

// ── Public init ──────────────────────────────────────────────────────────────
// opts.existingProfile — pre-completează răspunsurile dintr-un profil salvat
// opts.onCancel        — dacă e furnizat, apare butonul ✕ pentru ieșire fără salvare
export function initOnboarding(container, onComplete, opts = {}) {
  _container  = container;
  _onComplete = onComplete;
  _onCancel   = opts.onCancel || null;
  _editMode   = !!opts.existingProfile;
  step = 0;

  if (opts.existingProfile) {
    const p = opts.existingProfile;
    answers = {
      gen:              p.gen            ?? null,
      inaltime:         p.inaltime       ?? null,
      greutate:         p.greutate       ?? null,
      obiectiv:         p.obiectiv       ?? null,
      zile:             p.zile           ?? null,
      timp:             p.timp           ?? null,
      experienta:       p.experienta     ?? null,
      echipament:       p.echipament?.length ? [...p.echipament] : ['corp'],
      grupe_prioritare: p.grupe_prioritare ? [...p.grupe_prioritare] : [],
      articulatii:      p.articulatii_sensibile?.length
                          ? [...p.articulatii_sensibile]
                          : ['niciuna'],
    };
  } else {
    answers = {
      gen: null,
      inaltime: null, greutate: null,
      obiectiv: null, zile: null, timp: null, experienta: null,
      echipament: ['corp'],
      grupe_prioritare: [], articulatii: [],
    };
  }

  render();
}

// ── Render ───────────────────────────────────────────────────────────────────
function render() {
  const s = STEPS[step];
  const pct = Math.round((step / STEPS.length) * 100);
  const isLast = step === STEPS.length - 1;
  const lastLabel = _editMode ? 'Salvează modificările →' : 'Generează programul →';

  _container.innerHTML = `
    <div class="ob-wrap">
      <div class="ob-top">
        <div class="ob-progress-track"><div class="ob-progress-fill" style="width:${pct}%"></div></div>
        <div class="ob-step-label">${step + 1} din ${STEPS.length}</div>
        ${_onCancel ? '<button class="btn-ob-close" id="ob-close" title="Închide">✕</button>' : ''}
      </div>
      <div class="ob-body">
        <h2 class="ob-question">${s.q}</h2>
        ${s.sub_global ? `<p class="ob-hint">${s.sub_global}</p>` : ''}
        <div class="ob-options" id="ob-opts">${renderOptions(s)}</div>
      </div>
      <div class="ob-nav">
        ${step > 0 ? '<button class="btn btn-ghost" id="ob-back">← Înapoi</button>' : '<div></div>'}
        <button class="btn btn-primary" id="ob-next">
          ${isLast ? lastLabel : 'Continuă →'}
        </button>
      </div>
    </div>
  `;

  document.getElementById('ob-next').addEventListener('click', handleNext);
  document.getElementById('ob-back')?.addEventListener('click', handleBack);
  document.getElementById('ob-close')?.addEventListener('click', () => _onCancel?.());
  attachOptionHandlers(s);
  restoreSelection(s);
  validateNext();
}

function renderOptions(s) {
  if (s.tip === 'single') {
    return s.opt.map(o => `
      <label class="opt-card" data-val="${o.val}">
        <div class="opt-radio"></div>
        <div class="opt-text">
          <span class="opt-label">${o.label}</span>
          ${o.sub ? `<span class="opt-sub">${o.sub}</span>` : ''}
        </div>
      </label>`).join('');
  }

  if (s.tip === 'multi') {
    return s.opt.map(o => `
      <label class="opt-card" data-val="${o.val}" ${o.excl ? 'data-excl="1"' : ''}>
        <div class="opt-check"></div>
        <div class="opt-text"><span class="opt-label">${o.label}</span></div>
      </label>`).join('');
  }

  if (s.tip === 'equipment')    return renderEquipment();
  if (s.tip === 'measurements') return renderMeasurements();
  return '';
}

function renderEquipment() {
  const generalItems = [
    { val: 'corp',              label: 'Nimic / doar corpul' },
    { val: 'centura_greutati',  label: 'Centură de greutăți (dips/pull-up cu kg)' },
    { val: 'banda',             label: 'Benzi elastice' },
    { val: 'gantera',           label: 'Gantere' },
    { val: 'haltera',           label: 'Halteră + discuri' },
    { val: 'banca',             label: 'Bancă' },
    { val: 'rack',              label: 'Power rack / suport' },
    { val: 'bara tractiuni',    label: 'Bară de tracțiuni' },
    { val: 'scripete',          label: 'Scripete / cablu' },
    { val: '_sala',             label: 'Sală completă (bifează tot)' },
  ];

  const eq = (items) => items.map(o => `
    <label class="opt-card compact" data-val="${o.val}" data-group="equip">
      <div class="opt-check"></div>
      <div class="opt-text"><span class="opt-label">${o.label}</span></div>
    </label>`).join('');

  return `
    <div class="equip-section">
      <div class="equip-title">General</div>
      ${eq(generalItems)}
    </div>
    `;
}

function renderMeasurements() {
  return `
    <div class="meas-row">
      <div class="meas-field">
        <label class="meas-label" for="inp-inaltime">Înălțime</label>
        <div class="meas-input-wrap">
          <input class="meas-input" id="inp-inaltime" type="number" inputmode="numeric"
            min="130" max="230" placeholder="175" value="${answers.inaltime ?? ''}" />
          <span class="meas-unit">cm</span>
        </div>
      </div>
      <div class="meas-field">
        <label class="meas-label" for="inp-greutate">Greutate</label>
        <div class="meas-input-wrap">
          <input class="meas-input" id="inp-greutate" type="number" inputmode="decimal"
            min="30" max="300" placeholder="75" value="${answers.greutate ?? ''}" />
          <span class="meas-unit">kg</span>
        </div>
      </div>
    </div>
    <div class="bmi-panel" id="bmi-panel" style="display:none"></div>
    <p class="meas-hint">Opționale — poți sări dacă preferi</p>
  `;
}

// ── BMI + siluetă (logica în utils/BodyViz.js) ──────────────────────────────
let _lastBmiCls = null;
function updateBMIPanel() {
  const panel = document.getElementById('bmi-panel');
  if (!panel) return;
  const result = bmiPanelHTML(answers.gen, answers.inaltime, answers.greutate);
  if (!result) { panel.style.display = 'none'; _lastBmiCls = null; return; }

  panel.style.display = 'flex';
  panel.className = `bmi-panel ${result.cls}`;
  panel.innerHTML = result.html;

  // Animație elastică (jelly) doar când se schimbă categoria — nu la fiecare tastă
  if (result.cls !== _lastBmiCls) {
    const fig = panel.querySelector('.bmi-fig');
    fig?.classList.add('bmi-jelly');
    _lastBmiCls = result.cls;
  }
}

// ── Restore saved values ──────────────────────────────────────────────────────
function restoreSelection(s) {
  const opts = _container.querySelectorAll('.opt-card');
  if (s.tip === 'single') {
    const cur = answers[s.id];
    opts.forEach(el => {
      const v = parseVal(el.dataset.val);
      if (v == cur) el.classList.add('selected');
    });
  } else if (s.tip === 'multi') {
    const cur = answers[s.id] || [];
    opts.forEach(el => {
      if (cur.includes(el.dataset.val)) el.classList.add('selected');
    });
  } else if (s.tip === 'equipment') {
    const curEq  = answers.echipament || [];
    opts.forEach(el => {
      const v = el.dataset.val;
      if (curEq.includes(v)) el.classList.add('selected');
    });
  }
}

// ── Event handlers ────────────────────────────────────────────────────────────
function attachOptionHandlers(s) {
  if (s.tip === 'single') {
    _container.querySelectorAll('.opt-card').forEach(el => {
      el.addEventListener('click', () => {
        _container.querySelectorAll('.opt-card').forEach(e => {
          e.classList.remove('selected');
          e.querySelector('.opt-radio')?.classList.remove('checked');
        });
        el.classList.add('selected');
        el.querySelector('.opt-radio')?.classList.add('checked');
        answers[s.id] = parseVal(el.dataset.val);
        validateNext();
      });
    });
  }

  if (s.tip === 'multi') {
    _container.querySelectorAll('.opt-card').forEach(el => {
      el.addEventListener('click', () => {
        const val  = el.dataset.val;
        const excl = el.dataset.excl === '1';
        const cur  = answers[s.id] || [];

        if (excl) {
          answers[s.id] = cur.includes(val) ? [] : [val];
          _container.querySelectorAll('.opt-card').forEach(e => {
            e.classList.remove('selected');
            e.querySelector('.opt-check')?.classList.remove('checked');
          });
          if (!cur.includes(val)) {
            el.classList.add('selected');
            el.querySelector('.opt-check')?.classList.add('checked');
          }
          return;
        }

        // Remove exclusive if present
        const exclEl = _container.querySelector('[data-excl="1"]');
        if (exclEl) {
          exclEl.classList.remove('selected');
          exclEl.querySelector('.opt-check')?.classList.remove('checked');
          answers[s.id] = (answers[s.id] || []).filter(v => v !== exclEl.dataset.val);
        }

        if (cur.includes(val)) {
          answers[s.id] = cur.filter(v => v !== val);
          el.classList.remove('selected');
          el.querySelector('.opt-check')?.classList.remove('checked');
        } else {
          if (s.max && cur.filter(v => v !== 'niciuna').length >= s.max) return;
          answers[s.id] = [...cur, val];
          el.classList.add('selected');
          el.querySelector('.opt-check')?.classList.add('checked');
        }
        validateNext();
      });
    });
  }

  if (s.tip === 'equipment') {
    const SALA_ALL = ['corp','centura_greutati','banda','gantera','haltera','banca','rack','bara tractiuni','scripete'];

    _container.querySelectorAll('.opt-card[data-group="equip"]').forEach(el => {
      el.addEventListener('click', () => {
        const val = el.dataset.val;

        if (val === '_sala') {
          const allSelected = SALA_ALL.every(v => answers.echipament.includes(v));
          if (allSelected) {
            answers.echipament = ['corp'];
            _container.querySelectorAll('[data-group="equip"]').forEach(e => {
              if (SALA_ALL.includes(e.dataset.val) || e.dataset.val === '_sala') {
                e.classList.remove('selected');
                e.querySelector('.opt-check')?.classList.remove('checked');
              }
            });
            const corpEl = _container.querySelector('[data-val="corp"]');
            if (corpEl) { corpEl.classList.add('selected'); corpEl.querySelector('.opt-check')?.classList.add('checked'); }
          } else {
            answers.echipament = [...SALA_ALL];
            el.classList.add('selected'); el.querySelector('.opt-check')?.classList.add('checked');
            SALA_ALL.forEach(v => {
              const e = _container.querySelector(`[data-val="${v}"]`);
              if (e) { e.classList.add('selected'); e.querySelector('.opt-check')?.classList.add('checked'); }
            });
          }
          return;
        }

        if (answers.echipament.includes(val)) {
          if (val === 'corp') return; // corp always required
          answers.echipament = answers.echipament.filter(v => v !== val);
          el.classList.remove('selected'); el.querySelector('.opt-check')?.classList.remove('checked');
        } else {
          answers.echipament = [...answers.echipament, val];
          el.classList.add('selected'); el.querySelector('.opt-check')?.classList.add('checked');
        }
      });
    });
  }

  if (s.tip === 'measurements') {
    const inpH = document.getElementById('inp-inaltime');
    const inpG = document.getElementById('inp-greutate');
    const onInput = () => {
      const h = parseFloat(inpH.value);
      const g = parseFloat(inpG.value);
      answers.inaltime = (!isNaN(h) && h >= 130 && h <= 230) ? h : null;
      answers.greutate = (!isNaN(g) && g >= 30  && g <= 300) ? g : null;
      updateBMIPanel();
      validateNext();
    };
    inpH.addEventListener('input', onInput);
    inpG.addEventListener('input', onInput);
    updateBMIPanel(); // valori pre-completate în edit mode
    // Focus first empty field
    if (!answers.inaltime) inpH.focus();
    else if (!answers.greutate) inpG.focus();
  }
}

function parseVal(v) {
  if (v === 'true')  return true;
  if (v === 'false') return false;
  const n = Number(v);
  return isNaN(n) ? v : n;
}

function validateNext() {
  const s   = STEPS[step];
  const btn = document.getElementById('ob-next');
  if (!btn) return;

  let ok = true;
  if (s.tip === 'single')       ok = answers[s.id] !== null && answers[s.id] !== undefined;
  if (s.tip === 'multi')        ok = true;
  if (s.tip === 'equipment')    ok = answers.echipament.length > 0;
  if (s.tip === 'measurements') ok = true; // optional fields

  btn.disabled = !ok;
  btn.style.opacity = ok ? '1' : '0.4';
}

// ── Navigation ────────────────────────────────────────────────────────────────
function handleBack() {
  if (step > 0) { step--; render(); }
}

async function handleNext() {
  if (step < STEPS.length - 1) {
    step++;
    render();
    return;
  }

  // Last step → generate
  const btn = document.getElementById('ob-next');
  btn.disabled = true;
  btn.textContent = 'Se generează...';

  try {
    const profile = buildProfile();
    const splitId = getRecommendedSplit(profile.zile, profile.experienta, profile.obiectiv);
    const program = await generateProgram(profile, splitId);

    // Păstrăm istoricul de antrenamente dacă userul doar își modifică preferințele
    const existing = loadData();
    const data = {
      profile, program,
      antrenamente: existing?.antrenamente || [],
      preferinte: existing?.preferinte || { nu_imi_place: [], ma_doare: [] },
      program_salvat: false,
    };
    saveData(data);
    _onComplete(data);
  } catch (e) {
    console.error('Generator error:', e);
    btn.disabled = false;
    btn.textContent = 'Încearcă din nou';
  }
}

function buildProfile() {
  // Configurarea de skandenberg (din mini-onboarding-ul dedicat) se păstrează
  // la re-editarea profilului — nu se resetează.
  const prev = loadData()?.profile;
  return {
    gen:               answers.gen,
    inaltime:          answers.inaltime,
    greutate:          answers.greutate,
    obiectiv:          answers.obiectiv,
    zile:              answers.zile,
    timp:              answers.timp,
    experienta:        answers.experienta,
    echipament:        answers.echipament.filter(v => v !== '_sala'),
    manere:            prev?.manere?.length ? [...prev.manere] : [],
    grupe_prioritare:  answers.grupe_prioritare,
    articulatii_sensibile: answers.articulatii.filter(v => v !== 'niciuna'),
    skandenberg:       false,
    stil_skandenberg:  prev?.stil_skandenberg ?? null,
    interfata:         'completa',
  };
}
