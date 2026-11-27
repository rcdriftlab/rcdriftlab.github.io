// RC Drift Lab service worker: lets Android/desktop install it as an app and keeps it playable offline (solo).
// Page itself: network first, so updates always land. Car bodies, textures and the 3D engine: cached for speed.
const CACHE = 'rcdl-v126';
const CDN = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com)\//;
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'manifest.webmanifest', 'icon-192.png']).catch(() => {}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url), same = u.origin === self.location.origin;
  if (!same && !CDN.test(r.url)) return;
  if (same && /version\.json$/.test(u.pathname)) return;        // update check always goes to the network                       // Supabase, Venmo etc: never touched
  if (r.mode === 'navigate' || (same && /\/(index\.html)?$/.test(u.pathname))) {
    e.respondWith(fetch(r, { cache: 'no-store' }).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./', cp)); } return res; }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; });
    return hit || net;
  }));
});
