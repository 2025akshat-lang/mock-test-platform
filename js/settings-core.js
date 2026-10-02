// ============================================================
// ⚙️ SETTINGS CORE — storage + module registry + crash guard
// Depends on: NOTHING (app.js / notes-loader.js ko touch nahi karta)
// ============================================================
const SettingsCore = (() => {
  const PREFIX = 'settings:';
  const mods = {};
  // URL me ?safe=1 lagao to saari settings ignore ho jaati hain (emergency exit)
  const SAFE_MODE = /[?&]safe=1/.test(location.search);

  function get(key, fallback) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v === null ? fallback : v;
    } catch (e) { return fallback; }
  }

  function set(key, value) {
    try { localStorage.setItem(PREFIX + key, value); return true; }
    catch (e) { return false; }
  }

  function safe(fn, label) {
    try { return fn(); }
    catch (e) { console.error('[Settings:' + label + '] failed:', e); }
  }

  function register(name, mod) { mods[name] = mod; }

  // Crash guard:
  //  - boot=pending set hota hai, page 1.5s sahi chala to boot=ok
  //  - agar agli baar boot=pending mila (matlab pichli baar page crash hua)
  //    to saari settings default par reset ho jaati hain
  function boot() {
    if (SAFE_MODE) { console.warn('Settings: SAFE MODE ON (defaults in use)'); return; }

    if (get('boot', 'ok') === 'pending') {
      Object.keys(mods).forEach(n => safe(() => mods[n].reset && mods[n].reset(), n + '.reset'));
      set('boot', 'ok');
      set('notice', 'reset');
      return;
    }

    set('boot', 'pending');
    Object.keys(mods).forEach(n => safe(() => mods[n].apply && mods[n].apply(), n + '.apply'));
    window.addEventListener('load', () => setTimeout(() => set('boot', 'ok'), 1500));
  }

  return { get, set, safe, register, boot, mods, SAFE_MODE };
})();
