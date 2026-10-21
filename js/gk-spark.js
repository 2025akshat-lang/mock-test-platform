/* GK Spark v1.1 - independent module (exam-oriented fact cards)
 * - Does NOT use calendar.json or daily-highlight.js
 * - Reads data/gk-spark/index.json, loads an entry file only when tapped
 * - Shows a small teaser card right below the home notification card
 *   (anchor = element just above #view-level-1; fallback = just above #view-level-1)
 * - Card hides itself when the home grid (#view-level-1) is hidden (level 2/3)
 * - Dated entries (MM-DD) come first for today; undated history points fill in randomly
 * All errors are swallowed: if this file fails, nothing else on the site is affected.
 */
(function () {
  'use strict';

  var CFG = {
    base: 'data/gk-spark/',
    retries: 12,
    retryMs: 500
  };

  var state = { list: [], i: 0, card: null, sheet: null, observer: null };

  function $(s) { try { return document.querySelector(s); } catch (e) { return null; } }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function safeFetch(path) {
    return fetch(CFG.base + path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' -> HTTP ' + r.status);
      return r.json();
    });
  }

  /* ---------- selection ---------- */
  function seedRand(seed) {
    var s = seed;
    return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  function buildList(entries) {
    var d = new Date();
    var mmdd = ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    var dated = entries.filter(function (e) { return e.date === mmdd; });
    var undated = entries.filter(function (e) { return !e.date; });
    // same shuffle all day, different tomorrow
    var rnd = seedRand(d.getFullYear() * 1000 + (d.getMonth() + 1) * 40 + d.getDate());
    for (var k = undated.length - 1; k > 0; k--) {
      var j = Math.floor(rnd() * (k + 1));
      var t = undated[k]; undated[k] = undated[j]; undated[j] = t;
    }
    return dated.concat(undated);
  }

  /* ---------- styles ---------- */
  function injectStyle() {
    if ($('#gk-style')) return;
    var css =
      '.gk-card{display:flex;align-items:center;gap:12px;margin:12px 16px;padding:12px 14px;background:#fff;border:1px solid #e5e9f2;border-radius:16px;cursor:pointer;-webkit-tap-highlight-color:transparent;box-sizing:border-box}' +
      '.gk-card:active{transform:scale(.98)}' +
      '.gk-ico{flex:0 0 44px;width:44px;height:44px}' +
      '.gk-ray{transform-origin:22px 22px;animation:gkPulse 2.2s ease-in-out infinite}' +
      '.gk-ray.r2{animation-delay:.4s}' +
      '@keyframes gkPulse{0%,100%{opacity:.25;transform:scale(.9)}50%{opacity:1;transform:scale(1.08)}}' +
      '.gk-tag{font-size:11px;font-weight:700;letter-spacing:.4px;color:#2563eb;text-transform:uppercase}' +
      '.gk-hook{font-size:15px;font-weight:600;color:#111827;line-height:1.35;margin-top:2px}' +
      '.gk-sub{font-size:12px;color:#6b7280;margin-top:3px}' +
      '.gk-ov{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:99998;opacity:0;transition:opacity .2s}' +
      '.gk-ov.on{opacity:1}' +
      '.gk-sheet{position:fixed;left:0;right:0;bottom:0;max-height:82vh;overflow:auto;-webkit-overflow-scrolling:touch;background:#fff;border-radius:20px 20px 0 0;padding:18px 16px 28px;z-index:99999;transform:translateY(100%);transition:transform .25s ease;box-sizing:border-box}' +
      '.gk-sheet.on{transform:translateY(0)}' +
      '.gk-h{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}' +
      '.gk-title{font-size:19px;font-weight:800;color:#111827;margin:4px 0 2px}' +
      '.gk-x{border:0;background:#f1f5f9;border-radius:50%;width:32px;height:32px;font-size:16px;cursor:pointer;flex-shrink:0}' +
      '.gk-sec{font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;margin:16px 0 6px}' +
      '.gk-row{display:flex;gap:8px;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:14px}' +
      '.gk-k{flex:0 0 38%;color:#64748b}.gk-v{flex:1;color:#111827;font-weight:600}' +
      '.gk-li{font-size:14px;color:#1f2937;margin:6px 0;padding-left:4px}' +
      '.gk-q{font-size:14px;font-weight:600;color:#111827;margin:10px 0 6px}' +
      '.gk-opt{display:block;width:100%;text-align:left;margin:4px 0;padding:9px 11px;border:1px solid #d7deea;border-radius:10px;background:#fff;font-size:14px;cursor:pointer}' +
      '.gk-opt.ok{background:#dcfce7;border-color:#22c55e}.gk-opt.no{background:#fee2e2;border-color:#ef4444}' +
      '.gk-next{margin-top:18px;width:100%;padding:11px;border:0;border-radius:12px;background:#2563eb;color:#fff;font-size:15px;font-weight:700;cursor:pointer}';
    var s = document.createElement('style');
    s.id = 'gk-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ---------- teaser card ---------- */
  function iconSvg() {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 44 44');
    svg.setAttribute('class', 'gk-ico');
    svg.innerHTML =
      "<circle cx='22' cy='22' r='20' fill='#eff6ff'/>" +
      "<path class='gk-ray' d='M22 5v5M22 34v5M5 22h5M34 22h5' stroke='#f59e0b' stroke-width='2.5' stroke-linecap='round' fill='none'/>" +
      "<path class='gk-ray r2' d='M10 10l3.5 3.5M30.5 30.5L34 34M34 10l-3.5 3.5M13.5 30.5L10 34' stroke='#f59e0b' stroke-width='2.5' stroke-linecap='round' fill='none'/>" +
      "<circle cx='22' cy='22' r='7' fill='#fbbf24'/>";
    return svg;
  }

  function renderCard() {
    var e = state.list[state.i];
    if (!e) return;
    if (!state.card) {
      state.card = el('div', 'gk-card');
      state.card.setAttribute('role', 'button');
      state.card.addEventListener('click', openSheet);
    }
    var c = state.card;
    c.textContent = '';
    c.appendChild(iconSvg());
    var box = el('div');
    box.appendChild(el('div', 'gk-tag', e.date ? 'Aaj ka GK Spark' : 'GK Spark'));
    box.appendChild(el('div', 'gk-hook', e.hook || e.title));
    box.appendChild(el('div', 'gk-sub', 'Tap karke exam points padho'));
    c.appendChild(box);
  }

  /* ---------- bottom sheet ---------- */
  function closeSheet() {
    if (!state.sheet) return;
    var s = state.sheet;
    s.ov.classList.remove('on'); s.box.classList.remove('on');
    setTimeout(function () {
      if (s.ov.parentNode) s.ov.parentNode.removeChild(s.ov);
      if (s.box.parentNode) s.box.parentNode.removeChild(s.box);
    }, 260);
    state.sheet = null;
  }

  function openSheet() {
    if (state.sheet) return;
    var ov = el('div', 'gk-ov'), box = el('div', 'gk-sheet');
    ov.addEventListener('click', closeSheet);
    document.body.appendChild(ov); document.body.appendChild(box);
    state.sheet = { ov: ov, box: box };
    requestAnimationFrame(function () { ov.classList.add('on'); box.classList.add('on'); });
    fillSheet();
  }

  function fillSheet() {
    var s = state.sheet; if (!s) return;
    var meta = state.list[state.i];
    s.box.textContent = '';
    s.box.appendChild(el('div', 'gk-sub', 'Loading...'));
    safeFetch('entries/' + meta.file).then(function (d) {
      if (state.sheet !== s) return;
      s.box.textContent = '';
      var h = el('div', 'gk-h');
      var left = el('div');
      left.appendChild(el('div', 'gk-tag', d.kind || (d.date ? 'Date based' : 'History point')));
      left.appendChild(el('div', 'gk-title', (d.icon ? d.icon + ' ' : '') + d.title));
      h.appendChild(left);
      var x = el('button', 'gk-x', '\u2715'); x.addEventListener('click', closeSheet);
      h.appendChild(x);
      s.box.appendChild(h);

      if (d.facts) {
        s.box.appendChild(el('div', 'gk-sec', 'Quick facts'));
        Object.keys(d.facts).forEach(function (k) {
          var r = el('div', 'gk-row');
          r.appendChild(el('div', 'gk-k', k)); r.appendChild(el('div', 'gk-v', String(d.facts[k])));
          s.box.appendChild(r);
        });
      }
      if (d.themes && Object.keys(d.themes).length) {
        s.box.appendChild(el('div', 'gk-sec', 'Year-wise theme'));
        Object.keys(d.themes).sort().reverse().forEach(function (y) {
          var r = el('div', 'gk-row');
          r.appendChild(el('div', 'gk-k', y)); r.appendChild(el('div', 'gk-v', d.themes[y]));
          s.box.appendChild(r);
        });
      }
      if (d.exam_points && d.exam_points.length) {
        s.box.appendChild(el('div', 'gk-sec', 'Exam points'));
        d.exam_points.forEach(function (p) { s.box.appendChild(el('div', 'gk-li', '\u2022 ' + p)); });
      }
      if (d.mcqs && d.mcqs.length) {
        s.box.appendChild(el('div', 'gk-sec', 'Quick practice'));
        d.mcqs.forEach(function (m) { s.box.appendChild(mcq(m)); });
      }
      var nx = el('button', 'gk-next', 'Ek aur GK Spark \u2192');
      nx.addEventListener('click', function () {
        state.i = (state.i + 1) % state.list.length;
        renderCard(); fillSheet(); s.box.scrollTop = 0;
      });
      s.box.appendChild(nx);
    }).catch(function (err) {
      if (state.sheet !== s) return;
      s.box.textContent = '';
      s.box.appendChild(el('div', 'gk-sub', 'Ye card load nahi hua: ' + err.message));
      var b = el('button', 'gk-next', 'Band karo'); b.addEventListener('click', closeSheet);
      s.box.appendChild(b);
    });
  }

  function mcq(m) {
    var w = el('div');
    w.appendChild(el('div', 'gk-q', m.q));
    var done = false;
    (m.options || []).forEach(function (o, idx) {
      var b = el('button', 'gk-opt', o);
      b.addEventListener('click', function () {
        if (done) return; done = true;
        var right = (idx === m.answer);
        b.classList.add(right ? 'ok' : 'no');
        if (!right && w.children[m.answer + 1]) w.children[m.answer + 1].classList.add('ok');
      });
      w.appendChild(b);
    });
    return w;
  }

  /* ---------- mounting (below notification card, above home grid) ---------- */
  function findAnchor() {
    var v1 = $('#view-level-1');
    if (!v1 || !v1.parentNode) return null;
    var p = v1.previousElementSibling;
    while (p && (p.id === 'nav-header-bar' || p === state.card)) {
      p = p.previousElementSibling;
    }
    return p; // notification card, or null if it has not rendered yet
  }

  function syncVisibility(v1) {
    if (!v1 || !window.MutationObserver || state.observer) return;
    var apply = function () {
      if (state.card) state.card.style.display = (v1.style.display === 'none') ? 'none' : '';
    };
    apply();
    state.observer = new MutationObserver(apply);
    state.observer.observe(v1, { attributes: true, attributeFilter: ['style'] });
  }

  function mount(tries) {
    if (!state.card || state.card.parentNode) return;
    var v1 = $('#view-level-1');
    var a = findAnchor();
    if (a && a.parentNode) {
      a.parentNode.insertBefore(state.card, a.nextSibling);
      syncVisibility(v1);
      return;
    }
    if (tries > 0) { setTimeout(function () { mount(tries - 1); }, CFG.retryMs); return; }
    // fallback: notification card not found, place right above the home grid
    if (v1 && v1.parentNode) {
      v1.parentNode.insertBefore(state.card, v1);
      syncVisibility(v1);
    }
  }

  /* ---------- boot ---------- */
  function boot() {
    try {
      injectStyle();
      safeFetch('index.json').then(function (idx) {
        var entries = (idx && idx.entries) || [];
        state.list = buildList(entries);
        if (!state.list.length) return;
        renderCard();
        mount(CFG.retries);
      }).catch(function () { /* silent: module just stays hidden */ });
    } catch (e) { /* never break the host page */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
