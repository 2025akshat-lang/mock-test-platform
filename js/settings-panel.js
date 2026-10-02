// ============================================================
// ⚙️ SETTINGS PANEL — UI render + ControlPanel me khud register
// app.js me koi change nahi: yeh file DOMContentLoaded par khud hook lagati hai
// ============================================================
const SettingsPanel = (() => {
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function tag(node, key) { node.setAttribute('data-i18n', key); return node; }

  function renderThemeCard(root) {
    const theme = SettingsCore.mods.theme;
    if (!theme) return;
    const card = el('div', 'st-card');
    card.appendChild(tag(el('div', 'st-card-title', '🎨 Mock Test Color'), 'st.theme.title'));

    const row = el('div', 'st-opt-row');
    Object.keys(theme.options).forEach(name => {
      const o = theme.options[name];
      const btn = el('button', 'st-opt' + (theme.get() === name ? ' active' : ''));
      btn.type = 'button';
      const dot = el('span', 'st-dot');
      dot.style.background = o.swatch;
      btn.appendChild(dot);
      btn.appendChild(tag(el('span', '', o.label), o.key));
      btn.addEventListener('click', () => {
        SettingsCore.safe(() => theme.set(name), 'theme.set');
        render();
      });
      row.appendChild(btn);
    });
    card.appendChild(row);
    root.appendChild(card);
  }

  function renderLanguageCard(root) {
    const lang = SettingsCore.mods.language;
    if (!lang) return;
    const card = el('div', 'st-card');
    card.appendChild(tag(el('div', 'st-card-title', '🌐 Platform Language'), 'st.lang.title'));

    const row = el('div', 'st-opt-row');
    Object.keys(lang.options).forEach(code => {
      const btn = el('button', 'st-opt' + (lang.get() === code ? ' active' : ''), lang.options[code]);
      btn.type = 'button';
      btn.addEventListener('click', async () => {
        const ok = await lang.set(code);
        render();
        if (!ok) showMsg('Language file could not be loaded. English is in use.');
      });
      row.appendChild(btn);
    });
    card.appendChild(row);
    card.appendChild(tag(el('div', 'st-note', 'Only the app menus and settings are translated. Test questions stay as written.'), 'st.lang.note'));
    root.appendChild(card);
  }

  function renderResetCard(root) {
    const card = el('div', 'st-card');
    const btn = el('button', 'st-reset', '↩ Reset all settings');
    tag(btn, 'st.reset');
    btn.type = 'button';
    btn.addEventListener('click', () => {
      Object.keys(SettingsCore.mods).forEach(n =>
        SettingsCore.safe(() => SettingsCore.mods[n].reset && SettingsCore.mods[n].reset(), n + '.reset'));
      render();
    });
    card.appendChild(btn);
    root.appendChild(card);
  }

  function showMsg(text) {
    const box = document.getElementById('st-msg');
    if (!box) return;
    box.textContent = text;
    box.style.display = 'block';
  }

  function render() {
    const root = document.getElementById('st-root');
    if (!root) return;
    try {
      root.innerHTML = '';
      const msg = el('div', 'st-msg');
      msg.id = 'st-msg';
      msg.style.display = 'none';
      root.appendChild(msg);

      if (SettingsCore.SAFE_MODE) showMsg('Safe mode is ON (?safe=1). Saved settings are being ignored.');
      else if (SettingsCore.get('notice', '') === 'reset') {
        showMsg('Settings were reset to default after a problem was detected.');
        SettingsCore.set('notice', '');
      }

      renderThemeCard(root);
      renderLanguageCard(root);
      renderResetCard(root);

      const lang = SettingsCore.mods.language;
      if (lang && lang.translate) lang.translate(root);
    } catch (e) {
      console.error('Settings render failed:', e);
      root.textContent = 'Settings are temporarily unavailable.';
    }
  }

  function onShow() { render(); }

  return { render, onShow };
})();

document.addEventListener('DOMContentLoaded', () => {
  // 1) Sidebar/bottom-nav ke labels translate + saved settings apply
  SettingsCore.safe(() => SettingsCore.boot(), 'boot');

  // 2) Panel ko switchboard me register karo (app.js untouched)
  SettingsCore.safe(() => {
    if (typeof ControlPanel !== 'undefined') {
      ControlPanel.registerPanel('settings-panel', { onShow: () => SettingsPanel.onShow() });
    }
  }, 'register-panel');
});
