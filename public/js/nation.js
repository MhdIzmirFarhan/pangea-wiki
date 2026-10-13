// Nation page: a sovereign dossier for one nation, chosen by ?id=<code>.
import {
  html, set, acc, pad, slug, nationId, nationUrl, charUrl, orgUrl, loreUrl, paragraphs, rich,
  emptyState, loadContent, showLoadError, renderHeader, renderFooter,
} from './common.js';

const TABS = [
  { key: 'wiki', label: 'Wiki', icon: 'history_edu' },
  { key: 'government', label: 'Government', icon: 'account_balance' },
  { key: 'military', label: 'Military', icon: 'military_tech' },
  { key: 'organizations', label: 'Organizations', icon: 'location_city' },
];
const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
const panelIsEmpty = (p) => !p.title && !p.body && !p.cards.length && !p.stats.length;

// Images that fail to load are hidden so the fallback behind them shows.
function hideBrokenImages(root = document) {
  root.querySelectorAll('img[data-fallback]').forEach((img) => {
    const hide = () => { img.style.visibility = 'hidden'; };
    if (img.complete && !img.naturalWidth) hide();
    img.addEventListener('error', hide);
  });
}

function renderPanel(p, ac, emptyLabel) {
  if (panelIsEmpty(p)) return emptyState('draft', emptyLabel);
  const body = paragraphs(p.body);
  return html`
    <div class="space-y-8">
      <div class="flex flex-col lg:flex-row gap-8 items-start justify-between ${p.cards.length ? 'border-b border-outline-variant/30 pb-8' : ''}">
        <div class="space-y-4 max-w-3xl">
          ${p.tag || p.ref ? html`
          <div class="flex flex-wrap items-center gap-3">
            ${p.tag ? html`<span class="font-mono text-xs bg-${ac}/10 text-${ac} px-3 py-1 rounded font-semibold uppercase tracking-wider flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-${ac} animate-pulse"></span>${p.tag}</span>` : ''}
            ${p.ref ? html`<span class="font-mono text-xs text-outline">${p.ref}</span>` : ''}
          </div>` : ''}
          ${p.title ? html`<h2 class="font-serif text-3xl text-white font-semibold">${p.title}</h2>` : ''}
          ${body.map((para) => html`<p class="text-on-surface-variant leading-relaxed">${rich(para, `text-${ac} font-medium`)}</p>`)}
        </div>
        ${p.stats.length ? html`
        <div class="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto flex-shrink-0 font-mono text-xs">
          ${p.stats.map((s) => html`
            <div class="bg-surface-container p-3.5 rounded-xl border border-outline-variant/30 flex items-center justify-between gap-6">
              <span class="text-outline uppercase">${s.label}</span>
              <span class="text-${acc(s.accent)} font-bold text-right">${s.value}</span>
            </div>`)}
        </div>` : ''}
      </div>
      ${p.cards.length ? html`
      <div>
        <div class="flex flex-wrap items-center justify-between gap-2 mb-5">
          <span class="font-mono text-sm text-${ac} uppercase tracking-[0.18em] font-semibold">${p.cardsHeading}</span>
          <span class="font-mono text-xs text-outline">${p.cardsNote}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${p.cards.map((card, i) => {
            const cc = acc(card.accent);
            return html`
            <div class="bg-surface-container p-6 rounded-xl border border-outline-variant/30 flex flex-col justify-between gap-4 hover:border-${cc}/40 transition-all shadow-md">
              <div class="space-y-3">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-xs text-${cc} uppercase tracking-widest font-bold">${pad(i + 1)}</span>
                    <span class="material-symbols-outlined text-${cc} text-[22px]">${card.icon}</span>
                  </div>
                  <h3 class="text-lg text-white font-semibold mt-1">${card.name}</h3>
                  ${card.subtitle ? html`<span class="font-mono text-[11px] text-outline block mt-0.5">${card.subtitle}</span>` : ''}
                </div>
                ${card.role ? html`
                <div class="space-y-1.5 pt-1">
                  <span class="font-mono text-xs text-on-surface uppercase tracking-wider block font-medium">Role</span>
                  <p class="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">${card.role}</p>
                </div>` : ''}
              </div>
              ${card.assets ? html`
              <div class="pt-4 border-t border-outline-variant/30 space-y-1.5">
                <span class="font-mono text-xs text-${cc} uppercase tracking-wider font-semibold block">Key Assets</span>
                <p class="text-sm text-outline">${card.assets}</p>
              </div>` : ''}
            </div>`;
          })}
        </div>
      </div>` : ''}
    </div>`;
}

