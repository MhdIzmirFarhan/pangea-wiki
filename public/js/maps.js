// Maps page: a recon atlas — a map with clickable pins and a sector panel.
// The tab strip switches between maps when there is more than one.
import { html, set, acc, pad, nationUrl, emptyState, loadContent, showLoadError, renderHeader, renderFooter } from './common.js';

const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
const state = { map: 0, pin: 0, grid: true };
let content;

function hudStrip(s, maps) {
  return html`
    <section class="w-full bg-surface-container-lowest px-6 lg:px-10 py-4 shadow-2xl relative overflow-hidden border-b border-outline-variant/30">
      <div class="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-transparent pointer-events-none"></div>
      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-2">
          ${s.hudBadges.map((b) => b.alert
            ? html`<div class="px-2 py-1 bg-[#93000a] text-[#ffdad6] rounded flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">${b.icon}</span><span class="font-mono text-[10px] tracking-wider uppercase font-bold">${b.text}</span></div>`
            : html`<div class="px-2 py-1 bg-surface-container-high rounded text-${acc(b.accent)} flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">${b.icon}</span><span class="font-mono text-[10px] tracking-wider uppercase font-bold">${b.text}</span></div>`)}
        </div>
        ${s.hudCounters.length ? html`
        <div class="flex items-center gap-4 font-mono text-[10px]">
          ${s.hudCounters.map((cn, i) => html`
            ${i ? html`<div class="w-px h-6 bg-surface-container-highest"></div>` : ''}
            <div class="flex flex-col text-right"><span class="text-outline uppercase text-[9px]">${cn.label}</span><span class="text-${acc(cn.accent)} font-bold tracking-wider">${cn.value}</span></div>`)}
        </div>` : ''}
      </div>
      ${maps.length > 1 ? html`
      <div class="relative z-10 mt-4 pt-2 flex flex-wrap items-center gap-1" role="tablist" aria-label="Maps">
        ${maps.map((m, i) => html`
          <button type="button" role="tab" aria-selected="${i === state.map}" data-map-tab="${i}" class="px-4 py-1.5 rounded font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all ${i === state.map ? 'bg-primary-container text-on-primary font-semibold shadow-[0_0_12px_rgba(200,155,60,0.3)]' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-white'}">
            <span class="material-symbols-outlined text-[16px]">${m.tabIcon}</span><span>[${i + 1}] ${m.tab || m.name}</span>
          </button>`)}
      </div>` : ''}
    </section>`;
}

function pinMarker(p, i) {
  const ac = acc(p.accent);
  const selected = i === state.pin;
  const label = html`<span class="absolute left-1/2 -translate-x-1/2 ${p.labelBelow ? 'top-6' : '-top-8'} px-2 py-0.5 rounded text-[10px] font-mono tracking-widest whitespace-nowrap transition-opacity ${p.major || selected ? `bg-${ac} text-background font-bold` : `bg-surface-container-highest/90 text-${ac} opacity-80 group-hover/pin:opacity-100`}">[${pad(i + 1)}] ${p.label}</span>`;
  return html`
    <button type="button" data-pin="${i}" aria-label="${p.label}" aria-pressed="${selected}" style="left:${p.x}%;top:${p.y}%" class="absolute -translate-x-1/2 -translate-y-1/2 z-20 group/pin focus:outline-none">
      <span class="relative flex items-center justify-center">
        ${p.major
          ? html`<span class="absolute w-8 h-8 rounded-full bg-${ac}/40 animate-pulse"></span><span class="w-5 h-5 rounded-full bg-${ac} flex items-center justify-center ${selected ? 'ring-2 ring-white' : ''}"><span class="material-symbols-outlined text-[11px] text-background">${p.icon}</span></span>`
          : html`<span class="absolute w-8 h-8 rounded-full bg-${ac}/30 ${selected ? 'animate-ping' : ''}"></span><span class="w-4 h-4 rounded-full bg-${ac} flex items-center justify-center ${selected ? 'ring-2 ring-white' : ''}"><span class="w-1.5 h-1.5 rounded-full bg-surface-container-lowest"></span></span>`}
      </span>
      ${label}
    </button>`;
}

