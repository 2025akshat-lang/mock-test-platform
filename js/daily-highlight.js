/**
 * ============================================================
 * 🎉 DAILY HIGHLIGHT ENGINE
 * ------------------------------------------------------------
 * Fully isolated from app.js / data-loader.js / notes-loader.js.
 * Builds its OWN small panel in a corner of the home dashboard at
 * runtime — index.html only ever needs ONE line added: a
 * <script src="js/daily-highlight.js"></script> tag near the
 * other script tags at the bottom of <body>. Nothing else in
 * index.html or app.js needs to change.
 *
 * How it decides what to show, every time the page loads:
 *   1. Work out today's date as "MM-DD".
 *   2. Look that key up in data/daily-highlights/calendar.json —
 *      the value is an ARRAY of exact filenames living inside
 *      data/daily-highlights/entries/. Storing the real filename
 *      here (instead of assuming "id === filename") means you can
 *      rename an entry file any way you like — just update its
 *      one line in calendar.json, nothing in this JS ever changes.
 *   3. Fetch every listed file for today (in parallel) — each one
 *      carries its own inline SVG poster.
 *   4. Zero matches -> one match -> multiple matches, all three
 *      cases are handled: a single entry renders as one card; two
 *      or more render as a swipeable, auto-advancing carousel
 *      (left/right buttons + dots + auto-scroll every 5s); no
 *      entries at all -> a random positive thought from
 *      quotes.json instead of hiding the panel.
 *
 * Adding a new special day later is just:
 *   a) drop a new entries/<anything>.json file with its own SVG
 *   b) add "MM-DD": ["<anything>.json"] to calendar.json
 *      (or push a second filename into an existing day's array)
 * No JS changes needed for new dates or extra same-day events.
 * ============================================================
 */

