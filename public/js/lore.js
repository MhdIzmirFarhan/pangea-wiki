// Lore pages (Races, History, Religions, Regions, Core Chronicle). The page's <body data-lore="..."> picks
// the section; without ?id it shows the overview, with ?id one entry's dossier.
import {
  html, set, acc, pad, slug, loreUrl, nationUrl, paragraphs, rich,
  emptyState, loadContent, showLoadError, renderHeader, renderFooter,
} from './common.js';

const withFact = (label, value, facts) => (value ? [{ label, value }, ...facts] : facts);
// `get` returns the section in a common shape: { eyebrow, heading, intro, items }
// where each item has name, tag, summary, icon, accent, image, facts, sections, nations.
const PAGES = {
  races: { path: 'races.html', icon: 'diversity_1', layout: 'grid', unit: 'Race', empty: 'No races documented yet', get: (c) => c.races },
  history: { path: 'history.html', icon: 'history_edu', layout: 'timeline', unit: 'Event', empty: 'No historic events documented yet', get: (c) => c.history },
  religions: { path: 'religions.html', icon: 'church', layout: 'grid', unit: 'Religion', empty: 'No religions documented yet', get: (c) => c.religions },
  regions: {
    path: 'regions.html', icon: 'travel_explore', layout: 'grid', unit: 'Region', empty: 'No regions documented yet',
    get: (c) => ({ ...c.regions, items: c.regions.items.map((e) => ({ ...e, facts: withFact('Sub-regions', e.subregions, e.facts) })) }),
  },
  chronicle: {
    path: 'chronicle.html', icon: 'auto_stories', layout: 'timeline', unit: 'Act', empty: 'The chronicle has not been written yet',
    get: (c) => ({
      ...c.story,
      items: c.story.acts.map((a) => ({ ...a, name: a.title, tag: a.label, summary: a.body, facts: withFact('Era', a.footer, a.facts) })),
    }),
  },
};
const key = document.body.dataset.lore;
const page = PAGES[key];
const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

function hideBrokenImages() {
  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    const hide = () => { img.style.visibility = 'hidden'; };
    if (img.complete && !img.naturalWidth) hide();
    img.addEventListener('error', hide);
  });
}

// Image with the entry's icon behind it as a fallback.
const art = (e, ac, iconSize, imgCls = '') => html`
  <div class="absolute inset-0 bg-gradient-to-b from-${ac}/15 to-transparent"></div>
  <div class="absolute inset-0 flex items-center justify-center"><span class="material-symbols-outlined ${iconSize} text-${ac}">${e.icon}</span></div>
  ${e.image ? html`<img alt="" data-fallback src="${e.image}" class="absolute inset-0 w-full h-full object-cover ${imgCls}">` : ''}`;

function header(s) {
  return html`
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
      <div>
        <span class="font-mono text-xs uppercase tracking-[0.2em] text-primary font-bold">${s.eyebrow}</span>
        <h1 class="font-serif text-4xl sm:text-5xl text-white font-medium mt-2">${s.heading}</h1>
      </div>
      ${s.intro ? html`<p class="text-on-surface-variant text-sm sm:text-base max-w-md font-light leading-relaxed">${s.intro}</p>` : ''}
    </div>`;
}

function gridView(s) {
  return html`
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      ${s.items.map((e) => {
        const ac = acc(e.accent);
        return html`
        <a href="${loreUrl(page.path, e)}" class="rounded-2xl bg-surface-container-low border border-outline-variant/40 hover:border-${ac}/50 hover:bg-surface-container transition-all overflow-hidden flex flex-col group">
          <div class="relative h-44 bg-surface-container-high overflow-hidden">
            ${art(e, ac, 'text-6xl', 'group-hover:scale-105 transition-transform duration-500')}
            ${e.tag ? html`<span class="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-wider text-${ac} bg-background/70 border border-${ac}/30 px-2 py-0.5 rounded-full">${e.tag}</span>` : ''}
          </div>
          <div class="p-6 flex flex-col flex-grow">
            <h2 class="font-serif text-2xl text-white font-medium group-hover:text-${ac} transition-colors">${e.name}</h2>
            <p class="text-on-surface-variant text-sm leading-relaxed font-light mt-2 flex-grow">${e.summary}</p>
            <span class="mt-5 pt-3 border-t border-outline-variant/20 font-mono text-xs uppercase tracking-wider text-primary group-hover:text-white inline-flex items-center gap-1 transition-colors">Read more <span class="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-1">arrow_forward</span></span>
          </div>
        </a>`;
      })}
    </div>`;
}

