// Mini-onboarding Skandenberg — colectează stilul + echipamentul dedicat (spec cap. 8).
// IMPORTANT: salvează DOAR configurarea (stil_skandenberg, manere). Flag-ul
// profile.skandenberg rămâne false — generatorul nu adaugă blocul până la
// reactivarea oficială a modulului (v1.1). Programul utilizatorului NU se schimbă.

import { loadData, saveData } from './storage.js';

const STILURI = [
  { val: 'top_roll', label: 'Top roll',
    sub: 'Stilul de exterior: ataci degetele și încheietura adversarului. Tehnic, bazat pe antebraț.' },
  { val: 'hook', label: 'Hook',
    sub: 'Stilul de interior: lupți „în cârlig”, cu brațul aproape de corp. Bazat pe biceps și încheietură.' },
  { val: 'presa', label: 'Presă',
    sub: 'Împingi peste braț, cu tricepsul și umărul. Cere forță statică și stabilitate.' },
  { val: 'baza', label: 'Nu știu încă — bază generală',
    sub: 'Primești blocul echilibrat: cupping, pronație, rise și grip. Alegerea sigură la început.' },
];

// Valorile corespund 1:1 cu echipamentul din data/exercises.json (exercițiile skandenberg-*)
const ECHIPAMENT = [
  { val: 'masa',               label: 'Masă de skandenberg' },
  { val: 'centura judo',       label: 'Centură de judo (la scripete)' },
  { val: 'FG',                 label: 'Fat Gripz / manșoane groase' },
  { val: 'maner-rotativ',      label: 'Mâner rotativ (rolling handle)' },
  { val: 'maner-multi-grip',   label: 'Mâner gros / multi-grip' },
  { val: 'maner-excentric',    label: 'Mâner excentric (offset)' },
  { val: 'maner-wrist-wrench', label: 'Wrist wrench' },
];

const STIL_LABEL = Object.fromEntries(STILURI.map(s => [s.val, s.label]));

let _container = null;
let _onDone = null;
let _step = 0;
let _stil = null;
let _manere = [];

export function initSkandConfig(container, onDone) {
  _container = container;
  _onDone = onDone;
  _step = 0;

  const existing = loadData()?.profile;
  _stil = existing?.stil_skandenberg ?? null;
  _manere = existing?.manere?.length ? [...existing.manere] : [];

  render();
}

function render() {
  if (_step === 2) { renderConfirm(); return; }

  const isStil = _step === 0;
  const pct = (_step / 2) * 100;

  _container.innerHTML = `
    <div class="ob-wrap">
      <div class="ob-top">
        <div class="ob-progress-track"><div class="ob-progress-fill" style="width:${pct}%"></div></div>
        <div class="ob-step-label">${_step + 1} din 2</div>
        <button class="btn-ob-close" id="sk-close" title="Închide">✕</button>
      </div>
      <div class="ob-body">
        <div class="prog-badge">Skandenberg · pregătire</div>
        <h2 class="ob-question">${isStil ? 'Ce stil tragi?' : 'Ce echipament dedicat ai?'}</h2>
        <p class="ob-hint">${isStil
          ? 'Stilul decide compoziția viitorului bloc de antrenament dedicat.'
          : 'Bifează ce ai — deblochează variantele specifice de exerciții. Poți lăsa gol.'}</p>
        <div class="ob-options" id="sk-opts">
          ${isStil ? renderStilOptions() : renderEchipOptions()}
        </div>
      </div>
      <div class="ob-nav">
        ${_step > 0 ? '<button class="btn btn-ghost" id="sk-back">← Înapoi</button>' : '<div></div>'}
        <button class="btn btn-primary" id="sk-next" ${isStil && !_stil ? 'disabled' : ''}>
          ${_step === 1 ? 'Salvează configurarea →' : 'Continuă →'}
        </button>
      </div>
    </div>`;

  document.getElementById('sk-close').addEventListener('click', () => _onDone?.(false));
  document.getElementById('sk-back')?.addEventListener('click', () => { _step--; render(); });
  document.getElementById('sk-next').addEventListener('click', handleNext);
  attachHandlers(isStil);
}

function renderStilOptions() {
  return STILURI.map(s => `
    <label class="opt-card ${_stil === s.val ? 'selected' : ''}" data-val="${s.val}">
      <div class="opt-radio ${_stil === s.val ? 'checked' : ''}"></div>
      <div class="opt-text">
        <span class="opt-label">${s.label}</span>
        <span class="opt-sub">${s.sub}</span>
      </div>
    </label>`).join('');
}

function renderEchipOptions() {
  return ECHIPAMENT.map(e => `
    <label class="opt-card compact ${_manere.includes(e.val) ? 'selected' : ''}" data-val="${e.val}">
      <div class="opt-check ${_manere.includes(e.val) ? 'checked' : ''}"></div>
      <div class="opt-text"><span class="opt-label">${e.label}</span></div>
    </label>`).join('');
}

function attachHandlers(isStil) {
  _container.querySelectorAll('.opt-card').forEach(el => {
    el.addEventListener('click', () => {
      const val = el.dataset.val;
      if (isStil) {
        _stil = val;
        _container.querySelectorAll('.opt-card').forEach(e => {
          e.classList.toggle('selected', e.dataset.val === val);
          e.querySelector('.opt-radio')?.classList.toggle('checked', e.dataset.val === val);
        });
        const next = document.getElementById('sk-next');
        next.disabled = false;
      } else {
        if (_manere.includes(val)) {
          _manere = _manere.filter(v => v !== val);
          el.classList.remove('selected');
          el.querySelector('.opt-check')?.classList.remove('checked');
        } else {
          _manere = [..._manere, val];
          el.classList.add('selected');
          el.querySelector('.opt-check')?.classList.add('checked');
        }
      }
    });
  });
}

function handleNext() {
  if (_step === 0) { _step = 1; render(); return; }

  // Salvare aditivă — flag-ul skandenberg NU se atinge (rămâne false până la activarea modulului)
  const d = loadData();
  if (d?.profile) {
    d.profile.stil_skandenberg = _stil;
    d.profile.manere = [..._manere];
    saveData(d);
  }
  _step = 2;
  render();
}

function renderConfirm() {
  _container.innerHTML = `
    <div class="ob-wrap">
      <div class="ob-body sk-confirm">
        <div class="sk-confirm-ico">💪</div>
        <h2 class="ob-question">Configurare salvată</h2>
        <div class="profil-card">
          <div class="profil-row">
            <span class="profil-key">Stil</span>
            <span class="profil-val">${STIL_LABEL[_stil] || '—'}</span>
          </div>
          <div class="profil-row">
            <span class="profil-key">Echipament dedicat</span>
            <span class="profil-val">${_manere.length ? `${_manere.length} ${_manere.length === 1 ? 'articol' : 'articole'}` : 'Niciunul'}</span>
          </div>
        </div>
        <p class="ob-hint sk-confirm-note">
          Modulul de antrenament pentru skandenberg se activează într-o versiune viitoare —
          <strong>programul tău de azi nu se schimbă</strong>. Configurarea te așteaptă
          și o poți modifica oricând de pe cardul Skandenberg.
        </p>
      </div>
      <div class="ob-nav">
        <div></div>
        <button class="btn btn-primary" id="sk-done">Înapoi la panou →</button>
      </div>
    </div>`;
  document.getElementById('sk-done').addEventListener('click', () => _onDone?.(true));
}
