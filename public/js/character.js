// Character page: a dossier for one character, chosen by the ?id=<slug> query parameter.
import { html, set, acc, slug, paragraphs, rich, emptyState, loadContent, showLoadError, renderHeader, renderFooter } from './common.js';

const ANGLES = [
  { key: 'left', field: 'portraitLeft', icon: 'turn_left', label: 'Left -45°', badge: 'CAM: -45° LEFT' },
  { key: 'front', field: 'portrait', icon: 'visibility', label: 'Front 0°', badge: 'CAM: 0° FRONT' },
  { key: 'right', field: 'portraitRight', icon: 'turn_right', label: 'Right +45°', badge: 'CAM: +45° RIGHT' },
];

const panelHeader = (ac, iconName, title, tag) => html`
  <div class="flex flex-wrap items-center justify-between gap-2 bg-surface-container px-4 py-2.5 rounded border border-outline-variant/60">
    <span class="font-mono text-xs text-${ac} uppercase tracking-widest flex items-center gap-2 font-semibold"><span class="material-symbols-outlined text-base">${iconName}</span>${title}</span>
    ${tag ? html`<span class="font-mono text-[10px] text-${ac} bg-surface-container-low px-2 py-0.5 rounded uppercase border border-${ac}/20 font-medium">${tag}</span>` : ''}
  </div>`;

function portraitCard(ch, ac) {
  const angles = ANGLES.filter((a) => ch[a.field]);
  const initial = angles.find((a) => a.key === 'front') || angles[0];
  const tabOn = `bg-${ac} text-background font-bold shadow-sm`;
  const tabOff = 'text-outline hover:text-white hover:bg-surface-container';

  return html`
    <div class="relative bg-surface-container-lowest rounded-xl overflow-hidden shadow-2xl p-3.5 border border-outline-variant/40">
      ${angles.length > 1 ? html`
      <div class="flex items-center justify-between gap-1.5 p-1 mb-3 bg-surface-container-low rounded-lg border border-outline-variant/60" role="tablist" aria-label="Portrait angle">
        ${angles.map((a) => html`
          <button type="button" role="tab" data-angle="${a.key}" data-on="${tabOn}" data-off="${tabOff}" aria-selected="${a === initial}" class="angle-tab flex-1 py-1.5 px-1 rounded font-mono text-[11px] tracking-wider uppercase flex items-center justify-center gap-1 transition-all ${a === initial ? tabOn : tabOff}">
            <span class="material-symbols-outlined text-[13px]">${a.icon}</span><span>${a.label}</span>
          </button>`)}
      </div>` : ''}
      <div class="relative w-full overflow-hidden rounded-lg bg-surface-container-low aspect-[3/4] select-none border border-outline-variant/40">
        <div class="absolute inset-0 bg-gradient-to-b from-${ac}/15 to-transparent"></div>
        <div class="absolute inset-0 flex items-center justify-center"><span class="material-symbols-outlined text-[120px] text-${ac}">${ch.icon}</span></div>
        ${angles.map((a) => html`<img data-angle-img="${a.key}" data-badge="${a.badge}" alt="${ch.name} — ${a.label}" src="${ch[a.field]}" class="absolute inset-0 w-full h-full object-cover object-center ${a === initial ? 'block' : 'hidden'}">`)}

        <div id="biometric-hud" class="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300">
          <div class="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-${ac} to-transparent animate-scanline"></div>
          <div class="absolute top-[18%] left-[22%] w-[56%] h-[48%] border border-${ac}/60 rounded-sm">
            <span class="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-${ac}"></span>
            <span class="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-${ac}"></span>
            <span class="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-${ac}"></span>
            <span class="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-${ac}"></span>
            <div class="absolute inset-0 flex items-center justify-center"><span class="material-symbols-outlined text-secondary text-2xl animate-pulse-ring">filter_center_focus</span></div>
          </div>
        </div>

        <div class="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
          ${ch.statusTag ? html`
          <span class="font-mono text-[10px] uppercase tracking-widest text-${ac} bg-surface-container-lowest/90 px-2.5 py-1 rounded backdrop-blur border border-${ac}/30 flex items-center gap-1.5 shadow-sm">
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-${ac} animate-pulse"></span>${ch.statusTag}
          </span>` : ''}
          <div class="flex items-center gap-1.5">
            ${ch.idCode ? html`<span class="font-mono text-[10px] text-secondary bg-surface-container-lowest/90 px-2 py-0.5 rounded backdrop-blur border border-secondary/30">ID: ${ch.idCode}</span>` : ''}
            ${initial ? html`<span id="angle-badge" class="font-mono text-[10px] text-${ac} bg-surface-container-lowest/90 px-2 py-0.5 rounded backdrop-blur border border-${ac}/30 uppercase font-semibold">${initial.badge}</span>` : ''}
          </div>
        </div>

        <button id="hud-toggle" type="button" aria-pressed="false" title="Toggle biometric HUD" aria-label="Toggle biometric HUD" class="absolute top-3 right-3 z-20 w-8 h-8 rounded bg-surface-container-lowest/90 hover:bg-surface-container border border-outline-variant text-outline hover:text-${ac} flex items-center justify-center backdrop-blur transition-all">
          <span class="material-symbols-outlined text-[17px]">document_scanner</span>
        </button>
      </div>
    </div>`;
}

