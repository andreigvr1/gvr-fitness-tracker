import { generateProgram, getRecommendedSplit, getSplitsForZile } from './generator.js';
import { saveData, loadData } from './storage.js';

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
    id: 'seriozitate',
    q: 'Cât de serios vrei să iei antrenamentul?',
    tip: 'single',
    opt: [
      { val: 'sanatate', label: 'Vreau să mă mișc și să fiu sănătos',       sub: 'Interfață simplă, fără cifre complicate' },
      { val: 'serios',   label: 'Vreau rezultate serioase (forță / mușchi)', sub: 'Interfață completă, progresie precisă' },
    ],
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
      { val: 2, label: '2 zile', sub: 'Full body A/B' },
      { val: 3, label: '3 zile', sub: 'Full body A/B/C' },
      { val: 4, label: '4 zile', sub: 'Upper / Lower × 2' },
      { val: 5, label: '5 zile', sub: 'Upper / Lower / P/P/L' },
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
  {
    id: 'skandenberg',
    q: 'Vrei modulul de skandenberg / armwrestling?',
    tip: 'skand',
  },
];

// ── State ────────────────────────────────────────────────────────────────────
let step = 0;
let answers = {
  gen: null,
  seriozitate: null, obiectiv: null, zile: null, timp: null, experienta: null,
  echipament: ['corp'], manere: [],
  grupe_prioritare: [], articulatii: [],
  skandenberg: false, stil_skandenberg: null,
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
      seriozitate:      p.seriozitate    ?? null,
      obiectiv:         p.obiectiv       ?? null,
      zile:             p.zile           ?? null,
      timp:             p.timp           ?? null,
      experienta:       p.experienta     ?? null,
      echipament:       p.echipament?.length ? [...p.echipament] : ['corp'],
      manere:           p.manere         ? [...p.manere] : [],
      grupe_prioritare: p.grupe_prioritare ? [...p.grupe_prioritare] : [],
      articulatii:      p.articulatii_sensibile?.length
                          ? [...p.articulatii_sensibile]
                          : ['niciuna'],
      skandenberg:      p.skandenberg    ?? false,
      stil_skandenberg: p.stil_skandenberg ?? null,
    };
  } else {
    answers = {
      gen: null,
      seriozitate: null, obiectiv: null, zile: null, timp: null, experienta: null,
      echipament: ['corp'], manere: [],
      grupe_prioritare: [], articulatii: [],
      skandenberg: false, stil_skandenberg: null,
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

  if (s.tip === 'equipment') return renderEquipment();
  if (s.tip === 'skand')     return renderSkand();
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
  const skandItems = [
    { val: 'masa',         label: 'Masă de skandenberg' },
    { val: 'centura judo', label: 'Centură de judo' },
    { val: 'FG',           label: 'Fat Gripz / manșoane' },
  ];
  const manereItems = [
    { val: 'maner-rotativ',      label: 'Mâner rotativ (rolling handle)' },
    { val: 'maner-conic',        label: 'Mâner conic (cone grip)' },
    { val: 'maner-multi-grip',   label: 'Mâner multi-grip / gros (2–3")' },
    { val: 'maner-excentric',    label: 'Mâner excentric (offset)' },
    { val: 'maner-wrist-wrench', label: 'Wrist wrench' },
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
    <div class="equip-section" style="margin-top:16px">
      <div class="equip-title">Skandenberg / Armwrestling</div>
      ${eq(skandItems)}
      <div class="equip-title" style="margin-top:10px; font-size:11px">Mânere deținute</div>
      ${eq(manereItems)}
    </div>`;
}

function renderSkand() {
  const sel = answers.skandenberg;
  const stilOpt = [
    { val: 'top_roll', label: 'Top roll',              sub: 'Cupping + pronation + rise' },
    { val: 'hook',     label: 'Hook (cârlig)',          sub: 'Flexie profundă + biceps static' },
    { val: 'presa',    label: 'Presă (triceps press)',  sub: 'Triceps static + side pressure' },
    { val: 'baza',     label: 'Nu știu încă / bază',   sub: 'Bloc echilibrat' },
  ];

  return `
    <label class="opt-card" data-val="false" data-single-skand>
      <div class="opt-radio ${sel === false ? 'checked' : ''}"></div>
      <div class="opt-text"><span class="opt-label">Nu, mulțumesc</span></div>
    </label>
    <label class="opt-card" data-val="true" data-single-skand>
      <div class="opt-radio ${sel === true ? 'checked' : ''}"></div>
      <div class="opt-text"><span class="opt-label">Da, activează modulul</span></div>
    </label>
    <div id="skand-stil" style="display:${sel ? 'block' : 'none'}; margin-top:16px">
      <p class="ob-hint" style="margin-bottom:10px">Ce stil tragi / vrei să dezvolți?</p>
      ${stilOpt.map(o => `
        <label class="opt-card compact" data-val="${o.val}" data-stil>
          <div class="opt-radio ${answers.stil_skandenberg === o.val ? 'checked' : ''}"></div>
          <div class="opt-text">
            <span class="opt-label">${o.label}</span>
            <span class="opt-sub">${o.sub}</span>
          </div>
        </label>`).join('')}
    </div>`;
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
    const curMan = answers.manere || [];
    opts.forEach(el => {
      const v = el.dataset.val;
      if (curEq.includes(v) || curMan.includes(v)) el.classList.add('selected');
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
    const MANERE   = ['maner-rotativ','maner-conic','maner-multi-grip','maner-excentric','maner-wrist-wrench'];

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

        if (MANERE.includes(val)) {
          if (answers.manere.includes(val)) {
            answers.manere = answers.manere.filter(v => v !== val);
            el.classList.remove('selected'); el.querySelector('.opt-check')?.classList.remove('checked');
          } else {
            answers.manere = [...answers.manere, val];
            el.classList.add('selected'); el.querySelector('.opt-check')?.classList.add('checked');
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

  if (s.tip === 'skand') {
    _container.querySelectorAll('[data-single-skand]').forEach(el => {
      el.addEventListener('click', () => {
        _container.querySelectorAll('[data-single-skand]').forEach(e => {
          e.classList.remove('selected');
          e.querySelector('.opt-radio')?.classList.remove('checked');
        });
        el.classList.add('selected');
        el.querySelector('.opt-radio')?.classList.add('checked');
        answers.skandenberg = el.dataset.val === 'true';
        document.getElementById('skand-stil').style.display = answers.skandenberg ? 'block' : 'none';
        if (!answers.skandenberg) answers.stil_skandenberg = null;
        validateNext();
      });
    });

    _container.querySelectorAll('[data-stil]').forEach(el => {
      el.addEventListener('click', () => {
        _container.querySelectorAll('[data-stil]').forEach(e => {
          e.classList.remove('selected');
          e.querySelector('.opt-radio')?.classList.remove('checked');
        });
        el.classList.add('selected');
        el.querySelector('.opt-radio')?.classList.add('checked');
        answers.stil_skandenberg = el.dataset.val;
        validateNext();
      });
    });
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
  if (s.tip === 'single')    ok = answers[s.id] !== null && answers[s.id] !== undefined;
  if (s.tip === 'multi')     ok = true; // multi allows 0 selections
  if (s.tip === 'equipment') ok = answers.echipament.length > 0;
  if (s.tip === 'skand')     ok = answers.skandenberg !== null && (!answers.skandenberg || answers.stil_skandenberg !== null);

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
  return {
    gen:               answers.gen,
    seriozitate:       answers.seriozitate,
    obiectiv:          answers.obiectiv,
    zile:              answers.zile,
    timp:              answers.timp,
    experienta:        answers.experienta,
    echipament:        answers.echipament.filter(v => v !== '_sala'),
    manere:            answers.manere,
    grupe_prioritare:  answers.grupe_prioritare,
    articulatii_sensibile: answers.articulatii.filter(v => v !== 'niciuna'),
    skandenberg:       answers.skandenberg,
    stil_skandenberg:  answers.stil_skandenberg,
    interfata:         answers.seriozitate === 'sanatate' ? 'simpla' : 'completa',
  };
}
