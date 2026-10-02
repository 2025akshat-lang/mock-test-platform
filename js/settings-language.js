// ============================================================
// 🌐 SETTINGS LANGUAGE — sirf [data-i18n] wale elements translate karta hai
// English text HTML me hi rehta hai = fallback. JSON missing/kharab ho to
// English dikhta rahega, kuch crash nahi hoga.
// ============================================================
(() => {
  if (typeof SettingsCore === 'undefined') return;

  const LANGS = { en: 'English', hi: 'हिन्दी' };
  const cache = {};
  let dict = {};

  function current() {
    const v = SettingsCore.get('lang', 'en');
    return LANGS[v] ? v : 'en';
  }

  async function load(lang) {
    if (lang === 'en') return {};
    if (cache[lang]) return cache[lang];
    const res = await fetch('data/settings/lang/' + lang + '.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    cache[lang] = await res.json();
    return cache[lang];
  }

  function translate(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(el => {
      try {
        if (!el.hasAttribute('data-i18n-en')) el.setAttribute('data-i18n-en', el.textContent);
        el.textContent = dict[el.getAttribute('data-i18n')] || el.getAttribute('data-i18n-en');
      } catch (e) { /* ek element fail ho to baaki chalein */ }
    });
  }

  // true = laga, false = fail (English me hi rehta hai)
  async function set(lang) {
    if (!LANGS[lang]) return false;
    try {
      dict = await load(lang);
    } catch (e) {
      console.error('[Language] load failed:', e);
      dict = {};
      translate();
      return false;
    }
    document.documentElement.lang = lang;
    translate();
    SettingsCore.set('lang', lang);
    return true;
  }

  SettingsCore.register('language', {
    apply: () => { if (current() !== 'en') set(current()); },
    reset: () => { dict = {}; translate(); SettingsCore.set('lang', 'en'); },
    set, get: current, options: LANGS, translate
  });
})();
