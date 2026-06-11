// View switching and navigation management

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

    // Nav only visible after program saved; hidden during onboarding and workout
    const visible = this.data?.program_salvat && (viewId === 'view-dashboard' || viewId === 'view-program');
    nav.hidden = !visible;
    document.body.classList.toggle('has-nav', visible);

    nav.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active',
        (b.dataset.nav === 'dashboard' && viewId === 'view-dashboard') ||
        (b.dataset.nav === 'program' && viewId === 'view-program'));
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