function sectorPanel(m) {
  const p = m.pins[state.pin];
  if (!p) {
    return html`
      <div class="bg-surface-container p-6 rounded-xl shadow-xl">
        ${emptyState('location_on', 'No sectors pinned on this map yet')}
      </div>`;
  }
  const ac = acc(p.accent);
  const nation = p.nation && content.nations.items.find((n) => same(n.code, p.nation) || same(n.name, p.nation));
  return html`
    <div class="bg-surface-container p-6 rounded-xl shadow-xl flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-2">
          ${p.tag ? html`<span class="px-2 py-0.5 bg-${ac} text-background rounded font-mono text-[10px] tracking-widest uppercase font-bold">${p.tag}</span>` : html`<span></span>`}
          ${p.threat ? html`<span class="font-mono text-[10px] text-secondary tracking-widest uppercase font-bold">${p.threat}</span>` : ''}
        </div>
        <h2 class="font-serif text-3xl text-white mt-3 leading-tight">${p.title || p.label}</h2>
        ${p.subtitle ? html`<div class="font-mono text-[11px] text-${ac} tracking-wider mt-1 uppercase">${p.subtitle}</div>` : ''}
        ${p.description ? html`<p class="text-on-surface-variant mt-4 leading-relaxed whitespace-pre-line">${p.description}</p>` : ''}
        ${p.metrics.length ? html`
        <div class="grid grid-cols-2 gap-2 mt-4">
          ${p.metrics.map((mt) => html`
            <div class="bg-surface-container-low p-2.5 rounded">
              <span class="font-mono text-[10px] text-outline block uppercase tracking-wider">${mt.label}</span>
              <span class="text-${acc(mt.accent)} font-semibold">${mt.value}</span>
            </div>`)}
        </div>` : ''}
      </div>
      ${nation ? html`
      <div class="mt-6 pt-4">
        <a href="${nationUrl(nation)}" class="w-full py-2.5 bg-primary text-on-primary rounded font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[#ffcf6f] transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(200,155,60,0.3)]">
          <span>Explore ${nation.name}</span><span class="material-symbols-outlined text-[16px]">arrow_forward</span>
        </a>
      </div>` : ''}
    </div>
    ${m.pins.length > 1 ? html`
    <div class="bg-surface-container-low p-4 rounded-xl">
      <span class="font-mono text-[10px] text-outline uppercase tracking-widest block mb-2">All sectors</span>
      <div class="flex flex-wrap gap-1.5">
        ${m.pins.map((x, i) => html`<button type="button" data-pin="${i}" class="px-2 py-1 rounded font-mono text-[10px] tracking-wider uppercase transition-colors ${i === state.pin ? `bg-${acc(x.accent)} text-background font-bold` : 'bg-surface-container text-on-surface-variant hover:text-white'}">${pad(i + 1)} ${x.label}</button>`)}
      </div>
    </div>` : ''}`;
}

