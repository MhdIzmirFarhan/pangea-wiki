// Admin portal: a form editor generated from the content schema. It can only
// read and write the fields the schema declares, so the page layout is not editable.
import { schema, validate, blank, ACCENTS } from './schema.js';

const $ = (id) => document.getElementById(id);
const TOKEN_KEY = 'pangea-admin-token';
let token = sessionStorage.getItem(TOKEN_KEY);
let saved = null;   // last content confirmed by the server
let draft = null;   // working copy being edited
let current = Object.keys(schema.fields)[0];
const openItems = new Set(); // "section.list.index" keys of expanded list items

// ---------- DOM helper ----------
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) node.append(c);
  return node;
}
const icon = (name, cls = '') => el('span', { class: `material-symbols-outlined ${cls}` }, name);

// ---------- API ----------
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/api/login') { signOut(); throw new Error(body.error || 'Please sign in again'); }
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

// ---------- Views ----------
function show(view) {
  for (const id of ['login-view', 'editor-view']) {
    $(id).classList.toggle('hidden', id !== view);
    $(id).classList.toggle('flex', id === view);
  }
}

function signOut() {
  if (token) fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  token = null;
  sessionStorage.removeItem(TOKEN_KEY);
  show('login-view');
  $('password').focus();
}

async function enterEditor() {
  saved = await (await fetch('/api/content', { cache: 'no-store' })).json();
  // Keep unsaved edits if we got here by re-signing in after a session expired.
  draft = draft ?? structuredClone(saved);
  show('editor-view');
  renderNav();
  renderPanel();
  updateStatus();
}

// ---------- Dirty state ----------
const isDirty = () => JSON.stringify(draft) !== JSON.stringify(saved);
function updateStatus() {
  const dirty = isDirty();
  $('save-btn').disabled = !dirty;
  $('discard-btn').disabled = !dirty;
  $('status').textContent = dirty ? 'Unsaved changes' : 'All changes saved';
  $('status').className = `hidden sm:inline font-mono text-[11px] uppercase tracking-wider ${dirty ? 'text-primary' : 'text-outline'}`;
}
function showError(msg) {
  $('error-bar').textContent = msg || '';
  $('error-bar').classList.toggle('hidden', !msg);
}
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.add('hidden'), 2500);
}

// ---------- Navigation ----------
function renderNav() {
  const nav = $('section-nav');
  nav.replaceChildren(...Object.entries(schema.fields).map(([key, node]) => el('button', {
    type: 'button',
    class: `shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm whitespace-nowrap transition-colors ${key === current ? 'bg-primary/10 text-primary border border-primary/30' : 'text-on-surface-variant hover:text-white hover:bg-surface-container border border-transparent'}`,
    onclick: () => { current = key; renderNav(); renderPanel(); },
  }, icon(node.icon, 'text-[18px]'), node.label)));
}

function renderPanel() {
  const node = schema.fields[current];
  $('panel').replaceChildren(
    el('h1', { class: 'font-serif text-3xl text-white font-medium mb-1' }, node.label),
    el('p', { class: 'text-sm text-on-surface-variant mb-8' }, 'Edit the text and images for this section. Layout and styling are fixed.'),
    renderGroup(node.fields, draft[current], current),
  );
}

// ---------- Field rendering ----------
const inputCls = 'w-full rounded-lg bg-surface-container-lowest border-outline-variant/60 focus:border-primary focus:ring-0 text-white text-sm placeholder:text-outline';
const labelCls = 'block font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant mb-1.5';

function renderGroup(fields, obj, path) {
  const wrap = el('div', { class: 'grid grid-cols-1 sm:grid-cols-2 gap-5' });
  for (const [key, field] of Object.entries(fields)) {
    const full = ['textarea', 'list', 'url', 'group'].includes(field.type);
    const cell = renderField(field, obj, key, `${path}.${key}`);
    wrap.append(el('div', { class: full ? 'sm:col-span-2' : '' }, cell));
  }
  return wrap;
}

