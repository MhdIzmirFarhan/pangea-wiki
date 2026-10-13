// Home page: hero, the Core Chronicle and the Nations.
import { html, set, acc, pad, nationUrl, loreUrl, emptyState, loadContent, showLoadError, renderHeader, renderFooter } from './common.js';

function sectionHeader(s, accent = 'primary') {
  return html`
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
      <div>
        <span class="font-mono text-xs uppercase tracking-[0.2em] text-${accent} font-bold">${s.eyebrow}</span>
        <h2 class="font-serif text-3xl sm:text-5xl text-white font-medium mt-2">${s.heading}</h2>
      </div>
      <p class="text-on-surface-variant text-sm sm:text-base max-w-md font-light leading-relaxed">${s.intro}</p>
    </div>`;
}

function renderHero(h) {
  set('hero', html`
    <div class="absolute inset-0 z-0 pointer-events-none">
      <img alt="" class="w-full h-full object-cover object-center" src="${h.backgroundImage}">
      <div class="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background"></div>
      <div class="absolute inset-0 bg-radial from-transparent via-background/60 to-background"></div>
    </div>
    <div class="relative z-10 max-w-5xl mx-auto px-6 py-28 text-center flex flex-col items-center">
      <h1 class="font-serif text-5xl sm:text-7xl lg:text-8xl tracking-[0.06em] text-white font-medium leading-[1.08] mb-6">
        ${h.title}
        <span class="block text-3xl sm:text-5xl lg:text-6xl text-primary font-normal tracking-[0.12em] mt-2">${h.subtitle}</span>
      </h1>
      <p class="text-base sm:text-lg lg:text-xl text-on-surface-variant font-light max-w-2xl leading-relaxed mb-10">${h.hook}</p>
      <div class="flex flex-wrap items-center justify-center gap-4">
        <a class="px-8 py-3.5 rounded-lg bg-primary hover:bg-[#ffcf6f] text-on-primary font-mono text-xs uppercase font-bold tracking-[0.18em] transition-all shadow-[0_0_24px_rgba(240,191,92,0.3)]" href="#story">${h.primaryButton}</a>
        <a class="px-8 py-3.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-white font-mono text-xs uppercase font-semibold tracking-[0.18em] transition-all" href="#nations">${h.secondaryButton}</a>
      </div>
    </div>`);
}

function renderStory(s) {
  const card = (a) => {
    const ac = acc(a.accent);
    const href = loreUrl('/chronicle.html', { name: a.title });
    return a.highlight
      ? html`
        <a href="${href}" class="p-8 rounded-2xl bg-surface-container-high border border-${ac}/40 hover:border-${ac}/70 transition-all shadow-[0_0_30px_rgba(240,191,92,0.1)] flex flex-col justify-between group">
          <div>
            <div class="flex items-center justify-between mb-6"><span class="font-mono text-xs tracking-widest text-${ac} uppercase font-bold">${a.label}</span><span class="material-symbols-outlined text-${ac}">${a.icon}</span></div>
            <h3 class="font-serif text-2xl text-white font-medium mb-3">${a.title}</h3>
            <p class="text-on-surface text-sm leading-relaxed font-light whitespace-pre-line">${a.body}</p>
          </div>
          <div class="mt-8 pt-4 border-t border-outline-variant/40 font-mono text-[11px] text-${ac} uppercase tracking-wider font-semibold flex items-center justify-between gap-3"><span>${a.footer}</span><span class="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">arrow_forward</span></div>
        </a>`
      : html`
        <a href="${href}" class="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/40 hover:border-${ac}/50 transition-all flex flex-col justify-between group">
          <div>
            <div class="flex items-center justify-between mb-6"><span class="font-mono text-xs tracking-widest text-${ac} uppercase font-bold">${a.label}</span><span class="material-symbols-outlined text-outline group-hover:text-${ac} transition-colors">${a.icon}</span></div>
            <h3 class="font-serif text-2xl text-white font-medium mb-3">${a.title}</h3>
            <p class="text-on-surface-variant text-sm leading-relaxed font-light whitespace-pre-line">${a.body}</p>
          </div>
          <div class="mt-8 pt-4 border-t border-outline-variant/20 font-mono text-[11px] text-outline uppercase tracking-wider flex items-center justify-between gap-3"><span>${a.footer}</span><span class="material-symbols-outlined text-[16px] group-hover:text-${ac} transition-all group-hover:translate-x-1">arrow_forward</span></div>
        </a>`;
  };
  set('story', html`
    <div class="max-w-6xl mx-auto px-6">
      ${sectionHeader(s)}
      ${s.acts.length ? html`<div class="grid grid-cols-1 md:grid-cols-3 gap-8">${s.acts.map(card)}</div>
      <div class="mt-10 text-center"><a href="/chronicle.html" class="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-primary hover:text-white transition-colors">Read the full chronicle <span class="material-symbols-outlined text-[16px]">arrow_forward</span></a></div>` : emptyState('auto_stories', 'Chronicle coming soon')}
    </div>`);
}

