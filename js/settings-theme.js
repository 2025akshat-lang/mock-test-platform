// ============================================================
// 🎨 SETTINGS THEME — sirf <html data-theme="..."> attribute badalta hai
// 'white' = attribute hata do = bilkul purana design (zero risk)
// ============================================================
(() => {
  if (typeof SettingsCore === 'undefined') return;

  const THEMES = {
    white: { key: 'theme.white', label: 'White (Default)', swatch: '#ffffff' },
    gray:  { key: 'theme.gray',  label: 'Light Gray',      swatch: '#e5e7eb' },
    neon:  { key: 'theme.neon',  label: 'Light Neon',      swatch: '#b8ffe9' }
  };

  function current() {
    const v = SettingsCore.get('theme', 'white');
    return THEMES[v] ? v : 'white'; // galat value aaye to white
  }

  function apply(name) {
    const root = document.documentElement;
    if (!THEMES[name] || name === 'white') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', name);
  }

  function set(name) {
    if (!THEMES[name]) return false;
    apply(name);
    return SettingsCore.set('theme', name);
  }

  SettingsCore.register('theme', {
    apply: () => apply(current()),
    reset: () => { apply('white'); SettingsCore.set('theme', 'white'); },
    set, get: current, options: THEMES
  });
})();
