// AchievementsRenderer — ecranul „Realizări": rangul de forță + insignele.

import { ICONS } from '../utils/Constants.js';
import { ico, formatNum } from '../utils/UIHelpers.js';
import { LEVELS } from '../utils/StrengthStandards.js';
import { AchievementsEngine } from '../engines/AchievementsEngine.js';
import { loadTemplate } from '../utils/TemplateLoader.js';

const CAT_LABELS = { consecventa: 'Consecvență', forta: 'Forță' };

export class AchievementsRenderer {
  constructor(container, data) {
    this.container = container;
    this.data = data;
    this.engine = new AchievementsEngine();
  }

  async render(onBack) {
    const template = await loadTemplate('realizari');
    this.container.innerHTML = '';
    this.container.appendChild(template);

    this.renderRanks();
    this.renderBadges();

    this.container.querySelector('#ach-back')?.addEventListener('click', () => onBack?.());
  }

  renderRanks() {
    const wrap = this.container.querySelector('#ach-ranks');
    const { ranks, hasBodyweight, hasSex } = this.engine.getStrengthRanks(this.data);

    if (!hasBodyweight || !hasSex) {
      wrap.innerHTML = `<div class="ach-hint">Adaugă-ți <b>greutatea</b> și <b>sexul</b> în profil (Editează profilul) ca să-ți calculăm nivelul de forță față de alți practicanți.</div>`;
      return;
    }
    if (!ranks.length) {
      wrap.innerHTML = `<div class="ach-hint">Loghează o ridicare principală cu bara — <b>împins la piept</b>, <b>genuflexiuni</b> sau <b>îndreptări</b> — ca să vezi unde stai.</div>`;
      return;
    }

    wrap.innerHTML = ranks.map(r => `
      <div class="rank-card">
        <div class="rank-head">
          <div class="rank-name">${r.nume}</div>
          <div class="rank-best">${formatNum(r.bestKg)} kg</div>
        </div>
        <div class="rank-level">${r.level} · <span class="rank-mult">${formatNum(r.multiplier)}× greutatea ta</span></div>
        <div class="rank-bar">
          ${LEVELS.map((lvl, i) => `<div class="rank-seg ${i <= r.levelIdx ? 'on' : ''}" title="${lvl}"></div>`).join('')}
        </div>
        <div class="rank-bar-labels"><span>${LEVELS[0]}</span><span>${LEVELS[LEVELS.length - 1]}</span></div>
        <div class="rank-pct">Mai puternic decât <b>~${r.percentile}%</b> dintre cei care se antrenează, la greutatea ta.</div>
      </div>`).join('') +
      `<div class="ach-disclaimer">Praguri orientative (surse: Strength Level, Barbell Medicine, Legion). Comparația e față de oameni care se antrenează și loghează — nu față de toată populația.</div>`;
  }

  renderBadges() {
    const wrap = this.container.querySelector('#ach-badges');
    const all = this.engine.getAchievements(this.data);
    const unlockedCount = all.filter(a => a.unlocked).length;

    const cats = ['consecventa', 'forta'];
    wrap.innerHTML = `<div class="ach-count">${unlockedCount} din ${all.length} deblocate</div>` +
      cats.map(cat => {
        const items = all.filter(a => a.categorie === cat);
        if (!items.length) return '';
        return `
          <div class="ach-cat-title">${CAT_LABELS[cat]}</div>
          <div class="ach-grid">${items.map(a => this.buildBadge(a)).join('')}</div>`;
      }).join('');
  }

  buildBadge(a) {
    const locked = !a.unlocked;
    const prog = a.progress;
    const pct = prog ? Math.min(100, Math.round((prog.current / prog.target) * 100)) : 0;
    return `
      <div class="ach-badge ${locked ? 'locked' : 'unlocked'}">
        <div class="ach-ico">${ICONS[a.icon] || ICONS.trophy}${a.unlocked ? `<span class="ach-ico-check">${ICONS.check}</span>` : ''}</div>
        <div class="ach-info">
          <div class="ach-name">${a.titlu}</div>
          <div class="ach-desc">${a.desc}</div>
          ${prog ? `
            <div class="ach-prog-bar"><div class="ach-prog-fill" style="width:${pct}%"></div></div>
            <div class="ach-prog-txt">${formatNum(prog.current)} / ${formatNum(prog.target)} ${prog.unit}</div>` : ''}
          ${locked && a.needsBodyweight ? `<div class="ach-prog-txt">Adaugă-ți greutatea în profil ca să urmărim asta.</div>` : ''}
          ${a.unlocked && a.fact ? `<div class="ach-fact">${a.fact}</div>` : ''}
        </div>
      </div>`;
  }
}