function timelineView(s) {
  return html`
    <ol class="relative border-l border-outline-variant/50 ml-3 sm:ml-40 space-y-8">
      ${s.items.map((e, i) => {
        const ac = acc(e.accent);
        return html`
        <li class="relative pl-8">
          <span class="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-${ac} ring-4 ring-background"></span>
          ${e.tag ? html`<span class="sm:absolute sm:-left-40 sm:w-32 sm:text-right sm:top-5 inline-block mb-2 sm:mb-0 font-mono text-[11px] uppercase tracking-wider text-${ac} bg-${ac}/10 px-2 py-1 rounded">${e.tag}</span>` : ''}
          <a href="${loreUrl(page.path, e)}" class="block rounded-2xl bg-surface-container-low border border-outline-variant/40 hover:border-${ac}/50 hover:bg-surface-container transition-all p-6 group">
            <div class="flex items-start gap-4">
              <div class="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-${ac}/10 border border-${ac}/40">${art(e, ac, 'text-2xl')}</div>
              <div class="min-w-0">
                <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-outline">${page.unit} ${pad(i + 1)}</span>
                <h2 class="font-serif text-2xl text-white font-medium group-hover:text-${ac} transition-colors leading-tight">${e.name}</h2>
                <p class="text-on-surface-variant text-sm leading-relaxed font-light mt-1">${e.summary}</p>
              </div>
            </div>
          </a>
        </li>`;
      })}
    </ol>`;
}

function renderIndex(s) {
  set('lore', html`
    <section class="w-full py-20">
      <div class="max-w-6xl mx-auto px-6">
        ${header(s)}
        ${!s.items.length ? emptyState(page.icon, page.empty) : page.layout === 'timeline' ? timelineView(s) : gridView(s)}
      </div>
    </section>`);
}

