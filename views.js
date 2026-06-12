// Kiki Dashboard — page views. Each view: { title, render(ctx) -> {html, wire?} }.
// All HTML is injected by app.js through a DOMPurify sink; we also esc() dynamic
// values here for attribute-safety.

// Inline SVG line icons (Lucide-style 1.8px strokes) — intentional, not emoji.
const svg = (paths) => `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const IC = {
  overview: svg('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  people: svg('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 15.2c2.4.3 4 2 4 4.3"/>'),
  onboarding: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-1.6 1.7-2.4 3-2.4s2.5.8 3 2.4"/><path d="M15 9.5h4M15 13h4"/>'),
  access: svg('<circle cx="8" cy="14.5" r="4.5"/><path d="M11.5 11.5 20 3M16 7l3 3M13.5 9.5l2 2"/>'),
  loops: svg('<path d="M17 2.5l3.5 3.5L17 9.5"/><path d="M3.5 11V9.5a3.5 3.5 0 0 1 3.5-3.5h13"/><path d="M7 21.5 3.5 18 7 14.5"/><path d="M20.5 13v1.5a3.5 3.5 0 0 1-3.5 3.5H4"/>'),
  requests: svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>'),
  groups: svg('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.5-.7L3 21l1.8-4.5A8.4 8.4 0 1 1 21 11.5z"/>'),
  kpis: svg('<path d="M3 3v18h18"/><path d="m7 14 4-4 3.5 3.5L20 8"/><path d="M16 8h4v4"/>'),
  capture: svg('<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/>'),
  health: svg('<path d="M3 12h4l2.5-6 4 12 2.5-6h5"/>'),
  ventures: svg('<circle cx="12" cy="12" r="9.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
};
export const NAV = [
  { id: 'overview', label: 'Overview', ic: IC.overview, color: '#ffd84d' },
  { id: 'people', label: 'People', ic: IC.people, count: 'people', color: '#7cc8ff' },
  { id: 'onboarding', label: 'Onboarding', ic: IC.onboarding, count: 'onboarding', color: '#5eead4' },
  { id: 'access', label: 'Access Layers', ic: IC.access, color: '#fbbf24' },
  { id: 'loops', label: 'Loops', ic: IC.loops, color: '#c4b5fd' },
  { id: 'requests', label: 'Requests', ic: IC.requests, count: 'requests', color: '#fda4af' },
  { id: 'groups', label: 'Groups', ic: IC.groups, count: 'groups', color: '#86efac' },
  { id: 'kpis', label: 'KPIs', ic: IC.kpis, color: '#67e8f9' },
  { id: 'capture', label: 'Capture', ic: IC.capture, color: '#fcd34d' },
  { sep: 'System' },
  { id: 'health', label: 'Health', ic: IC.health, color: '#f87171' },
  { id: 'ventures', label: 'Ventures', ic: IC.ventures, color: '#a5b4fc' },
];

// ---- shared bits ----
const STATUS = {
  await_owner: ['Awaiting decision', 'warn'], introduced: ['Set access', 'info'],
  await_tone: ['Onboarding', 'info'], await_lang: ['Onboarding', 'info'], await_other_lang: ['Onboarding', 'info'],
  active: ['Active', 'ok'], declined: ['Declined', 'bad'],
};
const statusTag = (e, s) => { const [t, k] = STATUS[s] || ['New', '']; return `<span class="tag ${k}">${e(t)}</span>`; };
const layerChip = (e, l) => l ? `<span class="chip accent">${e(l)}</span>` : '<span class="dim">—</span>';
const avatar = (e, name) => `<span class="avatar">${e((name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase())}</span>`;
const flag = (lang) => ({ English: 'EN', Japanese: 'JP', Arabic: 'AR' }[lang] || '··');

function stat(n, label, unit) { return `<div class="stat"><div class="n">${n}${unit ? `<span class="unit">${unit}</span>` : ''}</div><div class="l">${label}</div></div>`; }

// =================================================================== OVERVIEW
function overview(ctx) {
  const e = ctx.esc, V = ctx.ventures(), people = ctx.S.people, groups = ctx.S.groups;
  const totalActive = people.filter((p) => p.status === 'active' && !p.isOwner).length;
  const onboarding = people.filter((p) => ['await_owner', 'introduced', 'await_tone'].includes(p.status)).length;
  const openReq = people.filter((p) => p.car && p.car.step && p.car.step !== 'done').length;
  const vcards = V.map((v) => {
    const c = v.counts || {};
    return `<div class="card" style="border-top:3px solid ${e(v.accent)}">
      <div class="row"><div style="font-size:20px">${e(v.emoji || '')}</div><b>${e(v.name)}</b><span class="spacer"></span>
        <button class="btn sm ghost" data-go="${e(v.id)}">Open →</button></div>
      <div class="row" style="margin-top:14px;gap:22px">
        ${miniStat(c.people || 0, 'people')}${miniStat(c.activeAgents || 0, 'active agents')}
        ${miniStat(c.onboarding || 0, 'onboarding')}${miniStat(c.groups || 0, 'groups')}
      </div></div>`;
  }).join('');
  const recent = [...people].filter((p) => !p.isOwner).sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0)).slice(0, 6)
    .map((p) => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)">${avatar(e, p.name)}
      <div><div class="cellname">${e(p.name)}</div><div class="cellsub">${e(p.venture || '')} · ${ctx.ago(p.lastSeen)}</div></div>
      <span class="spacer"></span>${statusTag(e, p.status)}</div>`).join('');
  const html = `
    <div class="bento">
      <div class="card span2">
        <h3>Across all ventures</h3>
        <div class="row" style="gap:34px">${stat(totalActive, 'Active people')}${stat(onboarding, 'In onboarding')}${stat(openReq, 'Open requests')}${stat(V.length, 'Ventures')}</div>
      </div>
      <div class="card span2"><h3>Kiki health</h3>${healthMini(ctx)}</div>
      ${vcards}
      <div class="card span2"><h3>Recent activity</h3>${recent || '<div class="empty">No activity yet</div>'}</div>
      <div class="card span2"><h3>This week’s KPI cycle</h3>${kpiCycle(ctx)}</div>
    </div>`;
  return { html, wire(elr) { elr.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => { ctx.S.venture = b.dataset.go; localStorage.setItem('kiki_venture', b.dataset.go); ctx.go('people'); }); } };
}
const miniStat = (n, l) => `<div><div style="font-size:20px;font-weight:800">${n}</div><div class="cellsub">${l}</div></div>`;
function healthMini(ctx) {
  const h = ctx.S.boot?.health || {};
  const ok = h.connected !== false;
  return `<div class="row" style="gap:20px">
    <div class="stat"><div class="n" style="color:${ok ? 'var(--ok)' : 'var(--bad)'}">${ok ? 'Live' : 'Down'}</div><div class="l">WhatsApp</div></div>
    ${stat((h.heartbeatAge ?? '—') + (h.heartbeatAge != null ? 's' : ''), 'Heartbeat')}
    ${stat((h.rateLimit?.used ?? 0) + '/' + (h.rateLimit?.cap ?? 60), 'Replies this hr')}
    <span class="spacer"></span><a class="btn sm ghost" href="#/health">Details</a></div>`;
}
function kpiCycle(ctx) {
  const e = ctx.esc; const agents = ctx.S.people.filter((p) => p.layer === 'agent' && p.status === 'active');
  if (!agents.length) return '<div class="empty">No active agents</div>';
  const done = agents.filter((a) => a.kpiDoneWeek).length;
  const pct = Math.round((done / agents.length) * 100);
  return `<div class="row" style="justify-content:space-between"><b>${done}/${agents.length} submitted</b><span class="muted">${pct}%</span></div>
    <div class="bar" style="margin:10px 0 14px"><span style="width:${pct}%"></span></div>
    <div class="row">${agents.slice(0, 10).map((a) => `<span class="chip" title="${e(a.name)}" style="${a.kpiDoneWeek ? 'background:color-mix(in oklab,var(--ok) 18%,transparent);color:var(--ok)' : ''}">${e(a.name.split(' ')[0])}</span>`).join('')}</div>`;
}

