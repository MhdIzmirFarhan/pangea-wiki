// Shared viewer helpers: safe HTML templating, the site header and footer, and
// the dossier modal. Used by the home page and the organization pages.
import { ACCENTS } from './schema.js';

export class Raw { constructor(v) { this.v = v; } }
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const part = (v) => (v instanceof Raw ? v.v : Array.isArray(v) ? v.map(part).join('') : esc(v));
// Every interpolated value is HTML-escaped unless it is itself an `html` result,
// so content can only ever change text — never markup or styling.
export const html = (strings, ...vals) => new Raw(strings.reduce((out, s, i) => out + s + (i < vals.length ? part(vals[i]) : ''), ''));
export const set = (id, content) => { document.getElementById(id).innerHTML = content.v; };
// Accent values are restricted to the schema's palette before they reach a class name.
export const acc = (a) => (ACCENTS.includes(a) ? a : 'primary');
export const pad = (n) => String(n).padStart(2, '0');
export const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';
export const orgUrl = (org) => `organization.html?id=${encodeURIComponent(slug(org.name))}`;
export const nationId = (n) => slug(n.code || n.name);
export const nationUrl = (n) => `nation.html?id=${encodeURIComponent(nationId(n))}`;
export const loreUrl = (path, entry) => `${path}?id=${encodeURIComponent(slug(entry.name))}`;
export const charUrl = (ch) => `character.html?id=${encodeURIComponent(slug(ch.name))}`;

