// Kiki Dashboard — app core: auth, data, shell, venture switcher, router.
import { VIEWS, NAV } from './views.js';

const $ = (s, r = document) => r.querySelector(s);
const root = $('#root');

// Single sanitized HTML-injection point. All dynamic strings are DOMPurify'd —
// WhatsApp display names / notes are semi-untrusted, so this is the safe sink.
const DP = window.DOMPurify;
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function setHTML(node, html) { node.innerHTML = DP.sanitize(html, { ADD_ATTR: ['data-v', 'data-jid', 'data-act', 'data-id'] }); }

const S = {
  token: localStorage.getItem('kiki_dash_token') || '',
  boot: null, venture: localStorage.getItem('kiki_venture') || 'all',
  people: [], groups: [], kpis: [], commands: [], route: location.hash.slice(2) || 'overview',
};

// ---- api ----
async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + S.token, ...(opts.headers || {}) },
  });
  if (res.status === 401) { logout(); throw new Error('unauthorized'); }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}
async function loadAll() {
  const [boot, people, groups, kpis] = await Promise.all([
    api('/api/bootstrap'), api('/api/people'), api('/api/groups'), api('/api/kpis'),
  ]);
  S.boot = boot; S.people = people; S.groups = groups; S.kpis = kpis;
}
async function cmd(action, payload = {}, note) {
  try {
    const r = await api('/api/command', { method: 'POST', body: JSON.stringify({ action, ...payload }) });
    toast(note || 'Done', 'ok');
    await loadAll(); render();
    return r;
  } catch (e) { toast('Failed: ' + e.message, 'bad'); throw e; }
}

// ---- venture helpers ----
const ventures = () => S.boot?.ventures || [];
const currentV = () => ventures().find((v) => v.id === S.venture) || null;
const inVenture = (x) => S.venture === 'all' || x.venture === S.venture || x.venture === currentV()?.name;
const vPeople = () => S.people.filter(inVenture);
const vGroups = () => S.groups.filter(inVenture);
function applyAccent() {
  const v = currentV();
  document.documentElement.style.setProperty('--accent', v?.accent || '#ffd84d');
  document.documentElement.style.setProperty('--accent-ink', '#181b21');
}

// ---- ui helpers ----
function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind; t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 2600);
}
function initials(name) { return (name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase(); }
function ago(ms) {
  if (!ms) return '—';
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 45) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago';
}
function ensure(id, cls) {
  let n = $('#' + id);
  if (!n) { n = document.createElement('div'); n.id = id; n.className = cls; document.body.appendChild(n); }
  return n;
}
function drawer(html) {
  const sc = ensure('scrim', 'scrim'), dr = ensure('drawer', 'drawer');
  setHTML(dr, html);
  requestAnimationFrame(() => { sc.classList.add('show'); dr.classList.add('show'); });
  sc.onclick = closeOverlays; return dr;
}
function modal(html) {
  const sc = ensure('scrim', 'scrim'), md = ensure('modal', 'modal');
  setHTML(md, html);
  requestAnimationFrame(() => { sc.classList.add('show'); md.classList.add('show'); });
  sc.onclick = closeOverlays; return md;
}
function closeOverlays() { ['#scrim', '#drawer', '#modal'].forEach((s) => $(s)?.classList.remove('show')); }

// ---- context for views ----
const ctx = {
  get S() { return S; }, api, cmd, toast, drawer, modal, closeOverlays, setHTML, esc,
  initials, ago, ventures, currentV, vPeople, vGroups,
  go(route) { location.hash = '/' + route; },
  refresh: async () => { await loadAll(); render(); },
};

// ---- shell ----
function render() {
  if (!S.token) return renderLogin();
  applyAccent();
  const view = VIEWS[S.route] || VIEWS.overview;
  setHTML(root, `
    <div class="app">
      ${sidebar(navCounts())}
      <div class="main">
        ${topbar(view)}
        ${S.boot?.dev ? '<div class="devbanner">DEV DATA — pointed at a throwaway copy; the live bot is untouched</div>' : ''}
        <div class="content fade" id="content"></div>
      </div>
    </div>`);
  wireShell();
  const out = view.render(ctx);
  const c = $('#content');
  setHTML(c, out.html);
  out.wire && out.wire(c, ctx);
}

function navCounts() {
  const p = vPeople();
  return {
    people: p.length,
    onboarding: p.filter((x) => ['await_owner', 'introduced', 'await_tone', 'await_lang', 'await_other_lang'].includes(x.status)).length,
    requests: p.filter((x) => x.car && x.car.step && x.car.step !== 'done').length,
    groups: vGroups().length,
  };
}