function render() {
  const s = content.maps;
  const m = s.items[state.map];
  if (!m) {
    set('maps', html`<div class="max-w-3xl mx-auto px-6 py-28 w-full">${emptyState('map', 'Maps coming soon')}</div>`);
    return;
  }

  set('maps', html`
    ${hudStrip(s, s.items)}
    <section class="w-full flex-1 flex flex-col p-4 lg:p-10 gap-6">
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          ${m.eyebrow ? html`<div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-primary"></span><span class="font-mono text-[10px] text-primary tracking-widest uppercase font-bold">${m.eyebrow}</span></div>` : ''}
          <h1 class="font-serif text-4xl lg:text-5xl text-primary tracking-wide mt-1 font-semibold">${m.name}</h1>
          ${m.description ? html`<p class="text-on-surface-variant mt-1 max-w-3xl">${m.description}</p>` : ''}
        </div>
        <div class="flex items-center gap-4 bg-surface-container px-4 py-2 rounded-lg self-start lg:self-auto">
          <div class="flex flex-col">
            <span class="font-mono text-[10px] text-outline uppercase tracking-wider">Coordinates (crosshair)</span>
            <span id="coord-display" class="font-mono text-xs text-secondary tracking-widest">${m.coordinates || '—'}</span>
          </div>
          <div class="h-8 w-px bg-surface-container-highest"></div>
          <div class="flex items-center gap-1">
            <button type="button" id="grid-toggle" aria-pressed="${state.grid}" title="Toggle grid" aria-label="Toggle grid" class="p-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-white transition-all"><span class="material-symbols-outlined text-[18px]">grid_4x4</span></button>
            <button type="button" id="reset-view" title="Reset lens" aria-label="Reset lens" class="p-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-white transition-all"><span class="material-symbols-outlined text-[18px]">center_focus_strong</span></button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        <div class="xl:col-span-8 bg-surface-container-low rounded-xl overflow-hidden relative shadow-2xl min-h-[560px] flex items-center justify-center p-2">
          <div id="map-frame" class="relative w-full aspect-square max-w-[650px] rounded-lg overflow-hidden bg-surface-container-lowest flex items-center justify-center">
            <span class="material-symbols-outlined text-[120px] text-primary/30">${m.icon}</span>
            ${m.image ? html`<img alt="${m.name}" id="map-img" src="${m.image}" class="absolute inset-0 w-full h-full object-contain contrast-125 brightness-95">` : ''}
            <div id="grid-lines" class="absolute inset-0 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] transition-opacity ${state.grid ? 'opacity-40' : 'opacity-0'}"></div>
            <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-surface-container-lowest via-transparent to-surface-container-lowest/30"></div>
            <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div class="w-64 h-64 rounded-full border border-dashed border-secondary/20 animate-spin motion-reduce:animate-none" style="animation-duration: 40s;"></div>
              <div class="absolute w-96 h-96 rounded-full border border-primary/10"></div>
            </div>
            ${m.pins.map(pinMarker)}
          </div>
          ${m.hudStatus ? html`<div class="absolute bottom-4 left-4 flex items-center gap-2 bg-surface-container-lowest/80 backdrop-blur-md px-3 py-1.5 rounded-lg font-mono text-[11px] text-on-surface-variant"><span class="text-secondary uppercase">HUD Status:</span>${m.hudStatus}</div>` : ''}
        </div>
        <div class="xl:col-span-4 flex flex-col gap-4">${sectorPanel(m)}</div>
      </div>
    </section>`);

  wire(m);
}

function wire(m) {
  document.querySelectorAll('[data-map-tab]').forEach((b) => b.addEventListener('click', () => {
    state.map = Number(b.dataset.mapTab);
    state.pin = 0;
    render();
  }));
  document.querySelectorAll('[data-pin]').forEach((b) => b.addEventListener('click', () => {
    state.pin = Number(b.dataset.pin);
    render();
    document.querySelector(`#map-frame [data-pin="${state.pin}"]`)?.focus();
  }));
  document.getElementById('grid-toggle').addEventListener('click', () => { state.grid = !state.grid; render(); });
  document.getElementById('reset-view').addEventListener('click', () => { state.pin = 0; render(); });

  const img = document.getElementById('map-img');
  if (img) {
    const hide = () => { img.style.visibility = 'hidden'; };
    if (img.complete && !img.naturalWidth) hide();
    img.addEventListener('error', hide);
  }

  // Crosshair readout: shows the X/Y percentage under the cursor — the same
  // numbers the admin enters to place a pin.
  const frame = document.getElementById('map-frame');
  const readout = document.getElementById('coord-display');
  frame.addEventListener('mousemove', (e) => {
    const r = frame.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    readout.textContent = `X ${x.toFixed(1)}% // Y ${y.toFixed(1)}%`;
  });
  frame.addEventListener('mouseleave', () => { readout.textContent = m.coordinates || '—'; });
}

try {
  content = await loadContent();
  document.title = `${content.maps.heading} | ${content.site.pageTitle}`;
  renderHeader(content);
  renderFooter(content.site);
  render();
} catch (err) {
  showLoadError(err);
}