// Long text fields: blank lines separate paragraphs, **word** marks a highlight.
export const paragraphs = (s) => String(s ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
export const plain = (s) => String(s ?? '').replace(/\*\*(.+?)\*\*/g, '$1');
// Escapes first, then turns **word** into a highlight span — no other markup is possible.
export const rich = (s, cls) => new Raw(esc(s).replace(/\*\*(.+?)\*\*/g, (_, t) => `<span class="${cls}">${t}</span>`));

export async function loadContent() {
  const res = await fetch('api/content', { cache: 'no-store' });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export function showLoadError(err) {
  console.error(err);
  const el = document.getElementById('load-error');
  el.classList.remove('hidden');
  el.classList.add('flex');
}

const navLink = 'text-sm font-medium uppercase tracking-[0.14em] text-on-surface-variant hover:text-white transition-colors';
const dropdownShell = (width, inner) => html`
  <div class="absolute top-[80%] left-1/2 -translate-x-1/2 ${width} opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-300 pt-3 z-50">
    <div class="bg-surface-container-high/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-primary/20">${inner}</div>
  </div>`;
const caret = html`<span class="material-symbols-outlined text-[16px] text-outline group-hover:text-primary group-hover:rotate-180 transition-all duration-300">keyboard_arrow_down</span>`;

// Searchable dropdown list used by the Characters and Organizations menus.
function listMenu({ id, iconName, heading, count, placeholder, items, footerLabel }) {
  return dropdownShell('w-[380px]', html`
    <div class="flex items-center justify-between pb-3 mb-3 border-b border-outline-variant/30">
      <div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[18px]">${iconName}</span><span class="font-mono text-xs uppercase tracking-[0.18em] text-primary font-bold">${heading}</span></div>
      <span class="font-mono text-[10px] text-outline uppercase tracking-wider">${count} Documented</span>
    </div>
    <div class="relative mb-3.5">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">search</span>
      <input data-menu-search="${id}" type="text" placeholder="${placeholder}" class="w-full bg-surface-container-lowest border border-outline-variant/50 focus:border-primary focus:outline-none focus:ring-0 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-outline font-sans transition-colors">
    </div>
    <div id="${id}" class="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
      ${items.map((it) => {
        const ac = acc(it.accent);
        return html`
        <a href="${it.href}" class="menu-item group/item p-2 rounded-xl hover:bg-surface-container border border-transparent hover:border-${ac}/30 transition-all flex items-center justify-between gap-3" data-search="${it.search.toLowerCase()}">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 shrink-0 rounded-lg bg-${ac}/10 border border-${ac}/40 flex items-center justify-center text-${ac} group-hover/item:scale-105 transition-transform overflow-hidden">
              ${it.image ? html`<img alt="" src="${it.image}" class="w-full h-full object-cover">` : html`<span class="material-symbols-outlined text-[16px]">${it.icon}</span>`}
            </div>
            <div class="min-w-0">
              <div class="text-sm font-serif text-white font-medium group-hover/item:text-${ac} transition-colors leading-tight truncate">${it.title}</div>
              <div class="text-[10px] text-${ac} font-mono leading-none mt-0.5 truncate">${it.subtitle}</div>
            </div>
          </div>
          ${it.tag ? html`<span class="shrink-0 font-mono text-[9px] text-${ac} bg-${ac}/10 border border-${ac}/20 px-2 py-0.5 rounded-full uppercase">${it.tag}</span>` : ''}
        </a>`;
      })}
      <div data-menu-empty class="${items.length ? 'hidden' : ''} text-center py-6"><span class="material-symbols-outlined text-outline text-[24px] mb-1">search_off</span><p class="text-xs text-on-surface-variant font-mono">Nothing found</p></div>
    </div>
    ${footerLabel ? html`
    <div class="mt-3 pt-3 border-t border-outline-variant/30 text-xs font-mono">
      <span class="text-outline text-[11px]">${footerLabel}</span>
    </div>` : ''}`);
}

const examples = (list, key) => (list.length ? ` (e.g. ${list.slice(0, 3).map((x) => x[key]).join(', ')})` : '');

export function renderHeader(c) {
  const u = c.universe;
  const chars = c.characters.items;
  const orgs = c.organizations.items;

  // One column per lore section; each header links to its overview page and
  // each entry to its own page.
  const loreColumn = (section, path, iconName, colour, showTag) => html`
    <div class="space-y-3 min-w-0">
      <a href="${path}" class="flex items-center justify-between gap-2 pb-2 border-b border-outline-variant/30 group/head">
        <span class="flex items-center gap-2"><span class="material-symbols-outlined text-${colour} text-[18px]">${iconName}</span><span class="font-mono text-xs uppercase tracking-[0.18em] text-${colour} font-bold">${section.heading}</span></span>
        <span class="material-symbols-outlined text-[14px] text-outline group-hover/head:text-white transition-colors">arrow_forward</span>
      </a>
      <div class="flex flex-col gap-1.5 pt-1">
        ${section.items.slice(0, 5).map((r) => html`
          <a href="${loreUrl(path, r)}" class="group/item p-2 rounded-lg hover:bg-surface-container transition-colors">
            <div class="flex items-center justify-between gap-2"><span class="text-sm font-serif text-white group-hover/item:text-${colour} transition-colors font-medium">${r.name}</span>${showTag && r.tag ? html`<span class="font-mono text-[9px] text-${acc(r.accent)} bg-${acc(r.accent)}/10 px-1.5 py-0.5 rounded whitespace-nowrap">${r.tag}</span>` : ''}</div>
            <div class="text-[11px] text-on-surface-variant font-light leading-snug mt-0.5 line-clamp-2">${r.summary || r.subregions || ''}</div>
          </a>`)}
        ${section.items.length > 5 ? html`<a href="${path}" class="px-2 font-mono text-[10px] uppercase tracking-wider text-outline hover:text-white">+ ${section.items.length - 5} more</a>` : ''}
        ${!section.items.length ? html`<span class="px-2 text-[11px] text-outline">Coming soon</span>` : ''}
      </div>
    </div>`;

  const universeMenu = html`
    <div class="absolute top-[80%] left-1/2 -translate-x-1/2 w-[1000px] max-w-[calc(100vw-2rem)] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-300 pt-3 z-50">
      <div class="bg-surface-container-high/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-primary/20">
        <div class="grid grid-cols-4 gap-5">
          ${loreColumn(c.races, 'races.html', 'diversity_1', 'primary', false)}
          ${loreColumn(c.history, 'history.html', 'history_edu', 'secondary', true)}
          ${loreColumn(c.religions, 'religions.html', 'church', 'tertiary', false)}
          ${loreColumn(c.regions, 'regions.html', 'travel_explore', 'primary', true)}
        </div>
        <div class="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-xs font-mono">
          <span class="text-outline">${u.footerNote}</span>
          <a class="text-primary hover:text-white flex items-center gap-1 transition-colors" href="maps.html"><span>Explore Interactive Atlas</span><span class="material-symbols-outlined text-[14px]">arrow_forward</span></a>
        </div>
      </div>
    </div>`;

  const charMenu = listMenu({
    id: 'character-nav-list',
    iconName: 'group',
    heading: c.characters.heading,
    count: chars.length,
    placeholder: `Search characters${examples(chars, 'name')}...`,
    items: chars.map((ch) => ({
      href: charUrl(ch), accent: ch.accent, icon: ch.icon, title: ch.name, subtitle: ch.title, tag: ch.element,
      search: `${ch.name} ${ch.title} ${ch.realm}`,
    })),
    footerLabel: c.characters.eyebrow,
  });

  const orgMenu = listMenu({
    id: 'org-nav-list',
    iconName: 'account_balance',
    heading: c.organizations.heading,
    count: orgs.length,
    placeholder: `Search organizations${examples(orgs, 'name')}...`,
    items: orgs.map((o) => ({
      href: orgUrl(o), accent: o.accent, icon: o.icon, image: o.sigil, title: o.name, subtitle: o.fullName || o.type, tag: o.type && o.fullName ? o.type : '',
      search: `${o.name} ${o.fullName} ${o.type} ${o.leader.name}`,
    })),
    footerLabel: c.organizations.eyebrow,
  });

  set('site-header', html`
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
      <a class="flex items-center gap-3.5 group" href="./">
        <img alt="${c.site.brandName} crest" class="h-9 w-9 rounded-full object-cover ring-1 ring-primary/40 group-hover:ring-primary transition-all group-hover:scale-105" src="${c.site.crestImage}">
        <div class="flex flex-col">
          <span class="font-serif text-xl tracking-[0.18em] font-semibold text-white uppercase leading-none group-hover:text-primary transition-colors">${c.site.brandName}</span>
          <span class="font-mono text-[10px] tracking-[0.24em] text-primary uppercase mt-1 leading-none">${c.site.brandTagline}</span>
        </div>
      </a>
      <nav class="hidden lg:flex items-center gap-9">
        <a class="${navLink} flex items-center gap-1.5" href="chronicle.html"><span>The Story</span><span class="font-mono text-[10px] text-primary/70 tracking-widest">// Plot</span></a>
        <div class="relative group py-6">
          <a class="text-sm font-medium uppercase tracking-[0.14em] text-white group-hover:text-primary transition-colors flex items-center gap-1.5" href="./#nations"><span>The Universe</span>${caret}</a>
          ${universeMenu}
        </div>
        <div class="relative group py-6">
          <button type="button" aria-haspopup="true" class="${navLink} group-hover:text-primary flex items-center gap-1.5"><span>Characters</span>${caret}</button>
          ${charMenu}
        </div>
        <a class="${navLink}" href="maps.html">Maps</a>
        <div class="relative group py-6">
          <button type="button" aria-haspopup="true" class="${navLink} group-hover:text-primary flex items-center gap-1.5"><span>Organizations</span>${caret}</button>
          ${orgMenu}
        </div>
      </nav>
      <div class="flex items-center gap-4">
        <button id="mobile-toggle" aria-label="Toggle navigation menu" aria-expanded="false" class="lg:hidden w-10 h-10 flex items-center justify-center text-on-surface border border-outline-variant/50 rounded-lg hover:bg-surface-container">
          <span class="material-symbols-outlined text-[22px]">menu</span>
        </button>
      </div>
    </div>
    <nav id="mobile-menu" class="hidden lg:hidden max-h-[70vh] overflow-y-auto border-t border-outline-variant/30 bg-background/95 px-6 py-4 flex-col gap-1">
      <a class="block py-2.5 ${navLink}" href="chronicle.html">The Story</a>
      <a class="block py-2.5 ${navLink}" href="./#nations">The Universe</a>
      <a class="block py-1.5 pl-4 border-l border-outline-variant/40 text-sm text-on-surface-variant hover:text-primary" href="races.html">${c.races.heading}</a>
      <a class="block py-1.5 pl-4 border-l border-outline-variant/40 text-sm text-on-surface-variant hover:text-primary" href="history.html">${c.history.heading}</a>
      <a class="block py-1.5 pl-4 border-l border-outline-variant/40 text-sm text-on-surface-variant hover:text-primary" href="religions.html">${c.religions.heading}</a>
      <a class="block py-1.5 pl-4 border-l border-outline-variant/40 text-sm text-on-surface-variant hover:text-primary" href="regions.html">${c.regions.heading}</a>
      <a class="block py-2.5 ${navLink}" href="maps.html">Maps</a>
      <span class="block pt-2.5 pb-1 ${navLink}">Characters</span>
      ${chars.map((ch) => html`<a class="block py-1.5 pl-4 border-l border-outline-variant/40 text-sm text-on-surface-variant hover:text-primary" href="${charUrl(ch)}">${ch.name}</a>`)}
      <span class="block pt-2.5 pb-1 ${navLink}">Organizations</span>
      ${orgs.map((o) => html`<a class="block py-1.5 pl-4 border-l border-outline-variant/40 text-sm text-on-surface-variant hover:text-primary" href="${orgUrl(o)}">${o.name}</a>`)}
    </nav>`);

  // Dropdown search
  document.querySelectorAll('[data-menu-search]').forEach((search) => {
    const list = document.getElementById(search.dataset.menuSearch);
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase().trim();
      let visible = 0;
      list.querySelectorAll('.menu-item').forEach((item) => {
        const match = item.dataset.search.includes(q);
        item.style.display = match ? 'flex' : 'none';
        if (match) visible++;
      });
      list.querySelector('[data-menu-empty]').classList.toggle('hidden', visible > 0);
    });
  });

  // Mobile menu
  const toggle = document.getElementById('mobile-toggle');
  const menu = document.getElementById('mobile-menu');
  const setOpen = (open) => {
    menu.classList.toggle('hidden', !open);
    menu.classList.toggle('flex', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(menu.classList.contains('hidden')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
}

export function renderFooter(site) {
  set('site-footer', html`
    <div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <a href="./" class="flex items-center gap-3">
        <img alt="" class="h-7 w-7 rounded-full object-cover ring-1 ring-primary/40" src="${site.crestImage}">
        <span class="font-serif text-sm tracking-[0.18em] text-white uppercase">${site.brandName}</span>
      </a>
      <p class="font-mono text-[11px] text-outline tracking-wider text-center">${site.footerText}</p>
    </div>`);
}

export function emptyState(iconName, message) {
  return html`
    <div class="rounded-2xl border border-dashed border-outline-variant/50 py-16 text-center">
      <span class="material-symbols-outlined text-outline text-4xl">${iconName}</span>
      <p class="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-outline">${message}</p>
    </div>`;
}
