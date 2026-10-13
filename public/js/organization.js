// Organization page: a dossier-style profile for one organization, chosen by
// the ?id=<slug> query parameter.
import { html, set, acc, pad, slug, orgUrl, emptyState, loadContent, showLoadError, renderHeader, renderFooter } from './common.js';

const sectionTitle = (ac, iconName, kicker, title) => html`
  <div class="flex items-center gap-3 mb-6">
    <span class="material-symbols-outlined text-${ac}">${iconName}</span>
    <div>
      <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-${ac} font-bold">${kicker}</span>
      <h2 class="font-serif text-2xl sm:text-3xl text-white font-medium leading-tight">${title}</h2>
    </div>
  </div>`;

const sigil = (o, ac, size) => html`
  <div class="${size} shrink-0 rounded-full bg-${ac}/10 border border-${ac}/40 ring-4 ring-${ac}/10 flex items-center justify-center text-${ac} overflow-hidden">
    ${o.sigil ? html`<img alt="${o.name} sigil" src="${o.sigil}" class="w-full h-full object-cover">` : html`<span class="material-symbols-outlined text-[56px]">${o.icon}</span>`}
  </div>`;

function renderOrg(o, all, section) {
  const ac = acc(o.accent);
  const facts = [
    ['Founded', o.founded, 'event'],
    ['Headquarters', o.headquarters, 'location_on'],
    ['Jurisdiction', o.jurisdiction, 'public'],
    ['Director', o.leader.name, 'person'],
    ['Units', o.units.length ? String(o.units.length) : '', 'hub'],
    ['Classification', o.type, 'category'],
  ].filter(([, v]) => v);
  const others = all.filter((x) => x !== o);

  set('org', html`
    <!-- Banner -->
    <section class="relative border-b border-outline-variant/30 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-${ac}/10 via-background to-background pointer-events-none"></div>
      <div class="relative max-w-6xl mx-auto px-6 pt-10 pb-16">
        <nav aria-label="Breadcrumb" class="font-mono text-[11px] uppercase tracking-wider text-outline mb-10 flex items-center gap-2">
          <a href="./" class="hover:text-white transition-colors">Home</a>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>${section.heading}</span>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span class="text-${ac}">${o.name}</span>
        </nav>
        <div class="flex flex-col md:flex-row md:items-center gap-8">
          ${sigil(o, ac, 'w-32 h-32 sm:w-40 sm:h-40')}
          <div class="min-w-0">
            ${o.type ? html`<span class="inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-${ac} bg-${ac}/10 border border-${ac}/30 px-2.5 py-1 rounded-full">${o.type}</span>` : ''}
            <h1 class="font-serif text-5xl sm:text-6xl text-white font-medium tracking-[0.04em] mt-3 leading-none">${o.name}</h1>
            ${o.fullName ? html`<p class="font-serif text-xl sm:text-2xl text-on-surface-variant mt-2">${o.fullName}</p>` : ''}
            ${o.motto ? html`<p class="mt-4 font-serif italic text-lg text-${ac}">“${o.motto}”</p>` : ''}
          </div>
        </div>
      </div>
    </section>

    <!-- Fact sheet + mission -->
    <section class="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
      <aside class="lg:order-2">
        <div class="rounded-2xl bg-surface-container-low border border-outline-variant/40 overflow-hidden lg:sticky lg:top-28">
          <div class="px-5 py-3 border-b border-outline-variant/30 bg-surface-container flex items-center justify-between">
            <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-${ac} font-bold">Quick Facts</span>
            <span class="material-symbols-outlined text-outline text-[18px]">badge</span>
          </div>
          ${facts.length ? html`
          <dl class="divide-y divide-outline-variant/20">
            ${facts.map(([k, v, i]) => html`
              <div class="px-5 py-3.5 flex items-start gap-3">
                <span class="material-symbols-outlined text-outline text-[18px] mt-0.5">${i}</span>
                <div class="min-w-0">
                  <dt class="font-mono text-[9px] uppercase tracking-widest text-outline">${k}</dt>
                  <dd class="text-sm text-white mt-0.5">${v}</dd>
                </div>
              </div>`)}
          </dl>` : html`<p class="px-5 py-6 text-sm text-outline">No facts on record.</p>`}
        </div>
      </aside>

      <div class="lg:col-span-2 lg:order-1 flex flex-col gap-14">
        <div>
          ${sectionTitle(ac, 'flag', 'Mission', 'Purpose')}
          <p class="text-on-surface text-base sm:text-lg leading-relaxed font-light whitespace-pre-line border-l-2 border-${ac}/50 pl-5">${o.purpose || 'Mission statement classified.'}</p>
        </div>
        <div>
          ${sectionTitle(ac, 'description', 'History & Structure', 'Overview')}
          <p class="text-on-surface-variant text-sm sm:text-base leading-relaxed font-light whitespace-pre-line">${o.description || 'Overview pending declassification.'}</p>
        </div>
      </div>
    </section>

    <!-- Leadership -->
    <section class="border-t border-outline-variant/30 bg-surface-container-lowest">
      <div class="max-w-6xl mx-auto px-6 py-16">
        ${sectionTitle(ac, 'military_tech', 'Command', 'Leadership')}
        <div class="rounded-2xl bg-surface-container-low border border-outline-variant/40 overflow-hidden flex flex-col sm:flex-row">
          <div class="sm:w-64 shrink-0 h-64 sm:h-auto bg-surface-container-high relative flex items-center justify-center">
            ${o.leader.photo
              ? html`<img alt="${o.leader.name}" src="${o.leader.photo}" class="absolute inset-0 w-full h-full object-cover object-top">`
              : html`<div class="absolute inset-0 bg-gradient-to-b from-${ac}/15 to-transparent"></div><span class="material-symbols-outlined text-7xl text-${ac} relative">person</span>`}
          </div>
          <div class="p-7 sm:p-8">
            <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-${ac} font-semibold">${o.leader.title || 'Leader'}</span>
            <h3 class="font-serif text-3xl text-white font-medium mt-1">${o.leader.name || 'Identity withheld'}</h3>
            <p class="text-on-surface-variant text-sm sm:text-base leading-relaxed font-light mt-4 whitespace-pre-line">${o.leader.bio || 'Biography sealed in the archive.'}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Units -->
    <section class="border-t border-outline-variant/30">
      <div class="max-w-6xl mx-auto px-6 py-16">
        ${sectionTitle(ac, 'hub', 'Organizational Structure', 'Units & Divisions')}
        ${o.units.length ? html`
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${o.units.map((u, i) => html`
            <article class="rounded-2xl bg-surface-container-low border border-outline-variant/40 hover:border-${ac}/50 transition-all overflow-hidden flex flex-col group">
              <div class="h-40 bg-surface-container-high relative flex items-center justify-center overflow-hidden">
                ${u.photo
                  ? html`<img alt="${u.name}" src="${u.photo}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`
                  : html`<div class="absolute inset-0 bg-gradient-to-b from-${ac}/10 to-transparent"></div><span class="material-symbols-outlined text-5xl text-${ac} relative">${u.icon}</span>`}
                <span class="absolute top-3 left-3 font-mono text-[10px] text-${ac} bg-background/70 border border-${ac}/30 px-2 py-0.5 rounded-full">UNIT ${pad(i + 1)}</span>
              </div>
              <div class="p-6 flex-grow">
                <h3 class="font-serif text-xl text-white font-medium group-hover:text-${ac} transition-colors">${u.name}</h3>
                <p class="text-on-surface-variant text-sm leading-relaxed font-light mt-2 whitespace-pre-line">${u.description}</p>
              </div>
            </article>`)}
        </div>` : emptyState('hub', 'No units on record')}
      </div>
    </section>

    ${others.length ? html`
    <section class="border-t border-outline-variant/30 bg-surface-container-lowest">
      <div class="max-w-6xl mx-auto px-6 py-14">
        <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-outline font-bold">Other ${section.heading}</span>
        <div class="mt-4 flex gap-3 overflow-x-auto pb-2">
          ${others.map((x) => html`
            <a href="${orgUrl(x)}" class="shrink-0 flex items-center gap-3 pl-2 pr-4 py-2 rounded-full bg-surface-container-low border border-outline-variant/40 hover:border-${acc(x.accent)}/50 transition-all">
              ${sigil(x, acc(x.accent), 'w-9 h-9 !ring-0 [&_.material-symbols-outlined]:text-[18px]')}
              <span class="font-serif text-white">${x.name}</span>
            </a>`)}
        </div>
      </div>
    </section>` : ''}`);
}

function renderNotFound(section) {
  set('org', html`
    <div class="max-w-3xl mx-auto px-6 py-28">
      ${emptyState('search_off', 'This organization is not in the archive')}
      <div class="text-center mt-8"><a href="./" class="font-mono text-xs uppercase tracking-wider text-primary hover:text-white">← Back to home</a></div>
    </div>`);
}

try {
  const c = await loadContent();
  renderHeader(c);
  renderFooter(c.site);
  const id = new URLSearchParams(location.search).get('id');
  const org = c.organizations.items.find((o) => slug(o.name) === id);
  if (org) {
    document.title = `${org.name} | ${c.site.pageTitle}`;
    renderOrg(org, c.organizations.items, c.organizations);
  } else {
    document.title = `Not found | ${c.site.pageTitle}`;
    renderNotFound(c.organizations);
  }
} catch (err) {
  showLoadError(err);
}
