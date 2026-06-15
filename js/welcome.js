// Ecrane de welcome / tur de funcții — primul lucru pe care îl vede un utilizator nou.
// Scop: să nu te lovească onboarding-ul în față. La final → onboarding (creare profil).

import { ICONS } from './utils/Constants.js';

const SLIDES = [
  { icon: ICONS.bolt,  title: 'GVR Fitness',          text: 'Antrenamente pe măsura ta, fără bătăi de cap.' },
  { icon: ICONS.list,  title: 'Program personalizat', text: 'Generăm split-ul și exercițiile după echipamentul și obiectivul tău.' },
  { icon: ICONS.up,    title: 'Ghidaj la fiecare set', text: 'Calibrăm greutatea potrivită și-ți spunem când e timpul să crești.' },
  { icon: ICONS.chart, title: 'Progresul, vizibil',    text: 'Istoric, recorduri, măsurători și analiză — totul pe telefonul tău.' },
];

export function initWelcome(container, onStart) {
  let i = 0;

  const render = () => {
    const s = SLIDES[i];
    const last = i === SLIDES.length - 1;
    container.innerHTML = `
      <div class="welcome-wrap">
        <button class="welcome-skip" id="wc-skip">Sari peste</button>
        <div class="welcome-slide">
          <div class="welcome-ico">${s.icon}</div>
          <h1 class="welcome-title">${s.title}</h1>
          <p class="welcome-text">${s.text}</p>
        </div>
        <div class="welcome-dots">
          ${SLIDES.map((_, k) => `<span class="welcome-dot ${k === i ? 'active' : ''}"></span>`).join('')}
        </div>
        <button class="btn btn-primary btn-full welcome-cta" id="wc-next">${last ? 'Începe' : 'Continuă'}</button>
      </div>`;

    container.querySelector('#wc-next').addEventListener('click', () => {
      if (last) onStart(); else { i++; render(); }
    });
    container.querySelector('#wc-skip').addEventListener('click', () => onStart());
  };

  render();
}

// Ecran de alegere după welcome: mod simplu (construiești singur) vs personalizat (onboarding).
export function initChoice(container, { onSimplu, onPersonalizat }) {
  container.innerHTML = `
    <div class="setup-wrap">
      <h1 class="setup-title">Cum vrei să începi?</h1>
      <p class="setup-sub">Poți trece oricând la varianta personalizată mai târziu.</p>
      <button class="choice-card" id="ch-simplu">
        <span class="choice-ico">${ICONS.list}</span>
        <span class="choice-h">Construiește-ți singur programul</span>
        <span class="choice-d">Alegi zilele și exercițiile, fără întrebări. Loghezi și urmărești progresul.</span>
      </button>
      <button class="choice-card" id="ch-perso">
        <span class="choice-ico">${ICONS.bolt}</span>
        <span class="choice-h">Program personalizat</span>
        <span class="choice-d">Răspunzi la câteva întrebări și primești un program generat pe măsura ta, plus toate funcțiile.</span>
      </button>
    </div>`;
  container.querySelector('#ch-simplu').addEventListener('click', onSimplu);
  container.querySelector('#ch-perso').addEventListener('click', onPersonalizat);
}

// Mod simplu, pasul „câte zile?" → creează programul gol cu N zile.
export function initDaysPicker(container, onDone, onBack) {
  container.innerHTML = `
    <div class="setup-wrap">
      <button class="welcome-skip setup-back" id="dp-back">‹ Înapoi</button>
      <h1 class="setup-title">Câte zile pe săptămână?</h1>
      <p class="setup-sub">Creăm zilele goale, apoi adaugi exercițiile tale.</p>
      <div class="days-opts">
        ${[2, 3, 4, 5, 6].map(n => `<button class="day-opt" data-n="${n}">${n} zile</button>`).join('')}
      </div>
    </div>`;
  container.querySelector('#dp-back').addEventListener('click', onBack);
  container.querySelectorAll('.day-opt').forEach(b =>
    b.addEventListener('click', () => onDone(+b.dataset.n)));
}
