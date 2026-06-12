// View switching and navigation management

import { loadData } from '../storage.js';

export class ViewManager {
  constructor(data) {
    this.data = data;
  }

  showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
    this.updateNav(id);
    window.scrollTo(0, 0);
  }

  updateNav(viewId) {
    const nav = document.getElementById('app-nav');
    if (!nav) return;

    // Read fresh data from storage to check current program_salvat status
    const currentData = loadData();

    // Nav only visible after program saved; hidden during onboarding, workout and skandenberg config
    const NAV_VIEWS = ['view-dashboard', 'view-program', 'view-profil', 'view-statistici', 'view-calendar'];
    const visible = currentData?.program_salvat && NAV_VIEWS.includes(viewId);
    nav.hidden = !visible;
    document.body.classList.toggle('has-nav', visible);

    nav.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active',
        (b.dataset.nav === 'dashboard' && viewId === 'view-dashboard') ||
        (b.dataset.nav === 'program' && viewId === 'view-program') ||
        (b.dataset.nav === 'statistici' && viewId === 'view-statistici') ||
        (b.dataset.nav === 'profil' && viewId === 'view-profil'));
    });
  }

  isNavVisible() {
    return document.getElementById('app-nav')?.hidden === false;
  }

  hideNav() {
    const nav = document.getElementById('app-nav');
    if (nav) nav.hidden = true;
    document.body.classList.remove('has-nav');
  }
}