// ===================================================================== PEOPLE
function people(ctx) {
  const e = ctx.esc; let filter = 'all'; const sel = new Set();
  const rowsFor = () => {
    let list = ctx.vPeople().filter((p) => !p.isOwner);
    if (filter === 'agents') list = list.filter((p) => p.layer === 'agent');
    else if (filter === 'onboarding') list = list.filter((p) => ['await_owner', 'introduced', 'await_tone', 'await_lang'].includes(p.status));
    else if (filter === 'active') list = list.filter((p) => p.status === 'active');
    const q = (document.querySelector('#peoplesearch')?.value || '').toLowerCase();
    if (q) list = list.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.number || '').includes(q));
    return list.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  };
  const html = `
    <div class="toolbar">
      <div class="filter" id="pf">
        ${['all', 'agents', 'active', 'onboarding'].map((f) => `<button data-f="${f}" class="${f === 'all' ? 'on' : ''}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}
      </div>
      <div class="search"><span class="mag">⌕</span><input id="peoplesearch" placeholder="Filter…" /></div>
    </div>
    <div id="ptable"></div>`;
  function paint() {
    const wrap = document.querySelector('#ptable'); if (!wrap) return;
    const list = rowsFor();
    // Render the FULL table each paint — DOMPurify drops bare <tr> outside a table.
    ctx.setHTML(wrap, `<div class="table-wrap"><table>
      <thead><tr><th style="width:34px"></th><th>Name</th><th>Venture</th><th>Layer</th><th>Lang</th><th>Status</th><th>Groups</th><th>Last seen</th></tr></thead>
      <tbody>${list.map((p) => `
        <tr data-jid="${e(p.jid)}" class="${sel.has(p.jid) ? 'selected' : ''}">
          <td><input type="checkbox" data-ck="${e(p.jid)}" ${sel.has(p.jid) ? 'checked' : ''}/></td>
          <td><div class="who">${avatar(e, p.name)}<div><div class="cellname">${e(p.name)}</div><div class="cellsub">${e(p.number)}</div></div></div></td>
          <td>${e(p.venture || '—')}</td><td>${layerChip(e, p.layer)}</td>
          <td><span class="tag">${flag(p.lang)}</span></td><td>${statusTag(e, p.status)}</td>
          <td>${(p.groups || []).length || '—'}</td><td class="muted">${ctx.ago(p.lastSeen)}</td>
        </tr>`).join('') || `<tr><td colspan="8"><div class="empty">No people in this view</div></td></tr>`}</tbody></table></div>`);
    wrap.querySelectorAll('[data-ck]').forEach((ck) => ck.onclick = (ev) => { ev.stopPropagation(); const j = ck.dataset.ck; ck.checked ? sel.add(j) : sel.delete(j); paint(); });
    wrap.querySelectorAll('tr[data-jid]').forEach((tr) => tr.onclick = () => personDrawer(ctx, tr.dataset.jid));
    bulk();
  }
  function bulk() {
    let bar = document.querySelector('#bulkbar');
    if (!bar) { bar = document.createElement('div'); bar.id = 'bulkbar'; bar.className = 'bulkbar'; document.body.appendChild(bar); }
    ctx.setHTML(bar, `<span class="n">${sel.size} selected</span>
      <button class="btn sm primary" data-act="grant">Grant access</button>
      <button class="btn sm" data-act="kpi">Start KPI</button>
      <button class="btn sm ghost" data-act="clear">Clear</button>`);
    bar.classList.toggle('show', sel.size > 0);
    bar.querySelector('[data-act=clear]').onclick = () => { sel.clear(); paint(); };
    bar.querySelector('[data-act=grant]').onclick = () => grantModal(ctx, [...sel], () => { sel.clear(); });
    bar.querySelector('[data-act=kpi]').onclick = async () => { await ctx.cmd('startLoop', { loop: 'weekly-kpi', personJids: [...sel] }, `KPI started for ${sel.size}`); sel.clear(); };
  }
  return {
    html,
    wire(elr) {
      elr.querySelector('#pf').querySelectorAll('button').forEach((b) => b.onclick = () => { filter = b.dataset.f; elr.querySelectorAll('#pf button').forEach((x) => x.classList.toggle('on', x === b)); paint(); });
      elr.querySelector('#peoplesearch').oninput = paint;
      paint();
    },
  };
}

function personDrawer(ctx, jid) {
  const e = ctx.esc; const p = ctx.S.people.find((x) => x.jid === jid); if (!p) return;
  const v = ctx.ventures().find((x) => x.id === p.venture);
  const layers = v?.layers || [];
  const car = p.car;
  ctx.drawer(`
    <div class="dhead">${avatar(e, p.name)}<div><div style="font-weight:700;font-size:16px">${e(p.name)}</div><div class="cellsub">${e(p.number)} · ${e(p.venture || '')}</div></div>
      <span class="spacer"></span><button class="btn sm ghost" id="dx">✕</button></div>
    <div class="dbody">
      <div class="kv">
        <div class="k">Status</div><div>${statusTag(e, p.status)}</div>
        <div class="k">Access layer</div><div>${layerChip(e, p.layer)}</div>
        <div class="k">Language</div><div>${e(p.lang || '—')}</div>
        <div class="k">Tone</div><div>${e(p.tone || '—')}</div>
        <div class="k">In groups</div><div>${(p.groups || []).map((g) => `<span class="tag">${e(g)}</span>`).join(' ') || '—'}</div>
        <div class="k">KPI this week</div><div>${p.kpiDoneWeek ? '<span class="tag ok">submitted</span>' : '<span class="tag warn">pending</span>'}</div>
        <div class="k">First seen</div><div class="muted">${ctx.ago(p.firstSeen)}</div>
      </div>
      ${car ? `<div class="card"><h3>Open car request</h3><div class="kv">
        <div class="k">Car</div><div>${e(car.car || '')}</div><div class="k">Date</div><div>${e(car.date || '')}</div>
        <div class="k">Time</div><div>${e(car.time || '')}</div><div class="k">Purpose</div><div>${e(car.purpose || '')}</div></div></div>` : ''}
      <div class="row" style="flex-wrap:wrap;gap:8px">
        ${p.status === 'await_owner' ? `<button class="btn primary" data-act="introduce">Introduce</button><button class="btn danger" data-act="decline">Decline</button>` : ''}
        ${['introduced', 'active'].includes(p.status) ? `<button class="btn primary" data-act="grant">${p.layer ? 'Change' : 'Grant'} access</button>` : ''}
        ${p.layer === 'agent' ? `<button class="btn" data-act="kpi">Start KPI</button>` : ''}
        <button class="btn ghost danger" data-act="reset">Hard reset</button>
      </div>
    </div>`);
  const d = document.querySelector('#drawer');
  d.querySelector('#dx').onclick = ctx.closeOverlays;
  const act = (a, fn) => { const b = d.querySelector(`[data-act=${a}]`); if (b) b.onclick = fn; };
  act('introduce', () => ctx.cmd('introduce', { personJid: jid }, `Introduced ${p.name}`).then(ctx.closeOverlays));
  act('decline', () => ctx.cmd('decline', { personJid: jid }, `Declined ${p.name}`).then(ctx.closeOverlays));
  act('grant', () => grantModal(ctx, [jid]));
  act('kpi', () => ctx.cmd('startLoop', { loop: 'weekly-kpi', personJids: [jid] }, `KPI started for ${p.name}`).then(ctx.closeOverlays));
  act('reset', () => ctx.cmd('decline', { personJid: jid }, 'Reset queued').then(ctx.closeOverlays));
}

function grantModal(ctx, jids, after) {
  const e = ctx.esc;
  const vid = ctx.S.people.find((x) => x.jid === jids[0])?.venture;
  const v = ctx.ventures().find((x) => x.id === vid) || ctx.currentV();
  const layers = v?.layers || [{ id: 'agent', name: 'agent' }, { id: 'CEO', name: 'CEO' }];
  let pick = layers[0]?.id;
  ctx.modal(`
    <div class="mhead">Grant access — ${jids.length} ${jids.length === 1 ? 'person' : 'people'}</div>
    <div class="mbody">
      <div class="muted">${e(v?.name || '')} layers</div>
      <div class="seg" id="lseg">${layers.map((l, i) => `<button data-l="${e(l.id)}" class="${i === 0 ? 'on' : ''}">${e(l.name)}</button>`).join('')}</div>
      <div class="dim">Kiki will message each person their welcome in their own language and mark them active.</div>
    </div>
    <div class="mfoot"><button class="btn ghost" id="gc">Cancel</button><button class="btn primary" id="gok">Grant to ${jids.length}</button></div>`);
  const m = document.querySelector('#modal');
  m.querySelectorAll('#lseg button').forEach((b) => b.onclick = () => { pick = b.dataset.l; m.querySelectorAll('#lseg button').forEach((x) => x.classList.toggle('on', x === b)); });
  m.querySelector('#gc').onclick = ctx.closeOverlays;
  m.querySelector('#gok').onclick = async () => { await ctx.cmd('grantLayer', { personJids: jids, layer: pick }, `Granted ${pick} to ${jids.length}`); after && after(); ctx.closeOverlays(); };
}

// ================================================================= ONBOARDING
function onboarding(ctx) {
  const e = ctx.esc;
  const list = ctx.vPeople().filter((p) => ['await_owner', 'introduced', 'await_tone', 'await_lang', 'await_other_lang'].includes(p.status));
  const html = list.length ? `<div class="bento">${list.map((p) => `
    <div class="card span2">
      <div class="row">${avatar(e, p.name)}<div><div class="cellname">${e(p.name)}</div><div class="cellsub">${e(p.number)} · ${e(p.venture || '')}</div></div><span class="spacer"></span>${statusTag(e, p.status)}</div>
      <div class="row" style="margin-top:14px;gap:8px">
        ${p.status === 'await_owner'
      ? `<button class="btn primary sm" data-act="introduce" data-jid="${e(p.jid)}">Introduce</button><button class="btn danger sm" data-act="decline" data-jid="${e(p.jid)}">Decline</button>`
      : `<span class="muted">Lang ${e(p.lang || '—')} · Tone ${e(p.tone || '—')}</span><span class="spacer"></span><button class="btn primary sm" data-act="grant" data-jid="${e(p.jid)}">Grant access</button>`}
      </div></div>`).join('')}</div>` : '<div class="empty">No one in onboarding for this venture 🎉</div>';
  return {
    html,
    wire(elr) {
      elr.querySelectorAll('[data-act=introduce]').forEach((b) => b.onclick = () => ctx.cmd('introduce', { personJid: b.dataset.jid }, 'Introduced'));
      elr.querySelectorAll('[data-act=decline]').forEach((b) => b.onclick = () => ctx.cmd('decline', { personJid: b.dataset.jid }, 'Declined'));
      elr.querySelectorAll('[data-act=grant]').forEach((b) => b.onclick = () => grantModal(ctx, [b.dataset.jid]));
    },
  };
}

// ===================================================================== ACCESS
function access(ctx) {
  const e = ctx.esc; const V = ctx.currentV() ? [ctx.currentV()] : ctx.ventures();
  const html = V.map((v) => {
    const layers = v.layers || [];
    return `<div class="card" style="margin-bottom:16px;border-left:3px solid ${e(v.accent)}">
      <div class="row"><b>${e(v.emoji || '')} ${e(v.name)}</b><span class="spacer"></span><button class="btn sm" data-addlayer="${e(v.id)}">+ Layer</button></div>
      <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${layers.map((l) => {
      const members = ctx.S.people.filter((p) => p.venture === v.id && p.layer === l.id && p.status === 'active');
      return `<div class="card" style="background:var(--surface-2)">
            <div class="row"><span class="chip accent">${e(l.name)}</span><span class="spacer"></span><span class="muted">${members.length}</span></div>
            <div class="dim" style="margin:6px 0 10px">${e(l.desc || '')}</div>
            <div>${members.slice(0, 8).map((m) => `<span class="tag">${e(m.name.split(' ')[0])}</span>`).join(' ') || '<span class="dim">no members</span>'}</div>
          </div>`;
    }).join('') || '<div class="dim">No layers yet</div>'}
      </div></div>`;
  }).join('');
  return { html, wire(elr) { elr.querySelectorAll('[data-addlayer]').forEach((b) => b.onclick = () => addLayerModal(ctx, b.dataset.addlayer)); } };
}
function addLayerModal(ctx, ventureId) {
  const e = ctx.esc;
  ctx.modal(`<div class="mhead">New access layer</div><div class="mbody">
    <label class="field">Layer name<input id="ln" placeholder="e.g. team-lead" /></label>
    <label class="field">What it unlocks<input id="ld" placeholder="short description" /></label></div>
    <div class="mfoot"><button class="btn ghost" id="lc">Cancel</button><button class="btn primary" id="lok">Create</button></div>`);
  document.querySelector('#lc').onclick = ctx.closeOverlays;
  document.querySelector('#lok').onclick = async () => {
    const name = document.querySelector('#ln').value.trim(); if (!name) return ctx.toast('Name required', 'bad');
    await ctx.cmd('addLayer', { ventureId, layer: { id: name.toLowerCase().replace(/\s+/g, '-'), name, desc: document.querySelector('#ld').value } }, `Layer “${name}” added`);
    ctx.closeOverlays();
  };
}

// ====================================================================== LOOPS
function loops(ctx) {
  const e = ctx.esc; const V = ctx.currentV() ? [ctx.currentV()] : ctx.ventures();
  const html = V.map((v) => (v.loops || []).map((lp) => {
    const agents = ctx.S.people.filter((p) => p.venture === v.id && p.layer === 'agent' && p.status === 'active');
    const done = agents.filter((a) => a.kpiDoneWeek).length;
    const pct = agents.length ? Math.round(done / agents.length * 100) : 0;
    return `<div class="card" style="margin-bottom:14px">
      <div class="row"><span style="font-size:18px">🔁</span><b>${e(lp.name)}</b><span class="tag">${e(v.name)}</span><span class="spacer"></span>
        <span class="muted">${e(lp.cadence || '')}</span><button class="btn sm primary" data-run="${e(lp.id)}">Run now</button></div>
      <div class="row" style="margin-top:12px"><span class="muted">Audience: ${e(lp.audience || '')}</span><span class="spacer"></span><b>${done}/${agents.length} this cycle</b></div>
      <div class="bar" style="margin-top:8px"><span style="width:${pct}%"></span></div>
      <div class="row" style="margin-top:12px">${agents.map((a) => `<span class="chip" style="${a.kpiDoneWeek ? 'background:color-mix(in oklab,var(--ok) 18%,transparent);color:var(--ok)' : ''}">${e(a.name.split(' ')[0])}</span>`).join('') || '<span class="dim">no audience</span>'}</div>
    </div>`;
  }).join('')).join('') || '<div class="empty">No loops for this venture</div>';
  return { html, wire(elr) { elr.querySelectorAll('[data-run]').forEach((b) => b.onclick = () => ctx.cmd('startLoop', { loop: b.dataset.run, audience: 'active-agents' }, 'Loop started for all active agents')); } };
}

// =================================================================== REQUESTS
function requests(ctx) {
  const e = ctx.esc;
  const open = ctx.vPeople().filter((p) => p.car && p.car.step);
  const html = `<div class="card" style="margin-bottom:16px"><h3>Open requests</h3>${open.length ? open.map((p) => `
      <div class="row" style="padding:12px 0;border-bottom:1px solid var(--line)">
        <span style="font-size:18px">🚗</span>
        <div><div class="cellname">${e(p.name)} — ${e(p.car.car || '')}</div><div class="cellsub">${e(p.car.date || '')} · ${e(p.car.time || '')} · ${e(p.car.purpose || '')}</div></div>
        <span class="spacer"></span><span class="tag info">${e(p.car.step)}</span>
        <button class="btn sm primary" data-app="${e(p.jid)}">Approve</button><button class="btn sm danger" data-dec="${e(p.jid)}">Decline</button>
      </div>`).join('') : '<div class="empty">No open requests</div>'}</div>
    <div class="card"><h3>Request types</h3>${ctx.ventures().map((v) => (v.requests || []).map((r) => `<div class="row" style="padding:8px 0"><b>${e(r.name)}</b><span class="tag">${e(v.name)}</span><span class="spacer"></span><span class="muted">approver: ${e(r.approver || 'none')}</span></div>`).join('')).join('')}</div>`;
  return {
    html, wire(elr) {
      elr.querySelectorAll('[data-app]').forEach((b) => b.onclick = () => ctx.cmd('carApprove', { agentJid: b.dataset.app, decision: 'accept' }, 'Approved'));
      elr.querySelectorAll('[data-dec]').forEach((b) => b.onclick = () => ctx.cmd('carApprove', { agentJid: b.dataset.dec, decision: 'decline' }, 'Declined'));
    },
  };
}

// ===================================================================== GROUPS
function groups(ctx) {
  const e = ctx.esc; const list = ctx.vGroups();
  const html = list.length ? `<div class="bento">${list.map((g) => `
    <div class="card span2">
      <div class="row"><span style="font-size:18px">💬</span><b>${e(g.name)}</b><span class="spacer"></span>
        <span class="tag ${g.active ? 'ok' : 'warn'}">${g.active ? 'Active' : 'Observe-only'}</span></div>
      <div class="row" style="margin-top:10px;gap:8px"><span class="tag">${e(g.venture || 'no venture')}</span><span class="tag">${flag(g.lang)}</span><span class="muted">${e(g.role || 'no role set')}</span></div>
      <div class="row" style="margin-top:14px"><span class="spacer"></span>
        <button class="btn sm ${g.active ? 'ghost' : 'primary'}" data-tog="${e(g.jid)}" data-on="${g.active ? '0' : '1'}">${g.active ? 'Set observe-only' : 'Activate'}</button></div>
    </div>`).join('')}</div>` : '<div class="empty">Kiki isn’t in any groups for this venture</div>';
  return { html, wire(elr) { elr.querySelectorAll('[data-tog]').forEach((b) => b.onclick = () => ctx.cmd(b.dataset.on === '1' ? 'activateGroup' : 'deactivateGroup', { jid: b.dataset.tog }, b.dataset.on === '1' ? 'Group activated' : 'Set to observe-only')); } };
}

// ======================================================================= KPIS
function kpis(ctx) {
  const e = ctx.esc; const data = ctx.S.kpis;
  if (!data.length) return { html: '<div class="empty">No KPI submissions yet</div>' };
  // leaderboard: sum Deals across weeks per agent
  const agg = {};
  data.forEach((wk) => wk.rows.forEach((r) => { const n = r[wk.header[0]]; agg[n] = (agg[n] || 0) + (Number(r.Deals) || 0); }));
  const board = Object.entries(agg).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...board.map((x) => x[1]));
  const weekTotals = data.map((wk) => wk.rows.reduce((s, r) => s + (Number(r.Deals) || 0), 0));
  const last = data[data.length - 1];
  const html = `
    <div class="bento">
      <div class="card span2"><h3>Deals leaderboard (all weeks)</h3>
        ${board.map(([n, v]) => `<div style="margin:9px 0"><div class="row"><span>${e(n)}</span><span class="spacer"></span><b>${v}</b></div><div class="bar"><span style="width:${Math.round(v / max * 100)}%"></span></div></div>`).join('')}</div>
      <div class="card span2"><h3>Deals per week</h3>
        <div class="spark">${weekTotals.map((t) => `<i style="height:${Math.round(t / Math.max(1, ...weekTotals) * 100)}%" title="${t}"></i>`).join('')}</div>
        <div class="row" style="margin-top:8px">${data.map((wk) => `<span class="cellsub" style="flex:1;text-align:center">${e(wk.date.slice(5))}</span>`).join('')}</div></div>
      <div class="card span4"><h3>Latest — ${e(last.date)}</h3>
        <div class="table-wrap"><table><thead><tr>${last.header.map((h) => `<th>${e(h)}</th>`).join('')}</tr></thead>
        <tbody>${last.rows.map((r) => `<tr>${last.header.map((h, i) => `<td class="${i === 0 ? 'cellname' : ''}">${e(r[h] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
    </div>`;
  return { html };
}

// ==================================================================== CAPTURE
function capture(ctx) {
  const e = ctx.esc;
  const recent = [...ctx.vPeople()].filter((p) => !p.isOwner).sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0)).slice(0, 20);
  const html = `<div class="card"><h3>Recent contacts (captured)</h3>
    <div class="table-wrap"><table><thead><tr><th>Who</th><th>Venture</th><th>Last seen</th><th>Groups</th></tr></thead>
    <tbody>${recent.map((p) => `<tr><td><div class="who">${avatar(e, p.name)}<div><div class="cellname">${e(p.name)}</div><div class="cellsub">${e(p.number)}</div></div></div></td><td>${e(p.venture || '—')}</td><td class="muted">${ctx.ago(p.lastSeen)}</td><td>${(p.groups || []).length}</td></tr>`).join('')}</tbody></table></div>
    <div class="dim" style="margin-top:12px">Full transcripts live in the vault (Kiki-bot/Transcripts). A transcript reader can be wired here next.</div></div>`;
  return { html };
}

// ===================================================================== HEALTH
function health(ctx) {
  const e = ctx.esc; const h = ctx.S.boot?.health || {};
  const ok = h.connected !== false;
  const html = `<div class="bento">
    <div class="card"><h3>WhatsApp</h3>${stat(`<span style="color:${ok ? 'var(--ok)' : 'var(--bad)'}">${ok ? 'Live' : 'Down'}</span>`, 'Connection')}</div>
    <div class="card"><h3>Heartbeat</h3>${stat((h.heartbeatAge ?? '—'), h.heartbeatAge != null ? 'seconds old' : 'unknown', '')}</div>
    <div class="card"><h3>Replies this hour</h3>${stat((h.rateLimit?.used ?? 0) + '/' + (h.rateLimit?.cap ?? 60), 'cap')}</div>
    <div class="card"><h3>Mode</h3>${stat(h.dev ? 'DEV' : 'LIVE', 'data source')}</div>
    <div class="card span4"><h3>Hosts</h3>
      <div class="table-wrap"><table><thead><tr><th>Host</th><th>Role</th><th>Tailscale</th><th>Status</th></tr></thead>
      <tbody>${(h.hosts || []).map((x) => `<tr><td class="cellname">${e(x.name)}</td><td>${e(x.role)}</td><td class="muted">${e(x.tailscale)}</td><td><span class="tag ok">reachable</span></td></tr>`).join('')}</tbody></table></div></div>
    <div class="card span4"><h3>Reliability</h3>
      <div class="kv">
        <div class="k">Self-heal</div><div>On-Mini watchdog restarts Kiki if heartbeat stale &gt; 3 min</div>
        <div class="k">External alert</div><div>i13 Telegrams the owner if Kiki down / Mini unreachable</div>
        <div class="k">Backups</div><div>M16 (6×/day) + Google Drive — auth/ + state.json</div>
      </div></div>
  </div>`;
  return { html };
}

// =================================================================== VENTURES
function ventures(ctx) {
  const e = ctx.esc;
  const html = `<div class="bento">${ctx.ventures().map((v) => `
    <div class="card span2" style="border-top:3px solid ${e(v.accent)}">
      <div class="row"><span style="font-size:22px">${e(v.emoji || '')}</span><b style="font-size:16px">${e(v.name)}</b><span class="spacer"></span><span class="tag" style="background:${e(v.accent)};color:#181b21">${e(v.accent)}</span></div>
      <div class="kv" style="margin-top:14px">
        <div class="k">Layers</div><div>${(v.layers || []).map((l) => `<span class="chip">${e(l.name)}</span>`).join(' ') || '—'}</div>
        <div class="k">Loops</div><div>${(v.loops || []).map((l) => `<span class="tag">${e(l.name)}</span>`).join(' ') || '—'}</div>
        <div class="k">Requests</div><div>${(v.requests || []).map((r) => `<span class="tag">${e(r.name)}</span>`).join(' ') || '—'}</div>
        <div class="k">People</div><div>${v.counts?.people || 0}</div>
      </div></div>`).join('')}
    <div class="card span2" style="display:grid;place-items:center;min-height:140px"><button class="btn primary" id="addv">+ Add a venture</button></div>
    </div>`;
  return { html, wire(elr) { const b = elr.querySelector('#addv'); if (b) b.onclick = () => document.querySelector('#vmenu') && document.querySelector('[data-v=__add]').click(); } };
}

export const VIEWS = {
  overview: { title: 'Overview', render: overview },
  people: { title: 'People', render: people },
  onboarding: { title: 'Onboarding', render: onboarding },
  access: { title: 'Access Layers', render: access },
  loops: { title: 'Loops', render: loops },
  requests: { title: 'Requests', render: requests },
  groups: { title: 'Groups', render: groups },
  kpis: { title: 'KPIs', render: kpis },
  capture: { title: 'Capture', render: capture },
  health: { title: 'Health', render: health },
  ventures: { title: 'Ventures', render: ventures },
};