function renderOrgsPanel(orgs, nation) {
  if (!orgs.length) return emptyState('location_city', `No organizations linked to ${nation.code || nation.name} yet`);
  return html`
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${orgs.map((o) => {
        const oc = acc(o.accent);
        return html`
        <a href="${orgUrl(o)}" class="bg-surface-container p-6 rounded-xl border border-outline-variant/30 hover:border-${oc}/40 transition-all shadow-md flex flex-col gap-4 group">
          <div class="flex items-center gap-4">
            <div class="relative w-12 h-12 shrink-0 rounded-full bg-${oc}/10 border border-${oc}/40 flex items-center justify-center text-${oc} overflow-hidden">
              <span class="material-symbols-outlined">${o.icon}</span>
              ${o.sigil ? html`<img alt="" data-fallback src="${o.sigil}" class="absolute inset-0 w-full h-full object-cover">` : ''}
            </div>
            <div class="min-w-0">
              <h3 class="text-lg text-white font-semibold group-hover:text-${oc} transition-colors">${o.name}</h3>
              <span class="font-mono text-[11px] text-outline block truncate">${o.fullName || o.type}</span>
            </div>
          </div>
          <p class="text-sm text-on-surface-variant leading-relaxed line-clamp-3 flex-grow">${o.purpose || o.description}</p>
          <span class="font-mono text-xs text-primary uppercase tracking-wider inline-flex items-center gap-1 group-hover:text-white transition-colors">Open dossier <span class="material-symbols-outlined text-[14px]">arrow_forward</span></span>
        </a>`;
      })}
    </div>`;
}

