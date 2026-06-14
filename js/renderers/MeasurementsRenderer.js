// Secțiunea „Măsurători" din Profil: jurnal de măsurători de corp în timp, cu grafice.
// Schema: data.masuratori = [{ data, greutate, talie, brat, piept, antebrat }] (aditiv).

import { loadData, saveData } from '../storage.js';

const METRICS = [
  { key: 'greutate', label: 'Greutate', unit: 'kg', step: '0.1' },
  { key: 'talie',    label: 'Talie',    unit: 'cm', step: '0.5' },
  { key: 'brat',     label: 'Braț',     unit: 'cm', step: '0.5' },
  { key: 'piept',    label: 'Piept',    unit: 'cm', step: '0.5' },
  { key: 'antebrat', label: 'Antebraț', unit: 'cm', step: '0.5', optional: true },
];

export class MeasurementsRenderer {
  constructor(container, onChange) {
    this.container = container;
    this.onChange = onChange; // re-randează profilul (BMI) după ce se schimbă greutatea
  }

  render() {
    const data = loadData() || {};
    const list = (data.masuratori || []).slice().sort((a, b) => a.data - b.data);
    this.container.innerHTML = this.sectionHTML(list);
    this.container.querySelector('#btn-add-meas')?.addEventListener('click', () => this.showAddModal());
  }

  sectionHTML(list) {
    const cards = METRICS.map(m => {
      const pts = list.filter(e => e[m.key] != null).map(e => ({ x: e.data, v: e[m.key] }));
      if (!pts.length) return '';
      const last = pts[pts.length - 1];
      const delta = pts.length >= 2 ? +(last.v - pts[0].v).toFixed(1) : 0;
      const deltaCls = delta > 0 ? 'up' : delta < 0 ? 'down' : '';
      const deltaTxt = delta > 0 ? `+${delta} ${m.unit}` : delta < 0 ? `${delta} ${m.unit}` : 'stabil';
      return `
        <div class="meas-card">
          <div class="meas-card-head">
            <span class="meas-card-label">${m.label}</span>
            <span class="meas-card-val">${last.v} <small>${m.unit}</small></span>
          </div>
          ${pts.length >= 2
            ? this.chartSVG(pts, m.unit) +
              `<div class="meas-delta ${deltaCls}">${deltaTxt} față de prima măsurătoare</div>`
            : `<div class="meas-single">o singură măsurătoare — mai adaugă una ca să vezi evoluția</div>`}
        </div>`;
    }).join('');

    const empty = !list.length
      ? `<div class="meas-empty">Încă nu ai măsurători. Adaugă prima ca să-ți urmărești evoluția în timp (greutate, talie, brațe...).</div>`
      : '';

    return `
      <div class="profil-section-title">Măsurători</div>
      ${empty}
      ${cards ? `<div class="meas-cards">${cards}</div>` : ''}
      <button class="btn btn-ghost" id="btn-add-meas">+ Adaugă măsurătoare</button>`;
  }

  chartSVG(pts, unit) {
    const W = 300, H = 116, padL = 30, padR = 12, padT = 12, padB = 16;
    const vals = pts.map(p => p.v);
    const min = Math.min(...vals), max = Math.max(...vals);
    const span = (max - min) || 1;
    const x = i => padL + (pts.length === 1 ? 0 : (i / (pts.length - 1)) * (W - padL - padR));
    const y = v => padT + (1 - (v - min) / span) * (H - padT - padB);
    const line = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const dots = vals.map((v, i) =>
      `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" fill="var(--accent)" stroke="var(--surf)" stroke-width="1.5"/>`).join('');
    const fnum = "'Bricolage Grotesque',system-ui,sans-serif";
    return `<svg viewBox="0 0 ${W} ${H}" class="meas-svg" role="img" aria-label="Evoluție ${unit}">
      <text x="${padL - 6}" y="${y(max) + 4}" text-anchor="end" fill="var(--t3)" font-size="9" font-family="${fnum}">${max}</text>
      <text x="${padL - 6}" y="${y(min) + 4}" text-anchor="end" fill="var(--t3)" font-size="9" font-family="${fnum}">${min}</text>
      <polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}
    </svg>`;
  }

  showAddModal() {
    const ov = document.createElement('div');
    ov.className = 'modal';
    ov.style.display = 'flex';
    ov.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <h2 class="confirm-title">Adaugă măsurătoare</h2>
        <p class="confirm-text">Completează ce vrei — restul le poți lăsa goale.</p>
        <div class="meas-form">
          ${METRICS.map(m => `
            <div class="meas-form-row">
              <label class="meas-form-lbl" for="mf-${m.key}">${m.label}${m.optional ? ' <small>(opțional)</small>' : ''}</label>
              <div class="meas-input-wrap">
                <input id="mf-${m.key}" class="meas-input" type="number" inputmode="decimal" step="${m.step}" min="0" placeholder="—">
                <span class="meas-unit">${m.unit}</span>
              </div>
            </div>`).join('')}
        </div>
        <div class="confirm-actions">
          <button class="btn btn-ghost" data-act="cancel">Anulează</button>
          <button class="btn btn-primary" data-act="save">Salvează</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.querySelector('.modal-overlay').addEventListener('click', close);
    ov.querySelector('[data-act="cancel"]').addEventListener('click', close);
    ov.querySelector('[data-act="save"]').addEventListener('click', () => {
      const entry = { data: Date.now() };
      let any = false;
      METRICS.forEach(m => {
        const v = parseFloat(document.getElementById(`mf-${m.key}`).value);
        if (!isNaN(v) && v > 0) { entry[m.key] = v; any = true; } else { entry[m.key] = null; }
      });
      if (!any) { close(); return; }
      const d = loadData() || {};
      d.masuratori = Array.isArray(d.masuratori) ? d.masuratori : [];
      d.masuratori.push(entry);
      // Greutatea e sursa unică pentru BMI/generare — o sincronizăm cu profilul.
      if (entry.greutate != null && d.profile) d.profile.greutate = entry.greutate;
      saveData(d);
      close();
      this.onChange?.();
    });
  }
}