const DailyHighlight = {
  calendar: null,

  init: async function () {
    this._buildContainer();
    try {
      const todayKey = this._todayKey();
      const res = await fetch('data/daily-highlights/calendar.json');
      if (!res.ok) throw new Error('calendar.json not found');
      this.calendar = await res.json();
      const files = this.calendar[todayKey] || [];

      if (files.length > 0) {
        const entries = (await Promise.all(files.map(f => this._fetchEntry(f)))).filter(Boolean);
        if (entries.length > 0) {
          this._renderEntries(entries);
          return;
        }
      }
    } catch (err) {
      console.error('DailyHighlight: falling back to a quote —', err);
    }
    this._renderFallbackQuote();
  },

  _todayKey: function () {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}-${dd}`;
  },

  // filename comes straight from calendar.json, e.g. "tourism.json"
  _fetchEntry: async function (filename) {
    try {
      const res = await fetch(`data/daily-highlights/entries/${filename}`);
      if (!res.ok) throw new Error('entry not found: ' + filename);
      return await res.json();
    } catch (err) {
      console.error('DailyHighlight: failed to load entry', filename, err);
      return null;
    }
  },

  // Injects a single empty panel div at the very top of the home
  // dashboard's scrollable body — the "corner" the user asked for.
  _buildContainer: function () {
    if (document.getElementById('daily-highlight-panel')) return;
    const body = document.querySelector('#home-dashboard .dashboard-body');
    if (!body) return;

    const panel = document.createElement('div');
    panel.id = 'daily-highlight-panel';
    panel.style.cssText = 'margin-bottom:16px;border-radius:16px;overflow:hidden;background:#fff;border:1px solid #e2e8f0;box-shadow:0 2px 4px rgba(0,0,0,0.03);';
    body.insertBefore(panel, body.firstChild);

    this._watchLevels();
  },

  _syncVisibility: function () {
    const panel = document.getElementById('daily-highlight-panel');
    const level1 = document.getElementById('view-level-1');
    if (!panel || !level1) return;
    panel.style.display = window.getComputedStyle(level1).display === 'none' ? 'none' : '';
  },

  _watchLevels: function () {
    const sync = () => this._syncVisibility();
    ['view-level-1', 'view-level-2', 'view-level-3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) new MutationObserver(sync).observe(el, { attributes: true, attributeFilter: ['style'] });
    });
    sync();
  },
  // One entry's inner markup (used both for the single-card case and
  // for each slide inside the carousel).
  _entryCardHtml: function (entry) {
    return `
      <div style="padding:14px 16px 0 16px;">
        <span style="font-size:0.68rem;font-weight:800;letter-spacing:0.5px;color:#2563eb;background:#eff6ff;padding:3px 9px;border-radius:20px;text-transform:uppercase;">${entry.type || 'Today'}</span>
      </div>
      <div style="padding:10px 16px 16px 16px;">
        <div style="width:100%;border-radius:12px;overflow:hidden;background:#f8fafc;margin-bottom:10px;">${entry.svg || ''}</div>
        <div style="font-weight:800;font-size:1.05rem;color:#0f172a;margin-bottom:2px;">${entry.title}</div>
        ${entry.subtitle ? `<div style="font-size:0.8rem;color:#64748b;margin-bottom:6px;">${entry.subtitle}</div>` : ''}
        ${entry.blurb ? `<div style="font-weight:800;font-size:1.05rem;color:#334155;line-height:1.5;background:#f8fafc;">${entry.blurb}</div>` : ''}
      </div>
    `;
  },

  _renderEntries: function (entries) {
    const panel = document.getElementById('daily-highlight-panel');
    if (!panel) return;

    // Only one event today — no carousel machinery needed at all.
    if (entries.length === 1) {
      panel.innerHTML = this._entryCardHtml(entries[0]);
      return;
    }

    // Two or more events today — swipeable + auto-advancing carousel.
    let cardsHtml = '';
    entries.forEach(entry => {
      cardsHtml += `<div style="flex:0 0 100%;scroll-snap-align:start;box-sizing:border-box;">${this._entryCardHtml(entry)}</div>`;
    });

    let dotsHtml = '';
    entries.forEach((_, i) => {
      dotsHtml += `<span class="dh-dot" data-i="${i}" style="width:6px;height:6px;border-radius:50%;background:${i === 0 ? '#2563eb' : '#cbd5e1'};display:inline-block;transition:background 0.2s;cursor:pointer;"></span>`;
    });

    panel.innerHTML = `
      <div id="dh-track" style="display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;">${cardsHtml}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0 14px 12px 14px;">
        <button id="dh-prev" style="background:#f1f5f9;border:none;width:28px;height:28px;border-radius:50%;font-weight:800;color:#334155;cursor:pointer;flex-shrink:0;">‹</button>
        <div id="dh-dots" style="display:flex;gap:5px;align-items:center;">${dotsHtml}</div>
        <button id="dh-next" style="background:#f1f5f9;border:none;width:28px;height:28px;border-radius:50%;font-weight:800;color:#334155;cursor:pointer;flex-shrink:0;">›</button>
      </div>
    `;

    this._setupCarousel(entries.length);
  },

  // Wires up: left/right buttons, clickable dots, auto-scroll every
  // 5s, and keeps the dots in sync if the person manually swipes.
  _setupCarousel: function (count) {
    const track = document.getElementById('dh-track');
    const prevBtn = document.getElementById('dh-prev');
    const nextBtn = document.getElementById('dh-next');
    const dots = document.querySelectorAll('.dh-dot');
    if (!track) return;

    let current = 0;
    let autoTimer = null;

    const paintDots = () => {
      dots.forEach((d, idx) => { d.style.background = idx === current ? '#2563eb' : '#cbd5e1'; });
    };

    const goTo = (i) => {
      current = ((i % count) + count) % count;
      track.scrollTo({ left: track.clientWidth * current, behavior: 'smooth' });
      paintDots();
    };

    const startAuto = () => {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => goTo(current + 1), 5000);
    };

    if (prevBtn) prevBtn.onclick = () => { goTo(current - 1); startAuto(); };
    if (nextBtn) nextBtn.onclick = () => { goTo(current + 1); startAuto(); };
    dots.forEach(d => {
      d.onclick = () => { goTo(parseInt(d.dataset.i, 10)); startAuto(); };
    });

    // If the person swipes the track by hand, keep `current`/dots in sync
    // instead of fighting them.
    let scrollDebounce;
    track.addEventListener('scroll', () => {
      clearTimeout(scrollDebounce);
      scrollDebounce = setTimeout(() => {
        current = Math.round(track.scrollLeft / track.clientWidth);
        paintDots();
      }, 100);
    });

    startAuto();
  },

  _renderFallbackQuote: async function () {
    const panel = document.getElementById('daily-highlight-panel');
    if (!panel) return;
    let quote = 'Keep going — every page you study today is a step closer.';
    try {
      const res = await fetch('data/daily-highlights/quotes.json');
      if (res.ok) {
        const quotes = await res.json();
        if (Array.isArray(quotes) && quotes.length) {
          quote = quotes[Math.floor(Math.random() * quotes.length)];
        }
      }
    } catch (err) {
      console.error('DailyHighlight: quotes.json failed', err);
    }
    panel.innerHTML = `
      <div style="padding:18px 16px;display:flex;align-items:center;gap:12px;">
        <div style="font-size:1.6rem;flex-shrink:0;">💡</div>
        <div style="font-size:0.9rem;color:#334155;line-height:1.5;font-style:italic;">${quote}</div>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => DailyHighlight.init());