function renderNation(n, index, c) {
  const ac = acc(n.accent);
  // Organizations picked in this nation's admin list, in that order; unknown names are skipped.
  const orgs = n.organizations.map((link) => c.organizations.items.find((o) => same(o.name, link.name))).filter(Boolean);
  const quick = [['Capital City', n.capital, 'text-white'], ['Current Leader', n.leader, `text-${ac}`], ['National Currency', n.currency, 'text-secondary font-mono']].filter(([, v]) => v);
  // Open on the first tab that has something in it.
  const firstTab = (TABS.find((t) => (t.key === 'organizations' ? orgs.length : !panelIsEmpty(n[t.key]))) || TABS[0]).key;

  set('nation', html`
    <div class="relative w-full overflow-hidden">
      <div class="absolute -top-32 left-1/4 w-[700px] h-[700px] bg-secondary/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div class="absolute top-96 right-10 w-[500px] h-[500px] bg-${ac}/5 rounded-full blur-[120px] pointer-events-none"></div>

      <!-- Breadcrumbs -->
      <section class="relative max-w-7xl mx-auto px-6 pt-8 pb-4 w-full">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 py-3">
          <div class="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-wider">
            <a class="inline-flex items-center gap-2 text-outline hover:text-primary transition-colors group" href="/#nations">
              <span class="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">arrow_back</span>Back to Nations
            </a>
            <span class="text-surface-container-highest">/</span>
            <span class="text-secondary font-semibold">${c.nations.heading}</span>
            <span class="text-surface-container-highest">/</span>
            <span class="text-on-surface-variant">Dossier ${pad(index + 1)}${n.code ? ` [${n.code}]` : ''}</span>
          </div>
        </div>
      </section>

      <!-- Hero -->
      <section class="relative max-w-7xl mx-auto px-6 pt-6 pb-12 w-full">
        <div class="relative bg-surface-container-low rounded-2xl p-8 lg:p-12 overflow-hidden shadow-2xl">
          ${n.heroImage ? html`<img alt="" data-fallback src="${n.heroImage}" class="absolute inset-0 z-0 w-full h-full object-cover opacity-30 mix-blend-luminosity">` : ''}
          <div class="absolute inset-0 z-0 bg-gradient-to-r from-surface-container-low via-surface-container-low/85 to-transparent"></div>
          <div class="absolute inset-0 z-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
          <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div class="lg:col-span-8 flex flex-col gap-5">
              <div class="space-y-2">
                <span class="font-mono text-sm text-${ac} uppercase tracking-[0.22em] block">Sovereign Domain // Atlas ID #${pad(index + 1)}</span>
                <h1 class="font-serif text-4xl sm:text-6xl text-white font-medium leading-tight">${n.name}</h1>
                ${n.altName ? html`<p class="font-serif text-2xl text-secondary font-light italic">${n.altName}</p>` : ''}
              </div>
              <p class="text-lg text-on-surface-variant max-w-3xl leading-relaxed whitespace-pre-line">${n.dossier || n.specialty}</p>
              ${quick.length ? html`
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-outline-variant/30">
                ${quick.map(([label, value, cls]) => html`
                  <div class="bg-surface-container/80 backdrop-blur-sm border border-outline-variant/30 rounded-xl p-3.5 flex flex-col gap-1">
                    <span class="font-mono text-xs uppercase tracking-widest text-outline">${label}</span>
                    <span class="font-medium ${cls}">${value}</span>
                  </div>`)}
              </div>` : ''}
            </div>

            <div class="lg:col-span-4 flex flex-col items-start lg:items-end justify-center self-stretch">
              <div class="bg-surface-container/90 backdrop-blur-md p-5 rounded-xl border border-outline-variant/30 w-full max-w-sm flex flex-col shadow-xl">
                <div class="relative overflow-hidden rounded-lg border border-${ac}/30 shadow-lg aspect-[3/2] bg-surface-container-high flex items-center justify-center">
                  <span class="material-symbols-outlined text-6xl text-${ac}">${n.icon}</span>
                  ${n.flag ? html`<img alt="Flag of ${n.officialName || n.name}" data-fallback src="${n.flag}" class="absolute inset-0 w-full h-full object-cover">` : ''}
                  <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent pointer-events-none"></div>
                  <div class="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 text-[11px] font-mono text-on-surface pointer-events-none">
                    <span class="font-semibold tracking-wide text-${ac} truncate">${n.officialName || n.name}</span>
                    <span class="text-outline text-[10px] shrink-0">OFFICIAL STATE BANNER</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats -->
      ${n.stats.length ? html`
      <section class="relative max-w-7xl mx-auto px-6 pb-12 w-full">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${n.stats.map((s) => html`
            <div class="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between shadow-md">
              <div class="flex items-center justify-between text-outline">
                <span class="font-mono text-xs uppercase tracking-wider">${s.label}</span>
                <span class="material-symbols-outlined text-[18px] text-${acc(s.accent)}">${s.icon}</span>
              </div>
              <div class="mt-3">
                <div class="text-xl text-white font-semibold whitespace-pre-line">${s.value}</div>
                ${s.note ? html`<div class="text-sm text-on-surface-variant mt-0.5">${s.note}</div>` : ''}
              </div>
            </div>`)}
        </div>
      </section>` : ''}

      <!-- Tabs -->
      <section class="relative max-w-7xl mx-auto px-6 pb-16 w-full">
        <div class="flex flex-col gap-6">
          <div class="flex flex-wrap items-center gap-2 bg-surface-container-lowest p-2 rounded-xl" role="tablist" aria-label="Nation records">
            ${TABS.map((t) => html`
              <button type="button" role="tab" id="tab-${t.key}" aria-controls="panel-${t.key}" aria-selected="${t.key === firstTab}" data-tab="${t.key}" class="lore-tab-btn px-5 py-3 rounded-lg font-mono text-sm uppercase tracking-wider flex items-center gap-2 transition-all ${t.key === firstTab ? 'bg-surface-container text-primary' : 'text-outline hover:text-white'}">
                <span class="material-symbols-outlined text-[18px]">${t.icon}</span>${t.label}
              </button>`)}
          </div>
          ${TABS.map((t) => html`
            <div role="tabpanel" id="panel-${t.key}" aria-labelledby="tab-${t.key}" class="bg-surface-container-low rounded-2xl p-8 lg:p-12 shadow-xl ${t.key === firstTab ? '' : 'hidden'}">
              ${t.key === 'organizations' ? renderOrgsPanel(orgs, n) : renderPanel(n[t.key], ac, `${t.label} records not yet documented`)}
            </div>`)}
        </div>
      </section>

      <!-- Archive search -->
      <section class="relative max-w-7xl mx-auto px-6 pb-16 w-full">
        <div class="relative rounded-2xl bg-surface-container-lowest p-8 lg:p-10 shadow-2xl">
          <div class="flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 shrink-0 rounded-xl bg-surface-container flex items-center justify-center text-primary"><span class="material-symbols-outlined text-[26px]">terminal</span></div>
              <div>
                <div class="text-lg text-white font-semibold">Pangea Terminal // Archivist Console</div>
                <p class="text-sm text-outline">Search every nation, character, organization and map in the archive.</p>
              </div>
            </div>
            <form id="archive-search" class="flex items-center gap-3 w-full md:w-auto" role="search">
              <label for="archive-q" class="sr-only">Search the archive</label>
              <input id="archive-q" type="search" placeholder="Search dossier records..." class="w-full md:w-64 bg-surface-container-low text-white text-xs font-mono px-4 py-2.5 rounded-lg border-0 placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary">
              <button type="submit" class="bg-surface-container hover:bg-surface-container-high text-primary px-4 py-2.5 rounded-lg font-mono text-sm uppercase tracking-wider whitespace-nowrap transition-colors">Execute</button>
            </form>
          </div>
          <div id="archive-results" class="hidden mt-6 pt-6 border-t border-outline-variant/30"></div>
        </div>
      </section>
    </div>`);

  // Tabs
  const tabs = [...document.querySelectorAll('[data-tab]')];
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.classList.toggle('bg-surface-container', on);
      t.classList.toggle('text-primary', on);
      t.classList.toggle('text-outline', !on);
      t.classList.toggle('hover:text-white', !on);
      document.getElementById(`panel-${t.dataset.tab}`).classList.toggle('hidden', !on);
    });
  }));

  hideBrokenImages();
  wireSearch(c);
}

