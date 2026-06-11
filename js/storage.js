const KEY = 'gvr-data-v1';

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveData(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, _savedAt: Date.now() }));
  } catch (e) {
    console.error('GVR: save failed', e);
  }
}

export function clearData() {
  localStorage.removeItem(KEY);
}
