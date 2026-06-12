// DEMO MODE (GitHub Pages) — static snapshots, fake data, no backend.
localStorage.setItem('kiki_dash_token', 'demo');
const realFetch = window.fetch.bind(window);
window.fetch = (url, opts = {}) => {
  const u = String(url);
  if (u.startsWith('/api/')) {
    if ((opts.method || 'GET') === 'POST') {
      return Promise.resolve(new Response(JSON.stringify({ ok: true, id: 'demo', queued: true, appliedLocally: false }), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    const name = u.split('/api/')[1].split('?')[0].split('/')[0];
    return realFetch(`data/${name}.json`).then((r) => (r.ok ? r : new Response('{}', { status: 200 })));
  }
  return realFetch(url, opts);
};