function wireSearch(c) {
  const records = [
    ...c.nations.items.map((x) => ({ kind: 'Nation', name: x.name, sub: x.officialName || x.specialty, href: nationUrl(x), text: `${x.name} ${x.code} ${x.officialName} ${x.altName}` })),
    ...c.characters.items.map((x) => ({ kind: 'Character', name: x.name, sub: x.title, href: charUrl(x), text: `${x.name} ${x.title} ${x.realm}` })),
    ...c.organizations.items.map((x) => ({ kind: 'Organization', name: x.name, sub: x.fullName || x.type, href: orgUrl(x), text: `${x.name} ${x.fullName} ${x.type}` })),
    ...[['races', '/races.html', 'Race'], ['history', '/history.html', 'History'], ['religions', '/religions.html', 'Religion'], ['regions', '/regions.html', 'Region']].flatMap(([k, path, kind]) =>
      c[k].items.map((x) => ({ kind, name: x.name, sub: x.tag || x.summary, href: loreUrl(path, x), text: `${x.name} ${x.tag} ${x.summary}` }))),
    ...c.story.acts.map((a) => ({ kind: 'Chronicle', name: a.title, sub: a.label, href: loreUrl('/chronicle.html', { name: a.title }), text: `${a.title} ${a.label}` })),
    ...c.maps.items.map((x) => ({ kind: 'Map', name: x.name, sub: x.eyebrow, href: '/maps.html', text: `${x.name} ${x.eyebrow} ${x.pins.map((p) => `${p.label} ${p.title}`).join(' ')}` })),
  ];
  const out = document.getElementById('archive-results');
  document.getElementById('archive-search').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('archive-q').value.trim().toLowerCase();
    out.classList.toggle('hidden', !q);
    if (!q) return;
    const hits = records.filter((r) => r.text.toLowerCase().includes(q));
    out.innerHTML = (hits.length
      ? html`<div class="grid grid-cols-1 md:grid-cols-2 gap-2">${hits.map((r) => html`
          <a href="${r.href}" class="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors group">
            <div class="min-w-0"><div class="text-white group-hover:text-primary truncate">${r.name}</div><div class="text-xs text-outline truncate">${r.sub}</div></div>
            <span class="font-mono text-[10px] uppercase tracking-wider text-secondary shrink-0">${r.kind}</span>
          </a>`)}</div>`
      : html`<p class="font-mono text-xs text-outline">No records match “${q}”.</p>`).v;
  });
}

function renderNotFound() {
  set('nation', html`
    <div class="max-w-3xl mx-auto px-6 py-28">
      ${emptyState('travel_explore', 'This nation is not in the archive')}
      <div class="text-center mt-8"><a href="/#nations" class="font-mono text-xs uppercase tracking-wider text-primary hover:text-white">← Back to Nations</a></div>
    </div>`);
}

try {
  const c = await loadContent();
  renderHeader(c);
  renderFooter(c.site);
  const id = new URLSearchParams(location.search).get('id');
  const index = c.nations.items.findIndex((x) => nationId(x) === id || slug(x.name) === id);
  if (index >= 0) {
    const n = c.nations.items[index];
    document.title = `${n.name} | ${c.site.pageTitle}`;
    renderNation(n, index, c);
  } else {
    document.title = `Not found | ${c.site.pageTitle}`;
    renderNotFound();
  }
} catch (err) {
  showLoadError(err);
}
