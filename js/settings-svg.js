// ============================================================
// 🖼️ SETTINGS SVG — "Auto-scale Diagrams"
// ON hone par diagrams screen ki width me fit hote hain.
// Sirf neeche likhe SCOPES ke andar ke <svg> ko chhuta hai
// (icons, ice-cream, header etc. safe rehte hain).
// ============================================================
(() => {
  if (typeof SettingsCore === 'undefined') return;

  // Diagram jahan dikh sakte hain. Daily Highlight ka container milne par yahan add karo.
  const SCOPES = [
    '#q-diagram',
    '#question-container',
    '#sol-question-text',
    '#sol-options-container',
    '#sol-explanation-text',
    '#notes-grid'
  ];

  const STYLE_ID = 'pz-svgscale-style';
  let bound = false, t1 = null, t2 = null;

  const isOn = () => SettingsCore.get('svgscale', 'off') === 'on';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const sel = SCOPES.map(s => 'html[data-svg-scale="on"] ' + s + ' svg').join(',');
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = sel + '{max-width:100% !important;height:auto !important;display:block;margin-left:auto;margin-right:auto;}';
    document.head.appendChild(st);
  }

  function removeStyle() {
    const st = document.getElementById(STYLE_ID);
    if (st) st.remove();
  }

  // viewBox na ho to width/height se bana do (warna SVG scale hi nahi ho sakta)
  function fixOne(svg) {
    if (svg.hasAttribute('data-pz-fixed')) return;
    svg.setAttribute('data-pz-fixed', '1');
    if (svg.hasAttribute('viewBox')) return;
    const num = /^\s*[\d.]+(px)?\s*$/;
    const ws = svg.getAttribute('width'), hs = svg.getAttribute('height');
    if (ws && hs && num.test(ws) && num.test(hs)) {
      const w = parseFloat(ws), h = parseFloat(hs);
      if (w > 0 && h > 0) svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    }
  }

  function scan() {
    if (!isOn()) return;
    try {
      SCOPES.forEach(s => {
        document.querySelectorAll(s + ' svg:not([data-pz-fixed])').forEach(fixOne);
      });
    } catch (e) { console.warn('[SVG] scan failed:', e); }
  }

  // Koi MutationObserver nahi (loop ka risk). Click ke baad 2 baar halka scan.
  function schedule() {
    if (!isOn()) return;
    clearTimeout(t1); clearTimeout(t2);
    t1 = setTimeout(scan, 350);
    t2 = setTimeout(scan, 1600); // lazy-loaded topic files ke liye
  }

  function apply() {
    if (isOn()) {
      document.documentElement.setAttribute('data-svg-scale', 'on');
      injectStyle();
      if (!bound) { document.addEventListener('click', schedule, true); bound = true; }
      scan();
    } else {
      document.documentElement.removeAttribute('data-svg-scale');
      removeStyle();
    }
  }

  function set(on) {
    SettingsCore.set('svgscale', on ? 'on' : 'off');
    apply();
  }

  SettingsCore.register('svgscale', {
    apply,
    reset: () => set(false),
    get: () => (isOn() ? 'on' : 'off'),
    set,

    renderCard(root, H) {
      const card = H.card('🖼️ Diagram Size', 'svg.title');
      H.toggle(card, {
        label: 'Auto-scale diagrams to my screen', labelKey: 'svg.toggle',
        desc: 'Fits diagrams and structures to the screen width so nothing is cut off or needs sideways scrolling.',
        descKey: 'svg.note',
        on: isOn(),
        onChange: v => set(v)
      });
      root.appendChild(card);
    }
  });
})();
