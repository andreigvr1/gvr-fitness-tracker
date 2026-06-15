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
