// ============================================================
// 🌐 SETTINGS OFFLINE — Low-Data Mode (math files ka local cache)
// Service Worker (sw.js) sirf math CDN files cache karta hai.
// Depends on: settings-core.js, root par sw.js
// ============================================================
(() => {
  if (typeof SettingsCore === 'undefined') return;

  const SW_URL = 'sw.js';
  const CACHE = 'pz-math-v1';

  const MJ = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/';
  const KT = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/';
  // Main files + common fonts. Baaki fonts pehli baar use hone par khud cache ho jaate hain.
  const WARM = [
    MJ + 'tex-mml-chtml.js',
    KT + 'katex.min.css',
    KT + 'katex.min.js',
    KT + 'contrib/auto-render.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.8/purify.min.js',
    KT + 'fonts/KaTeX_Main-Regular.woff2',
    KT + 'fonts/KaTeX_Math-Italic.woff2',
    KT + 'fonts/KaTeX_Size1-Regular.woff2',
    KT + 'fonts/KaTeX_AMS-Regular.woff2',
    MJ + 'output/chtml/fonts/woff-v2/MathJax_Main-Regular.woff',
    MJ + 'output/chtml/fonts/woff-v2/MathJax_Math-Italic.woff',
    MJ + 'output/chtml/fonts/woff-v2/MathJax_Size1-Regular.woff',
    MJ + 'output/chtml/fonts/woff-v2/MathJax_AMS-Regular.woff'
  ];

  const supported = () => ('serviceWorker' in navigator) && ('caches' in window);
  const isOn = () => SettingsCore.get('offline', 'off') === 'on';
  const ourScope = () => new URL('./', location.href).href;

  async function register() {
    if (!supported()) throw new Error('Service Worker not supported');
    await navigator.serviceWorker.register(SW_URL);
  }

  async function unregister() {
    if (!supported()) return;
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.filter(r => r.scope === ourScope()).map(r => r.unregister()));
  }

  async function clearCache() {
    if (!('caches' in window)) return;
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.indexOf('pz-') === 0).map(k => caches.delete(k)));
  }

  async function count() {
    try {
      if (!('caches' in window)) return 0;
      const c = await caches.open(CACHE);
      return (await c.keys()).length;
    } catch (e) { return 0; }
  }

  // Math files download karke cache me daalo. Returns { ok, fail }
  async function sync(onProgress) {
    const cache = await caches.open(CACHE);
    let ok = 0, fail = 0, done = 0;
    for (let i = 0; i < WARM.length; i += 4) {
      const batch = WARM.slice(i, i + 4);
      await Promise.all(batch.map(async url => {
        try {
          if (await cache.match(url)) { ok++; return; }
          const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          await cache.put(url, res);
          ok++;
        } catch (e) { fail++; console.warn('[Offline] skip:', url, e.message); }
        done++;
        if (onProgress) onProgress(done, WARM.length);
      }));
    }
    return { ok, fail };
  }

  async function enable(H) {
    SettingsCore.set('offline', 'on');
    try { await register(); }
    catch (e) {
      console.error('[Offline] register failed:', e);
      SettingsCore.set('offline', 'off');
      H.showMsg('Offline mode could not start. Check that sw.js is uploaded in the repo root (next to index.html).');
      return;
    }
    if (!navigator.onLine) { H.showMsg('You are offline. Connect to the internet once and press "Sync now".'); return; }
    try {
      const r = await sync();
      H.showMsg(r.fail ? ('Offline mode is ON. ' + r.ok + ' files saved, ' + r.fail + ' could not be downloaded (they will cache when first used).')
                       : 'Offline mode is ON. Math files are saved on this phone.');
    } catch (e) { H.showMsg('Offline mode is ON, but syncing failed. Try "Sync now" later.'); }
  }

  async function disable() {
    SettingsCore.set('offline', 'off');
    try { await unregister(); } catch (e) { console.warn(e); }
    try { await clearCache(); } catch (e) { console.warn(e); }
  }

  SettingsCore.register('offline', {
    // Boot par sirf SW register hota hai (koi download nahi)
    apply: () => { if (isOn() && supported()) register().catch(e => console.warn('[Offline] register failed:', e)); },
    reset: () => { disable(); },
    get: () => (isOn() ? 'on' : 'off'),
    sync, clearCache, unregister,

    renderCard(root, H) {
      const card = H.card('📡 Low-Data Mode (Offline Math)', 'off.title');
      const on = isOn();
      H.toggle(card, {
        label: 'Keep math formulas saved on this phone', labelKey: 'off.toggle',
        desc: 'Saves MathJax / KaTeX files locally so formulas load fast on a weak network. One-time download of about 1–2 MB.',
        descKey: 'off.note',
        on,
        onChange: v => (v ? enable(H) : disable())
      });

      if (!supported()) {
        card.appendChild(H.text('This browser does not support offline caching.', 'st-note'));
      } else if (on) {
        const status = H.text('Checking saved files…', 'st-status-line');
        card.appendChild(status);
        count().then(n => { status.textContent = n + ' file(s) saved for offline use.'; });

        const row = H.el('div', 'st-btn-row');
        const syncBtn = H.button('⬇ Sync now', 'off.sync', async () => {
          syncBtn.disabled = true;
          try {
            if (!navigator.onLine) throw new Error('offline');
            const r = await sync((d, t) => { syncBtn.textContent = 'Syncing ' + d + '/' + t; });
            H.showMsg(r.fail ? ('Synced. ' + r.fail + ' file(s) could not be downloaded.') : 'Sync complete.');
          } catch (e) { H.showMsg('Sync failed. Check your internet and try again.'); }
          H.rerender();
        });
        const clrBtn = H.button('🗑 Clear math cache', 'off.clear', async () => {
          await clearCache();
          H.showMsg('Math cache cleared. It will fill again as formulas are used.');
          H.rerender();
        });
        row.appendChild(syncBtn); row.appendChild(clrBtn);
        card.appendChild(row);
      }
      root.appendChild(card);
    }
  });
})();