function renderNations(n) {
  set('nations', html`
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <span class="font-mono text-xs uppercase tracking-[0.2em] text-secondary font-bold">${n.eyebrow}</span>
          <h2 class="font-serif text-3xl sm:text-5xl text-white font-medium mt-2">${n.heading}</h2>
        </div>
        <p class="text-on-surface-variant text-sm sm:text-base max-w-lg font-light leading-relaxed">${n.intro}</p>
      </div>
      ${n.items.length ? html`
      <div class="relative">
        <div class="flex gap-4 overflow-x-auto pb-6 pt-2 scroll-smooth focus:outline-none" style="scrollbar-width: thin;">
          ${n.items.map((x, i) => {
            const ac = acc(x.accent);
            return html`
            <div class="w-72 shrink-0 rounded-2xl bg-surface-container-low border border-outline-variant/40 hover:border-${ac}/50 transition-all p-5 flex flex-col justify-between group hover:bg-surface-container">
              <div>
                <div class="w-full h-32 rounded-xl bg-surface-container-high border border-outline-variant/30 flex flex-col items-center justify-center relative overflow-hidden mb-4 group-hover:border-${ac}/40 transition-all">
                  <div class="absolute inset-0 bg-gradient-to-b from-${ac}/10 to-transparent pointer-events-none"></div>
                  <span class="material-symbols-outlined text-4xl text-${ac} mb-1 group-hover:scale-105 transition-all">${x.icon}</span>
                  <span class="font-mono text-[9px] tracking-widest text-outline uppercase px-3 text-center">${x.emblemCaption}</span>
                </div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-mono text-[10px] uppercase tracking-wider text-${ac} font-semibold">${pad(i + 1)} // ${x.code}</span>
                  <span class="font-mono text-[9px] text-outline uppercase bg-surface-container px-1.5 py-0.5 rounded">${x.category}</span>
                </div>
                <h3 class="font-serif text-xl text-white font-medium group-hover:text-${ac} transition-colors leading-snug">${x.name}</h3>
                <p class="text-${ac} text-xs font-mono mt-1">${x.specialty}</p>
              </div>
              <div class="mt-5 pt-3 border-t border-outline-variant/20 flex flex-col gap-2.5">
                <div class="flex items-center justify-between text-[10px] font-mono text-outline">
                  <span>Affinity: <strong class="text-white font-normal">${x.affinity}</strong></span>
                  <span class="text-${ac} font-semibold">${x.status}</span>
                </div>
                <a href="${nationUrl(x)}" class="inline-flex items-center justify-between text-xs font-mono uppercase tracking-wider text-primary hover:text-white transition-colors group/btn pt-1">
                  <span>Dossier</span>
                  <span class="inline-flex items-center gap-1 text-[11px]">More <span class="material-symbols-outlined text-[14px] transition-transform group-hover/btn:translate-x-1">arrow_forward</span></span>
                </a>
              </div>
            </div>`;
          })}
        </div>
      </div>` : emptyState('flag', 'No nations documented yet')}
    </div>`);
}

// ---------- Boot ----------
try {
  const c = await loadContent();
  document.title = c.site.pageTitle;
  renderHeader(c);
  renderHero(c.hero);
  renderStory(c.story);
  renderNations(c.nations);
  renderFooter(c.site);
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
} catch (err) {
  showLoadError(err);
}
