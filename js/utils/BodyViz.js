// BodyViz — calcul BMI + siluetă-caricatură SVG
// Silueta e desenată procedural și exagerată comic spre extreme:
// subponderal = băț cu cap mare, obez = balon cu cap mic relativ.

export function bmiCategory(bmi) {
  if (bmi < 18.5) return { id: 'sub',  label: 'Subponderal',      cls: 'bmi-sub'  };
  if (bmi < 25)   return { id: 'norm', label: 'Greutate normală', cls: 'bmi-norm' };
  if (bmi < 30)   return { id: 'over', label: 'Supraponderal',    cls: 'bmi-over' };
  return            { id: 'obez', label: 'Obezitate',         cls: 'bmi-obez' };
}

// Factor de exagerare per categorie — intenționat caricatural la extreme
const FAT = { sub: 0.55, norm: 1.0, over: 1.55, obez: 2.3 };

export function silhouetteSVG(gen, catId) {
  const F   = FAT[catId] ?? 1;
  const fem = gen === 'feminin';

  // jumătăți de lățime de bază (viewBox 100 × 200)
  const base = fem
    ? { um: 16, ta: 12, so: 20, picior: 8.5 }
    : { um: 21, ta: 15, so: 17, picior: 9 };

  // Talia explodează cu F, umerii cresc puțin — capul rămâne fix → efect comic
  const um = Math.min(base.um * (1 + (F - 1) * 0.3), 34);
  const ta = Math.min(base.ta * F, 42);
  const so = Math.min(base.so * (1 + (F - 1) * 0.75), 40);
  const pi = base.picior * (1 + (F - 1) * 0.45);

  const cx = 50;
  // Burta: la over/obez talia se umflă în afară (control points împinse lateral)
  const burta = F > 1 ? ta * 1.15 : ta;

  const body = `
    M ${cx - um} 42
    C ${cx - um - 2} 56, ${cx - burta} 62, ${cx - burta} 80
    C ${cx - burta} 96, ${cx - so} 100, ${cx - so} 112
    L ${cx + so} 112
    C ${cx + so} 100, ${cx + burta} 96, ${cx + burta} 80
    C ${cx + burta} 62, ${cx + um + 2} 56, ${cx + um} 42
    C ${cx + um * 0.55} 36, ${cx - um * 0.55} 36, ${cx - um} 42 Z`;

  const legL = `M ${cx - so} 110 L ${cx - 2} 110 L ${cx - 4} 190 L ${cx - 4 - pi} 190 Z`;
  const legR = `M ${cx + 2} 110 L ${cx + so} 110 L ${cx + 4 + pi} 190 L ${cx + 4} 190 Z`;

  return `
    <svg viewBox="0 0 100 200" class="bmi-fig" aria-hidden="true">
      <circle cx="${cx}" cy="22" r="12"/>
      <path d="${body}"/>
      <path d="${legL}"/>
      <path d="${legR}"/>
    </svg>`;
}

// HTML-ul complet al panoului BMI (siluetă + valoare + etichetă)
export function bmiPanelHTML(gen, inaltime, greutate) {
  if (!inaltime || !greutate) return null;
  const bmi = greutate / Math.pow(inaltime / 100, 2);
  const cat = bmiCategory(bmi);
  return {
    cls: cat.cls,
    html: `
      ${silhouetteSVG(gen, cat.id)}
      <div class="bmi-info">
        <div class="bmi-value">BMI ${bmi.toFixed(1).replace('.', ',')}</div>
        <div class="bmi-label">${cat.label}</div>
      </div>`,
  };
}