function renderField(field, obj, key, path) {
  const id = `f-${path.replace(/[^\w]/g, '-')}`;
  const onInput = (v) => { obj[key] = v; updateStatus(); };

  switch (field.type) {
    case 'text':
    case 'url': {
      const input = el('input', { id, type: 'text', class: inputCls, maxlength: field.max ?? 2000, value: obj[key], placeholder: field.type === 'url' ? 'https://…' : '' });
      input.addEventListener('input', () => onInput(input.value));
      const nodes = [el('label', { class: labelCls, for: id }, field.label), input];
      if (field.type === 'url') {
        const img = el('img', { alt: '', class: 'mt-2 h-20 rounded-lg border border-outline-variant/40 object-cover' });
        const sync = () => { img.src = input.value; img.classList.toggle('hidden', !input.value); };
        img.onerror = () => img.classList.add('hidden');
        input.addEventListener('change', sync);
        sync();
        nodes.push(img);
      }
      return nodes;
    }
    case 'textarea': {
      const ta = el('textarea', { id, rows: field.max > 1000 ? 6 : 3, class: inputCls, maxlength: field.max });
      ta.value = obj[key];
      ta.addEventListener('input', () => onInput(ta.value));
      return [el('label', { class: labelCls, for: id }, field.label), ta];
    }
    case 'icon': {
      const preview = icon(obj[key], 'text-primary text-[22px]');
      const input = el('input', { id, type: 'text', class: `${inputCls} pl-11`, value: obj[key], maxlength: 40, spellcheck: 'false' });
      input.addEventListener('input', () => { preview.textContent = input.value.trim(); onInput(input.value.trim()); });
      return [
        el('label', { class: labelCls, for: id }, field.label),
        el('div', { class: 'relative' }, el('span', { class: 'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex' }, preview), input),
        el('a', { href: 'https://fonts.google.com/icons', target: '_blank', rel: 'noopener', class: 'mt-1 inline-block text-[11px] text-outline hover:text-primary' }, 'Browse icon names ↗'),
      ];
    }
    case 'ref': {
      // Options come from the current draft, so newly added (unsaved) entries show up too.
      const names = (draft[field.source]?.items ?? []).map((x) => x.name).filter(Boolean);
      const current = obj[key];
      const missing = current && !names.includes(current);
      const select = el('select', { id, class: inputCls },
        el('option', { value: '', selected: !current }, '— Choose —'),
        missing ? el('option', { value: current, selected: true }, `${current} (not found)`) : null,
        names.map((n) => el('option', { value: n, selected: n === current }, n)));
      select.addEventListener('change', () => {
        onInput(select.value);
        // Keep the collapsed list item's title in sync.
        select.dispatchEvent(new Event('input', { bubbles: true }));
      });
      return [el('label', { class: labelCls, for: id }, field.label), select];
    }
    case 'accent': {
      const select = el('select', { id, class: inputCls },
        ACCENTS.map((a) => el('option', { value: a, selected: obj[key] === a }, { primary: 'Gold (primary)', secondary: 'Teal (secondary)', tertiary: 'Rose (tertiary)' }[a])));
      const swatch = el('span', { class: `w-9 h-9 shrink-0 rounded-lg bg-${obj[key]} border border-outline-variant/60` });
      select.addEventListener('change', () => { swatch.className = `w-9 h-9 shrink-0 rounded-lg bg-${select.value} border border-outline-variant/60`; onInput(select.value); });
      return [el('label', { class: labelCls, for: id }, field.label), el('div', { class: 'flex items-center gap-2' }, swatch, select)];
    }
    case 'number': {
      const input = el('input', { id, type: 'number', step: '0.1', min: field.min, max: field.max, class: inputCls, value: obj[key] });
      input.addEventListener('input', () => onInput(input.value === '' ? NaN : input.valueAsNumber));
      return [el('label', { class: labelCls, for: id }, field.label), input];
    }
    case 'bool': {
      const cb = el('input', { id, type: 'checkbox', class: 'rounded bg-surface-container-lowest border-outline-variant text-primary focus:ring-0 focus:ring-offset-0', checked: obj[key] });
      cb.addEventListener('change', () => onInput(cb.checked));
      return el('label', { class: 'flex items-center gap-2.5 text-sm text-on-surface-variant cursor-pointer sm:mt-7', for: id }, cb, field.label);
    }
    case 'list':
      return renderList(field, obj[key], path);
    case 'group':
      return el('fieldset', { class: 'rounded-xl border border-outline-variant/40 p-4 pt-2' },
        el('legend', { class: `${labelCls} px-2 mb-0 text-primary` }, field.label),
        renderGroup(field.fields, obj[key], path));
    default:
      return null;
  }
}

