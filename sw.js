// ============================================================
// 🌐 sw.js — Math CDN cache ONLY (MathJax / KaTeX / DOMPurify)
// Repo ke ROOT me rakho (index.html ke saath).
//
// SAFETY: yeh sirf cdn.jsdelivr.net aur cdnjs.cloudflare.com ke GET
// requests ko chhuta hai. Tumhari apni files (index.html, app.js, JSON,
// CSS) ke liye yeh kuch nahi karta, browser unhe normal tarah load karta hai.
// ============================================================
const CACHE = 'pz-math-v1';
const HOSTS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (HOSTS.indexOf(url.hostname) === -1) return; // baaki sab ko haath nahi lagana
  e.respondWith(handle(req));
});

async function handle(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req.url);
  if (hit) return hit; // cache-first: weak network par turant

  try {
    // CORS mode me fetch: response check kar sakte hain, 404 kabhi cache nahi hoga
    const res = await fetch(new Request(req.url, { mode: 'cors', credentials: 'omit' }));
    if (res && res.ok) cache.put(req.url, res.clone());
    return res;
  } catch (err) {
    return Response.error();
  }
}
