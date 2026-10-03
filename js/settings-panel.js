// ============================================================
// ⚙️ SETTINGS PANEL — UI render + ControlPanel me khud register
// app.js me koi change nahi: yeh file DOMContentLoaded par khud hook lagati hai.
// v2: koi bhi settings module apna card khud de sakta hai (renderCard),
//     panel unhe list se render karta hai. Naya setting = panel file ko bina chhue.
// ============================================================
const SettingsPanel = (() => {
  let pendingMsg = '';

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function tag(node, key) { if (key) node.setAttribute('data-i18n', key); return node; }

  function injectStyles() {
    if (document.getElementById('st-extra-styles')) return;
    const st = document.createElement('style');
    st.id = 'st-extra-styles';
    st.textContent = `
      .st-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .st-row-text{flex:1}
      .st-row-title{font-weight:700;font-size:.95rem;color:#1e293b}
      .st-switch{flex-shrink:0;width:48px;height:28px;border-radius:999px;border:none;background:#cbd5e1;position:relative;cursor:pointer;padding:0;transition:background .2s}
      .st-switch.on{background:#2563eb}
      .st-switch[disabled]{opacity:.6}
      .st-knob{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s;display:block}
      .st-switch.on .st-knob{transform:translateX(20px)}
      .st-btn-row{display:flex;flex-direction:column;gap:10px;margin-top:12px}
      .st-btn{padding:11px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-weight:700;font-size:.92rem;cursor:pointer}
      .st-btn-primary{background:#2563eb;border-color:#2563eb;color:#fff}
      .st-btn-danger{background:#fff;border-color:#fca5a5;color:#b91c1c}
      .st-btn[disabled]{opacity:.6}
      .st-status-line{margin-top:10px;font-size:.85rem;color:#475569;min-height:1.1em}
    `;
    document.head.appendChild(st);
  }

  // ---------- helpers jo modules ko diye jaate hain ----------
  function card(title, key) {
    const c = el('div', 'st-card');
    c.appendChild(tag(el('div', 'st-card-title', title), key));
    return c;
  }

  function text(txt, cls, key) { return tag(el('div', cls || 'st-note', txt), key); }

  function button(label, key, onClick, cls) {
    const b = el('button', cls || 'st-btn', label);
    b.type = 'button';
    tag(b, key);
    b.addEventListener('click', () => {
      try {
        const r = onClick(b);
        if (r && typeof r.catch === 'function') r.catch(e => console.error('[Settings] button failed:', e));
      } catch (e) { console.error('[Settings] button failed:', e); }
    });
    return b;
  }

  // opts: { label, labelKey, desc, descKey, on, onChange(newValue) -> maybe Promise }
  function toggle(parent, opts) {
    const row = el('div', 'st-row');
    const left = el('div', 'st-row-text');
    left.appendChild(tag(el('div', 'st-row-title', opts.label), opts.labelKey));
    if (opts.desc) left.appendChild(tag(el('div', 'st-note', opts.desc), opts.descKey));

    const sw = el('button', 'st-switch' + (opts.on ? ' on' : ''));
    sw.type = 'button';
    sw.setAttribute('role', 'switch');
    sw.setAttribute('aria-checked', String(!!opts.on));
    sw.appendChild(el('span', 'st-knob'));
    sw.addEventListener('click', async () => {
      sw.disabled = true;
      try { await opts.onChange(!opts.on); }
      catch (e) { console.error('[Settings] toggle failed:', e); }
      render();
    });

    row.appendChild(left);
    row.appendChild(sw);
    parent.appendChild(row);
  }

  function showMsg(msg) {
    pendingMsg = msg;
    const box = document.getElementById('st-msg');
    if (box) { box.textContent = msg; box.style.display = 'block'; }
  }

  const H = { el, card, text, button, toggle, showMsg, tag, rerender: () => render() };

  // ---------- built-in cards: theme + language ----------
  function renderThemeCard(root) {
    const theme = SettingsCore.mods.theme;
    if (!theme) return;
    const c = card('🎨 Mock Test Color', 'st.theme.title');

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
    c.appendChild(row);
    root.appendChild(c);
  }

  function renderLanguageCard(root) {
    const lang = SettingsCore.mods.language;
    if (!lang) return;
    const c = card('🌐 Platform Language', 'st.lang.title');

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
    c.appendChild(row);
    c.appendChild(text('Only the app menus and settings are translated. Test questions stay as written.', 'st-note', 'st.lang.note'));
    root.appendChild(c);
  }

  function renderResetCard(root) {
    const c = el('div', 'st-card');
    const btn = el('button', 'st-reset', '↩ Reset all settings');
    tag(btn, 'st.reset');
    btn.type = 'button';
    btn.addEventListener('click', () => {
      Object.keys(SettingsCore.mods).forEach(n =>
        SettingsCore.safe(() => SettingsCore.mods[n].reset && SettingsCore.mods[n].reset(), n + '.reset'));
      render();
    });
    c.appendChild(btn);
    root.appendChild(c);
  }

  function render() {
    const root = document.getElementById('st-root');
    if (!root) return;
    try {
      injectStyles();
      root.innerHTML = '';
      const msg = el('div', 'st-msg');
      msg.id = 'st-msg';
      msg.style.display = 'none';
      root.appendChild(msg);

      if (pendingMsg) { msg.textContent = pendingMsg; msg.style.display = 'block'; pendingMsg = ''; }
      else if (SettingsCore.SAFE_MODE) { msg.textContent = 'Safe mode is ON (?safe=1). Saved settings are being ignored.'; msg.style.display = 'block'; }
      else if (SettingsCore.get('notice', '') === 'reset') {
        msg.textContent = 'Settings were reset to default after a problem was detected.';
        msg.style.display = 'block';
        SettingsCore.set('notice', '');
      }

      // Har card alag try/catch me: ek card fail ho to baaki dikhte rahein
      SettingsCore.safe(() => renderThemeCard(root), 'card.theme');
      SettingsCore.safe(() => renderLanguageCard(root), 'card.language');
      Object.keys(SettingsCore.mods).forEach(n => {
        const m = SettingsCore.mods[n];
        if (m && typeof m.renderCard === 'function') {
          SettingsCore.safe(() => m.renderCard(root, H), 'card.' + n);
        }
      });
      SettingsCore.safe(() => renderResetCard(root), 'card.reset');

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
  // 1) Saved settings apply (crash guard ke saath)
  SettingsCore.safe(() => SettingsCore.boot(), 'boot');

  // 2) Panel ko switchboard me register karo (app.js untouched)
  SettingsCore.safe(() => {
    if (typeof ControlPanel !== 'undefined') {
      ControlPanel.registerPanel('settings-panel', { onShow: () => SettingsPanel.onShow() });
    }
  }, 'register-panel');
});