function renderList(field, items, path) {
  const container = el('div');
  const rerender = () => { container.replaceWith(renderList(field, items, path)); updateStatus(); };
  const move = (i, d) => {
    [items[i], items[i + d]] = [items[i + d], items[i]];
    const a = openItems.has(`${path}.${i}`), b = openItems.has(`${path}.${i + d}`);
    openItems[a ? 'add' : 'delete'](`${path}.${i + d}`);
    openItems[b ? 'add' : 'delete'](`${path}.${i}`);
    rerender();
  };

  const header = el('div', { class: 'flex items-center justify-between mb-3' },
    el('span', { class: labelCls + ' mb-0' }, `${field.label} (${items.length}/${field.max})`),
    el('button', {
      type: 'button',
      disabled: items.length >= field.max,
      class: 'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-xs font-mono uppercase tracking-wider hover:bg-primary/10 disabled:opacity-40',
      onclick: () => { items.push(blank({ type: 'group', fields: field.fields })); openItems.add(`${path}.${items.length - 1}`); rerender(); },
    }, icon('add', 'text-[16px]'), `Add ${field.itemLabel}`));

  const list = el('div', { class: 'flex flex-col gap-2' });
  if (!items.length) list.append(el('p', { class: 'text-sm text-outline italic py-4 text-center border border-dashed border-outline-variant/50 rounded-xl' }, `No ${field.label.toLowerCase()} yet.`));

  items.forEach((item, i) => {
    const key = `${path}.${i}`;
    const title = el('span', { class: 'font-serif text-base text-white truncate' }, item[field.titleKey] || `Untitled ${field.itemLabel.toLowerCase()}`);
    const details = el('details', { class: 'group rounded-xl bg-surface-container-low border border-outline-variant/40 open:border-primary/30', open: openItems.has(key) });
    details.addEventListener('toggle', () => openItems[details.open ? 'add' : 'delete'](key));
    const btn = (name, label, onclick, disabled) => el('button', {
      type: 'button', 'aria-label': label, title: label, disabled,
      class: 'w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-white hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent',
      onclick: (e) => { e.preventDefault(); onclick(); },
    }, icon(name, 'text-[18px]'));

    details.append(
      el('summary', { class: 'flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer list-none' },
        el('div', { class: 'flex items-center gap-3 min-w-0' },
          icon('chevron_right', 'text-outline text-[18px] transition-transform group-open:rotate-90'),
          el('span', { class: 'font-mono text-[11px] text-outline' }, String(i + 1).padStart(2, '0')),
          item.icon ? icon(item.icon, `text-[18px] text-${ACCENTS.includes(item.accent) ? item.accent : 'primary'}`) : null,
          title),
        el('div', { class: 'flex items-center shrink-0' },
          btn('arrow_upward', 'Move up', () => move(i, -1), i === 0),
          btn('arrow_downward', 'Move down', () => move(i, 1), i === items.length - 1),
          btn('delete', 'Delete', () => {
            if (!confirm(`Delete "${item[field.titleKey] || field.itemLabel}"?`)) return;
            items.splice(i, 1);
            [...openItems].filter((k) => k.startsWith(`${path}.`)).forEach((k) => openItems.delete(k));
            rerender();
          }))),
      el('div', { class: 'px-4 pb-5 pt-2 border-t border-outline-variant/20' }, renderGroup(field.fields, item, key)),
    );
    // Keep the summary title in sync while typing.
    details.addEventListener('input', (e) => {
      if (e.target.id === `f-${`${key}.${field.titleKey}`.replace(/[^\w]/g, '-')}`) title.textContent = e.target.value || `Untitled ${field.itemLabel.toLowerCase()}`;
    });
    list.append(details);
  });

  container.append(header, list);
  return container;
}

// ---------- Actions ----------
$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('login-error').classList.add('hidden');
  try {
    ({ token } = await api('/api/login', { method: 'POST', body: JSON.stringify({ password: $('password').value }) }));
    sessionStorage.setItem(TOKEN_KEY, token);
    $('password').value = '';
    await enterEditor();
  } catch (err) {
    $('login-error').textContent = err.message;
    $('login-error').classList.remove('hidden');
  }
});

$('save-btn').addEventListener('click', async () => {
  showError('');
  let clean;
  try {
    clean = validate(draft);
  } catch (err) {
    return showError(friendly(err.message));
  }
  $('save-btn').disabled = true;
  try {
    const res = await api('/api/content', { method: 'PUT', body: JSON.stringify(clean) });
    saved = res.content;
    draft = structuredClone(saved);
    renderPanel();
    updateStatus();
    toast('Saved — the site is updated');
  } catch (err) {
    showError(friendly(err.message));
    updateStatus();
  }
});

$('discard-btn').addEventListener('click', () => {
  if (!confirm('Discard all unsaved changes?')) return;
  draft = structuredClone(saved);
  showError('');
  renderPanel();
  updateStatus();
});

$('logout-btn').addEventListener('click', () => {
  if (isDirty() && !confirm('You have unsaved changes. Sign out anyway?')) return;
  draft = null;
  signOut();
});

window.addEventListener('beforeunload', (e) => { if (draft && isDirty()) e.preventDefault(); });

// Turns "content.nations.items[3].icon: …" into "Nations › Nation 4 › Icon: …"
function friendly(msg) {
  const m = msg.match(/^content\.([^:]+): (.*)$/);
  if (!m) return msg;
  const parts = [];
  let node = schema;
  for (const seg of m[1].split('.')) {
    const [, key, idx] = seg.match(/^(\w+)(?:\[(\d+)\])?$/) || [];
    node = node.fields?.[key];
    if (!node) break;
    parts.push(node.label);
    if (idx != null) { parts.push(`${node.itemLabel} ${Number(idx) + 1}`); node = { fields: node.fields }; }
  }
  return `${parts.join(' › ')}: ${m[2]}`;
}

// ---------- Boot ----------
if (token && (await fetch('/api/session', { headers: { Authorization: `Bearer ${token}` } })).ok) {
  await enterEditor();
} else {
  sessionStorage.removeItem(TOKEN_KEY);
  token = null;
  show('login-view');
  $('password').focus();
}