function renderCharacter(ch, section) {
  const ac = acc(ch.accent);
  const bio = paragraphs(ch.bio);

  set('character', html`
    <section class="w-full py-12 px-6">
      <div class="max-w-7xl mx-auto">
        <nav aria-label="Breadcrumb" class="font-mono text-[11px] uppercase tracking-wider text-outline mb-8 flex items-center gap-2">
          <a href="/" class="hover:text-white transition-colors">Home</a>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>${section.heading}</span>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span class="text-${ac}">${ch.name}</span>
        </nav>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
          <div class="lg:col-span-5">${portraitCard(ch, ac)}</div>

          <div class="lg:col-span-7 flex flex-col gap-6">
            <div>
              ${ch.rankBadge ? html`
              <div class="inline-flex items-center gap-2 bg-${ac}/10 border border-${ac}/30 px-3 py-1 rounded mb-3">
                <span class="material-symbols-outlined text-${ac} text-sm">stars</span>
                <span class="font-mono text-xs text-${ac} uppercase tracking-widest font-semibold">${ch.rankBadge}</span>
              </div>` : ''}
              <h1 class="font-serif text-5xl md:text-6xl text-white font-semibold tracking-wider mb-2 leading-none">${ch.name}</h1>
              <p class="font-sans text-sm md:text-base text-${ac} uppercase tracking-widest font-medium">${ch.designation || ch.title}</p>
            </div>

            ${ch.quote ? html`
            <div class="bg-surface-container-low border-l-4 border-${ac} p-6 rounded-r-xl relative overflow-hidden shadow-lg">
              <span class="material-symbols-outlined absolute -top-2 -right-2 text-outline-variant text-7xl select-none pointer-events-none opacity-40">format_quote</span>
              <p class="font-serif text-xl md:text-2xl text-white italic relative z-10 leading-relaxed">“${ch.quote}”</p>
              ${ch.quoteSource ? html`<p class="mt-3 font-mono text-xs text-${ac} uppercase tracking-widest font-semibold">— ${ch.quoteSource}</p>` : ''}
            </div>` : ''}

            <div class="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-6 shadow-xl">
              <div class="flex items-center justify-between mb-4 bg-surface-container-low px-4 py-2.5 rounded border border-outline-variant/60">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-${ac} text-base">accessibility_new</span>
                  <span class="font-mono text-xs text-${ac} uppercase tracking-widest font-semibold">Physiological Profile &amp; Bio-Metrics</span>
                </div>
                ${ch.profileRef ? html`<span class="font-mono text-xs text-outline uppercase tracking-wider">Ref: ${ch.profileRef}</span>` : ''}
              </div>
              ${ch.facts.length ? html`
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${ch.facts.map((f) => html`
                  <div class="bg-surface-container-low p-4 rounded-lg border border-outline-variant/40 flex flex-col gap-1 ${f.wide ? 'sm:col-span-2' : ''}">
                    <span class="font-mono text-xs text-outline uppercase tracking-wider">${f.label}</span>
                    <p class="text-base font-semibold ${f.highlight ? `text-${ac}` : 'text-white'}">${f.value}</p>
                    ${f.note ? html`<span class="text-xs text-outline">${f.note}</span>` : ''}
                  </div>`)}
              </div>` : html`<p class="text-sm text-outline px-1">No biometric data on file.</p>`}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="w-full bg-surface-container-lowest border-t border-outline-variant/40 py-14 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center gap-3 mb-8">
          <span class="w-3 h-3 rounded-full bg-${ac}"></span>
          <h2 class="font-serif text-2xl md:text-3xl text-white font-semibold tracking-wide uppercase">Biography</h2>
          <span class="flex-grow h-px bg-outline-variant/60"></span>
          ${ch.clearance ? html`<span class="hidden sm:inline font-mono text-xs text-outline uppercase tracking-widest">${ch.clearance}</span>` : ''}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div class="lg:col-span-7 bg-surface border border-outline-variant/40 p-6 md:p-8 rounded-xl flex flex-col gap-6 shadow-xl">
            <div class="flex flex-col gap-2 pb-4 border-b border-outline-variant/40">
              ${panelHeader(ac, 'auto_stories', `Archival Biography: ${ch.name}`, ch.bioTag)}
              ${ch.bioSummary ? html`<p class="text-xs text-outline italic px-1 pt-1 leading-relaxed">${ch.bioSummary}</p>` : ''}
            </div>
            ${bio.length ? html`
            <div class="space-y-4">
              ${bio.map((p) => html`<div class="bg-surface-container-low p-5 rounded-lg border border-outline-variant/40"><p class="text-on-surface text-sm md:text-base leading-relaxed">${rich(p, `text-${ac} font-medium`)}</p></div>`)}
            </div>` : emptyState('auto_stories', 'Biography sealed in the archive')}
          </div>

          <div class="lg:col-span-5 bg-surface border border-outline-variant/40 p-6 md:p-8 rounded-xl flex flex-col gap-6 shadow-xl">
            <div class="flex flex-col gap-2 pb-4 border-b border-outline-variant/40">
              ${panelHeader(ac, 'diversity_1', 'Family & Personality', ch.kinshipTag)}
              ${ch.kinshipSummary ? html`<p class="text-xs text-outline italic px-1 pt-1 leading-relaxed">${ch.kinshipSummary}</p>` : ''}
            </div>

            ${ch.kinship.length ? html`
            <div class="space-y-3">
              <div class="font-mono text-secondary uppercase tracking-widest text-xs flex items-center gap-1.5 pb-1 border-b border-outline-variant/40 font-semibold"><span class="material-symbols-outlined text-sm">group</span>Kinship &amp; Ties</div>
              ${ch.kinship.map((k) => {
                const kc = acc(k.accent);
                return html`
                <div class="p-3.5 rounded-lg border flex flex-col gap-1 ${k.featured ? `border-${ac}/40 bg-${ac}/5` : 'bg-surface-container-low border-outline-variant/40'}">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-sm font-semibold flex items-center gap-1.5 ${k.featured ? `text-${ac}` : 'text-white'}">${k.featured ? html`<span class="material-symbols-outlined text-sm">favorite</span>` : ''}${k.name}</span>
                    ${k.relation ? html`<span class="shrink-0 font-mono text-[10px] text-${kc} bg-${kc}/10 border border-${kc}/30 px-1.5 py-0.5 rounded uppercase text-right">${k.relation}</span>` : ''}
                  </div>
                  <p class="text-xs leading-relaxed whitespace-pre-line ${k.featured ? 'text-on-surface-variant' : 'text-outline'}">${k.description}</p>
                </div>`;
              })}
            </div>` : ''}

            ${ch.personality.length ? html`
            <div class="space-y-3 pt-2">
              <div class="font-mono text-${ac} uppercase tracking-widest text-xs flex items-center gap-1.5 pb-1 border-b border-outline-variant/40 font-semibold"><span class="material-symbols-outlined text-sm">psychology</span>Personality &amp; Psychological Profile</div>
              ${ch.personality.map((p) => html`
                <div class="bg-surface-container-low p-4 rounded-lg flex flex-col gap-2 border border-outline-variant/40">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-sm font-semibold ${p.highlight ? `text-${ac}` : 'text-white'}">${p.title}</span>
                    ${p.tag ? html`<span class="font-mono text-[10px] text-secondary font-medium text-right">${p.tag}</span>` : ''}
                  </div>
                  <p class="text-xs text-outline leading-relaxed whitespace-pre-line">${p.description}</p>
                </div>`)}
            </div>` : ''}

            ${!ch.kinship.length && !ch.personality.length ? emptyState('diversity_1', 'No kinship records') : ''}

            ${ch.endorsementTitle ? html`
            <div class="bg-surface-container p-4 rounded-lg flex items-center gap-3 border border-${ac}/30 mt-auto">
              <span class="material-symbols-outlined text-${ac} text-2xl shrink-0">shield_with_heart</span>
              <div>
                <p class="font-mono text-xs text-${ac} uppercase tracking-widest font-semibold">${ch.endorsementTitle}</p>
                <p class="text-xs text-on-surface-variant leading-relaxed">${ch.endorsementText}</p>
              </div>
            </div>` : ''}
          </div>
        </div>
      </div>
    </section>`);

  // A portrait that fails to load reveals the icon placeholder behind it.
  document.querySelectorAll('[data-angle-img]').forEach((img) => {
    const hide = () => { img.style.visibility = 'hidden'; };
    if (img.complete && !img.naturalWidth) hide();
    img.addEventListener('error', hide);
  });

  // Portrait angle switcher
  document.querySelectorAll('[data-angle]').forEach((btn) => btn.addEventListener('click', () => {
    const key = btn.dataset.angle;
    document.querySelectorAll('[data-angle-img]').forEach((img) => {
      const on = img.dataset.angleImg === key;
      img.classList.toggle('hidden', !on);
      img.classList.toggle('block', on);
      if (on) document.getElementById('angle-badge').textContent = img.dataset.badge;
    });
    document.querySelectorAll('[data-angle]').forEach((b) => {
      const on = b === btn;
      b.setAttribute('aria-selected', String(on));
      b.classList.remove(...(on ? b.dataset.off : b.dataset.on).split(' '));
      b.classList.add(...(on ? b.dataset.on : b.dataset.off).split(' '));
    });
  }));

  // Biometric HUD toggle
  const hudBtn = document.getElementById('hud-toggle');
  hudBtn.addEventListener('click', () => {
    const on = hudBtn.getAttribute('aria-pressed') !== 'true';
    hudBtn.setAttribute('aria-pressed', String(on));
    document.getElementById('biometric-hud').classList.toggle('opacity-0', !on);
  });
}

function renderNotFound(section) {
  set('character', html`
    <div class="max-w-3xl mx-auto px-6 py-28">
      ${emptyState('person_search', 'This character is not in the archive')}
      <div class="text-center mt-8"><a href="/" class="font-mono text-xs uppercase tracking-wider text-primary hover:text-white">← Back to home</a></div>
    </div>`);
}

try {
  const c = await loadContent();
  renderHeader(c);
  renderFooter(c.site);
  const id = new URLSearchParams(location.search).get('id');
  const ch = c.characters.items.find((x) => slug(x.name) === id);
  if (ch) {
    document.title = `${ch.name} | ${c.site.pageTitle}`;
    renderCharacter(ch, c.characters);
  } else {
    document.title = `Not found | ${c.site.pageTitle}`;
    renderNotFound(c.characters);
  }
} catch (err) {
  showLoadError(err);
}