function sidebar(counts) {
  const v = currentV();
  const items = NAV.map((n) => {
    if (n.sep) return `<div class="sep">${esc(n.sep)}</div>`;
    const active = S.route === n.id ? 'active' : '';
    const c = counts[n.count] ?? null;
    return `<a href="#/${n.id}" class="${active}"><span class="ic">${n.ic}</span>${esc(n.label)}${c != null && c > 0 ? `<span class="count">${c}</span>` : ''}</a>`;
  }).join('');
  return `
    <aside class="sidebar">
      <div class="brand"><div class="mark">K</div><div><div class="name">Kiki</div><div class="sub">Control Center</div></div></div>
      <div class="venture-switch">
        <button id="vbtn"><span class="v-emoji">${esc(v?.emoji || '🧭')}</span><span class="v-name">${esc(v?.name || 'All ventures')}</span><span class="v-caret">▾</span></button>
        <div class="venture-menu" id="vmenu">
          <button data-v="all"><span class="dot" style="background:var(--muted)"></span>All ventures</button>
          ${ventures().map((x) => `<button data-v="${esc(x.id)}"><span class="dot" style="background:${esc(x.accent)}"></span>${esc((x.emoji || '') + ' ' + x.name)}</button>`).join('')}
          <button class="add" data-v="__add"><span class="dot" style="background:var(--accent)"></span>+ Add venture</button>
        </div>
      </div>
      <nav class="nav">${items}</nav>
      <div class="side-foot">Owner ${esc(S.boot?.ownerNumber || '')}</div>
    </aside>`;
}

function topbar(view) {
  const h = S.boot?.health || {};
  const ok = h.connected !== false;
  const hb = h.heartbeatAge != null ? `${h.heartbeatAge}s` : '—';
  return `
    <header class="topbar">
      <h1>${esc(view.title)}</h1>
      ${currentV() ? `<span class="chip accent"><span class="dot" style="background:var(--accent)"></span>${esc(currentV().name)}</span>` : ''}
      <div class="search"><span class="mag">⌕</span><input id="globalsearch" placeholder="Search people, groups…" /></div>
      <a href="#/health" class="health-pill ${ok ? '' : 'bad'}"><span class="dot"></span>${ok ? 'Live' : 'Down'} · ♥ ${esc(hb)}</a>
    </header>`;
}

function wireShell() {
  $('#vbtn').onclick = (e) => { e.stopPropagation(); $('#vmenu').classList.toggle('open'); };
  document.addEventListener('click', () => $('#vmenu')?.classList.remove('open'), { once: true });
  $('#vmenu').querySelectorAll('button').forEach((b) => b.onclick = () => {
    const v = b.dataset.v;
    if (v === '__add') { $('#vmenu').classList.remove('open'); return addVentureModal(); }
    S.venture = v; localStorage.setItem('kiki_venture', v); render();
  });
  const gs = $('#globalsearch');
  if (gs) gs.oninput = () => { if (S.route !== 'people') ctx.go('people'); setTimeout(() => { const f = $('#peoplesearch'); if (f) { f.value = gs.value; f.dispatchEvent(new Event('input')); } }, 30); };
}

function addVentureModal() {
  modal(`
    <div class="mhead">Add a venture</div>
    <div class="mbody">
      <label class="field">Name<input id="vn" placeholder="e.g. AYUVA" /></label>
      <label class="field">Emoji<input id="ve" placeholder="🏛️" maxlength="3" /></label>
      <label class="field">Accent color<input id="va" type="color" value="#7cc8ff" /></label>
    </div>
    <div class="mfoot"><button class="btn ghost" id="vc">Cancel</button><button class="btn primary" id="vok">Create</button></div>`);
  $('#vc').onclick = closeOverlays;
  $('#vok').onclick = async () => {
    const name = $('#vn').value.trim(); if (!name) return toast('Name required', 'bad');
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await cmd('addVenture', { venture: { id, name, emoji: $('#ve').value || '🧭', accent: $('#va').value, layers: [], loops: [], requests: [] } }, `Venture “${name}” added`);
    closeOverlays();
  };
}

// ---- login ----
function renderLogin() {
  setHTML(root, `
    <div class="login"><div class="box">
      <div class="mark">K</div>
      <h2 style="margin:0 0 4px">Kiki Control Center</h2>
      <p class="muted" style="margin:0 0 18px">Enter the access token (printed by the dashboard server).</p>
      <label class="field">Token<input id="tok" type="password" placeholder="paste token" /></label>
      <button class="btn primary" id="go" style="margin-top:16px;width:100%;justify-content:center">Unlock</button>
      <p class="dim" id="err" style="margin-top:12px;min-height:16px"></p>
    </div></div>`);
  const go = async () => {
    S.token = $('#tok').value.trim();
    try { await loadAll(); localStorage.setItem('kiki_dash_token', S.token); render(); }
    catch { $('#err').textContent = 'Invalid token.'; }
  };
  $('#go').onclick = go;
  $('#tok').onkeydown = (e) => { if (e.key === 'Enter') go(); };
}
function logout() { S.token = ''; localStorage.removeItem('kiki_dash_token'); renderLogin(); }

// ---- router / boot ----
window.addEventListener('hashchange', () => { S.route = location.hash.slice(2) || 'overview'; render(); });
(async function boot() {
  if (!S.token) return renderLogin();
  try { await loadAll(); render(); } catch { renderLogin(); }
  setInterval(async () => {
    if (!S.token) return;
    try { S.boot.health = await api('/api/health'); const p = $('.health-pill'); if (p) p.classList.toggle('bad', S.boot.health.connected === false); } catch {}
  }, 15000);
})();
