// DataTransfer — export/import al datelor utilizatorului (.json)
//
// Plasă de siguranță în lipsa unui cont online: localStorage poate fi șters de browser
// (spațiu redus, curățare istoric, reinstalare). Export = backup descărcabil; Import =
// restaurare cu confirmare. Spec: docs/drum_spre_v1.md §2.1.

import { loadData } from '../storage.js';

const SCHEMA = 'gvr-data-v1';

const GEN_LBL = { masculin: 'bărbat', feminin: 'femeie' };
const OBJ_LBL = { sanatate: 'sănătate', masa: 'masă', forta: 'forță', anduranta: 'anduranță' };

function pad(n) { return String(n).padStart(2, '0'); }
function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

// Construiește pachetul de backup și declanșează descărcarea. Întoarce false dacă n-avem date.
export function exportData(appVersion = '') {
  const data = loadData();
  if (!data) return false;

  const backup = {
    schema: SCHEMA,
    exportat_la: Date.now(),
    app_version: appVersion,
    data,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gvr-backup-${ymd(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

// Validează textul unui fișier importat. NU scrie nimic — doar verifică și rezumă.
// Întoarce { ok:true, data, summary } sau { ok:false, error }.
export function parseBackup(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Fișierul nu e un JSON valid.' };
  }

  // Acceptăm fie pachetul cu schema (export GVR), fie un blob brut care are deja `profile`.
  let blob = null;
  if (parsed && parsed.schema === SCHEMA && parsed.data && typeof parsed.data === 'object') {
    blob = parsed.data;
  } else if (parsed && typeof parsed === 'object' && parsed.profile) {
    blob = parsed;
  }

  if (!blob || typeof blob !== 'object') {
    return { ok: false, error: 'Fișier nerecunoscut — nu pare un backup GVR.' };
  }
  if (!blob.profile || typeof blob.profile !== 'object') {
    return { ok: false, error: 'Backup incomplet — lipsește profilul.' };
  }

  return { ok: true, data: blob, summary: summarize(blob) };
}

// Rezumat lizibil al unui blob de date, pentru ecranul de confirmare.
export function summarize(data) {
  const p = data.profile || {};
  const gen = GEN_LBL[p.gen] || '—';
  const obj = OBJ_LBL[p.obiectiv] || '—';
  const zile = p.zile ? `${p.zile} zile` : '—';
  const n = Array.isArray(data.antrenamente) ? data.antrenamente.length : 0;

  const ts = (data.antrenamente || []).map(a => a.data).filter(Boolean);
  const lastTs = ts.length ? Math.max(...ts) : data._savedAt;
  let last = '—';
  if (lastTs) {
    try { last = new Date(lastTs).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' }); }
    catch { last = ymd(new Date(lastTs)); }
  }

  return { gen, obj, zile, n, last };
}
