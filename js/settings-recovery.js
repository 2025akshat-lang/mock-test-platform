// ============================================================
// 🛠️ SETTINGS RECOVERY — Purge Broken History & Clear Cache
// Do level:
//   'cache' = cache + session saaf, fresh files, reload (settings/saved bache rahte hain)
//   'full'  = upar ka sab + settings, saved questions, email bhi hata do
// Button 2 jagah milta hai: Settings panel aur "Content Not Available" screen.
// Depends on: settings-core.js
// ============================================================
(() => {
  if (typeof SettingsCore === 'undefined') return;

  // Yeh files cache:'reload' se dobara fetch hoti hain, isse browser ki purani
  // copy naye version se badal jaati hai (upload ke baad bhi purana dikhe to yeh ilaaj hai).
  const REFRESH = [
    'index.html',
    'css/style.css', 'css/settings.css',
    'js/app.js', 'js/data-loader.js', 'js/notes-loader.js', 'js/daily-highlight.js',
    'js/icecream-loader.js', 'js/icecream-bg-animation.js',
    'js/settings-core.js', 'js/settings-theme.js', 'js/settings-language.js',
    'js/settings-offline.js', 'js/settings-svg.js', 'js/settings-recovery.js', 'js/settings-panel.js',
    'js/question-tools.js', 'js/question-report.js',
    'data/manifest.json', 'data/default-instructions.json',
    'data/notes/manifest.json',
    'data/daily-highlights/calendar.json', 'data/daily-highlights/quotes.json',
    'data/settings/lang/hi.json'
  ];
  const USER_PREFIXES = ['settings:', 'qtools:', 'mock:'];
  const USER_KEYS = ['user_email'];

  let running = false;

  function examLooksActive() {
    const ev = document.getElementById('exam-viewport');
    return !!(ev && getComputedStyle(ev).display !== 'none');
  }

  async function refreshFiles(onProgress) {
    let done = 0;
    for (let i = 0; i < REFRESH.length; i += 6) {
      await Promise.all(REFRESH.slice(i, i + 6).map(async url => {
        try { await fetch(url, { cache: 'reload' }); } catch (e) { /* missing file: ignore */ }
        done++;
        if (onProgress) onProgress(done, REFRESH.length);
      }));
    }
  }

  async function dropCaches() {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (e) { console.warn('[Recovery] caches:', e); }
    try {
      if ('serviceWorker' in navigator) {
        const scope = new URL('./', location.href).href;
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.filter(r => r.scope === scope).map(r => r.unregister()));
      }
    } catch (e) { console.warn('[Recovery] sw:', e); }
  }

  function dropUserData() {
    try {
      const remove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (USER_KEYS.indexOf(k) !== -1 || USER_PREFIXES.some(p => k.indexOf(p) === 0)) remove.push(k);
      }
      remove.forEach(k => localStorage.removeItem(k));
    } catch (e) { console.warn('[Recovery] storage:', e); }
  }

  // setStatus(text) optional: button/label update ke liye
  async function purge(level, setStatus) {
    if (running) return;
    const say = t => { try { if (setStatus) setStatus(t); } catch (e) { /* ignore */ } };

    let msg = level === 'full'
      ? 'This will delete saved settings, saved questions and your email on this phone, clear all cache, and reload the app. Continue?'
      : 'This will clear cache and session data and reload the app with fresh files. Your settings and saved questions are kept. Continue?';
    if (examLooksActive()) msg = 'A test seems to be open. Its progress and any attempts made in this session will be lost.\n\n' + msg;
    if (!window.confirm(msg)) return;

    running = true;
    try {
      say('Refreshing files…');
      await refreshFiles((d, t) => say('Refreshing files ' + d + '/' + t));
      say('Clearing cache…');
      try { sessionStorage.clear(); } catch (e) { /* blocked: ignore */ }
      await dropCaches();
      if (level === 'full') dropUserData();
      else { SettingsCore.set('boot', 'ok'); SettingsCore.set('notice', ''); }
      say('Reloading…');
    } catch (e) {
      console.error('[Recovery] purge error:', e);
    }
    // ?v= naya URL = HTML bhi fresh. ?safe= hata diya.
    location.replace(location.pathname + '?v=' + Date.now());
  }

  // ---------- "Content Not Available" screen me button ----------
  function mountErrorScreenButton() {
    try {
      const scr = document.getElementById('error-screen');
      if (!scr || scr.querySelector('[data-pz-purge]')) return;
      const inner = scr.firstElementChild || scr;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-secondary';
      b.setAttribute('data-pz-purge', '1');
      b.style.cssText = 'display:block;margin:12px auto 0;';
      b.textContent = '🔄 Purge Broken History & Clear Cache';
      b.addEventListener('click', () => purge('cache', t => { b.textContent = t; }));
      inner.appendChild(b);
    } catch (e) { console.warn('[Recovery] mount failed:', e); }
  }
  document.addEventListener('DOMContentLoaded', mountErrorScreenButton);

  SettingsCore.register('recovery', {
    purge,
    renderCard(root, H) {
      const card = H.card('🛠️ Recovery', 'rec.title');
      card.appendChild(H.text('If a test or note will not open, or an old version keeps showing after an update, use this.', 'st-note', 'rec.note'));

      const status = H.text('', 'st-status-line');
      const row = H.el('div', 'st-btn-row');
      const b1 = H.button('🔄 Purge Broken History & Clear Cache', 'rec.purge', () => purge('cache', t => { status.textContent = t; }), 'st-btn st-btn-primary');
      const b2 = H.button('⚠ Full reset (also deletes my settings & saved questions)', 'rec.full', () => purge('full', t => { status.textContent = t; }), 'st-btn st-btn-danger');
      row.appendChild(b1); row.appendChild(b2);
      card.appendChild(row);
      card.appendChild(status);
      root.appendChild(card);
    }
  });
})();