function renderEntry(e, index, s, c) {
  const ac = acc(e.accent);
  const nations = e.nations.map((l) => c.nations.items.find((n) => same(n.name, l.name))).filter(Boolean);
  const prev = s.items[index - 1];
  const next = s.items[index + 1];

  set('lore', html`
    <section class="relative border-b border-outline-variant/30 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-${ac}/10 via-background to-background pointer-events-none"></div>
      <div class="relative max-w-6xl mx-auto px-6 pt-10 pb-14">
        <nav aria-label="Breadcrumb" class="font-mono text-[11px] uppercase tracking-wider text-outline mb-10 flex flex-wrap items-center gap-2">
          <a href="./" class="hover:text-white transition-colors">Home</a>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <a href="${page.path}" class="hover:text-white transition-colors">${s.heading}</a>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span class="text-${ac}">${e.name}</span>
        </nav>
        <div class="flex flex-col md:flex-row md:items-center gap-8">
          <div class="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0 rounded-2xl overflow-hidden bg-surface-container-high border border-${ac}/40 ring-4 ring-${ac}/10">${art(e, ac, 'text-[64px]')}</div>
          <div class="min-w-0">
            ${e.tag ? html`<span class="inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-${ac} bg-${ac}/10 border border-${ac}/30 px-2.5 py-1 rounded-full">${e.tag}</span>` : ''}
            <h1 class="font-serif text-4xl sm:text-6xl text-white font-medium mt-3 leading-tight">${e.name}</h1>
            ${e.summary ? html`<p class="text-lg text-on-surface-variant mt-3 max-w-2xl leading-relaxed">${e.summary}</p>` : ''}
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10 w-full">
      <aside class="lg:order-2 flex flex-col gap-6">
        <div class="rounded-2xl bg-surface-container-low border border-outline-variant/40 overflow-hidden">
          <div class="px-5 py-3 border-b border-outline-variant/30 bg-surface-container flex items-center justify-between">
            <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-${ac} font-bold">Quick Facts</span>
            <span class="material-symbols-outlined text-outline text-[18px]">info</span>
          </div>
          ${e.facts.length ? html`
          <dl class="divide-y divide-outline-variant/20">
            ${e.facts.map((f) => html`
              <div class="px-5 py-3.5">
                <dt class="font-mono text-[9px] uppercase tracking-widest text-outline">${f.label}</dt>
                <dd class="text-sm text-white mt-0.5">${f.value}</dd>
              </div>`)}
          </dl>` : html`<p class="px-5 py-6 text-sm text-outline">No facts on record.</p>`}
        </div>
        ${nations.length ? html`
        <div class="rounded-2xl bg-surface-container-low border border-outline-variant/40 p-5">
          <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary font-bold block mb-3">Linked Nations</span>
          <div class="flex flex-col gap-2">
            ${nations.map((n) => html`
              <a href="${nationUrl(n)}" class="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors group">
                <span class="flex items-center gap-2.5 min-w-0"><span class="material-symbols-outlined text-[18px] text-${acc(n.accent)}">${n.icon}</span><span class="text-sm text-white group-hover:text-primary truncate">${n.name}</span></span>
                <span class="material-symbols-outlined text-[16px] text-outline group-hover:text-white">chevron_right</span>
              </a>`)}
          </div>
        </div>` : ''}
      </aside>

      <div class="lg:col-span-2 lg:order-1 flex flex-col gap-12">
        ${e.sections.length ? e.sections.map((sec) => html`
          <div>
            <div class="flex items-center gap-3 mb-5">
              <span class="w-2.5 h-2.5 rounded-full bg-${ac}"></span>
              <h2 class="font-serif text-2xl sm:text-3xl text-white font-medium">${sec.heading}</h2>
            </div>
            <div class="space-y-4">${paragraphs(sec.body).map((p) => html`<p class="text-on-surface-variant leading-relaxed">${rich(p, `text-${ac} font-medium`)}</p>`)}</div>
          </div>`) : emptyState('draft', 'This record has not yet been written')}
      </div>
    </section>

    ${prev || next ? html`
    <section class="max-w-6xl mx-auto px-6 pb-16 w-full">
      <div class="grid grid-cols-2 gap-4 pt-8 border-t border-outline-variant/30">
        <div>${prev ? html`<a href="${loreUrl(page.path, prev)}" class="inline-flex flex-col gap-1 group"><span class="font-mono text-[10px] uppercase tracking-wider text-outline flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">arrow_back</span>Previous</span><span class="font-serif text-lg text-white group-hover:text-primary">${prev.name}</span></a>` : ''}</div>
        <div class="text-right">${next ? html`<a href="${loreUrl(page.path, next)}" class="inline-flex flex-col items-end gap-1 group"><span class="font-mono text-[10px] uppercase tracking-wider text-outline flex items-center gap-1">Next<span class="material-symbols-outlined text-[14px]">arrow_forward</span></span><span class="font-serif text-lg text-white group-hover:text-primary">${next.name}</span></a>` : ''}</div>
      </div>
    </section>` : ''}`);
}

function renderNotFound(s) {
  set('lore', html`
    <div class="max-w-3xl mx-auto px-6 py-28">
      ${emptyState('search_off', 'This record is not in the archive')}
      <div class="text-center mt-8"><a href="${page.path}" class="font-mono text-xs uppercase tracking-wider text-primary hover:text-white">← Back to ${s.heading}</a></div>
    </div>`);
}

try {
  const c = await loadContent();
  const s = page.get(c);
  renderHeader(c);
  renderFooter(c.site);
  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    document.title = `${s.heading} | ${c.site.pageTitle}`;
    renderIndex(s);
  } else {
    const index = s.items.findIndex((e) => slug(e.name) === id);
    if (index >= 0) {
      document.title = `${s.items[index].name} | ${c.site.pageTitle}`;
      renderEntry(s.items[index], index, s, c);
    } else {
      document.title = `Not found | ${c.site.pageTitle}`;
      renderNotFound(s);
    }
  }
  hideBrokenImages();
} catch (err) {
  showLoadError(err);
}
