// ============================================================
// 🔖 QUESTION TOOLS (core) — Save (bookmark) + Report buttons
// app.js ko touch nahi karta: buttons JS se inject hote hain aur
// question ka data DOM se padha jaata hai.
// Report ka box/send logic alag file me hai: js/question-report.js
// ============================================================
const QuestionTools = (() => {
  const SAVED_KEY = 'qtools:saved';
  let reportHandler = null;
  const buttons = []; // { save, ctx }

  // ---------- safe storage ----------
  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function persist(obj) {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(obj)); return true; }
    catch (e) { return false; }
  }

  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return 'q' + (h >>> 0).toString(36);
  }

  // ---------- read current question from DOM ----------
  function text(sel) {
    const n = document.querySelector(sel);
    return n ? n.innerText.replace(/\s+/g, ' ').trim() : '';
  }
  function list(sel) {
    return Array.from(document.querySelectorAll(sel))
      .map(n => n.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  function getContext(ctx) {
    if (ctx === 'solution') {
      const q = text('#sol-question-text');
      const m = q.match(/^Q(\d+)\.\s*/);
      return {
        where: 'Solution screen',
        number: m ? m[1] : '',
        section: text('#sol-time-meta'),
        question: q.replace(/^Q\d+\.\s*/, ''),
        options: list('#sol-options-container > div'),
        correct: text('#sol-correct-text'),
        explanation: text('#sol-explanation-text')
      };
    }
    const sec = document.querySelector('#section-tabs .tab-btn.active');
    return {
      where: 'Exam screen',
      number: text('#display-q-num'),
      section: sec ? sec.innerText.trim() : '',
      question: text('#question-container .q-text-content'),
      options: list('#options-container .option-card'),
      correct: '',
      explanation: ''
    };
  }

  function keyFor(ctx) {
    const q = getContext(ctx).question;
    return q ? hash(q) : '';
  }

  // ---------- UI helpers ----------
  function injectStyles() {
    if (document.getElementById('qt-styles')) return;
    const st = document.createElement('style');
    st.id = 'qt-styles';
    st.textContent = `
      .qt-group{display:flex;gap:8px;align-items:center}
      .qt-btn{width:36px;height:36px;border-radius:50%;border:1px solid #cbd5e1;background:#fff;color:#334155;
        font-size:1.05rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
      .qt-btn.saved{background:#fef3c7;border-color:#f59e0b;color:#b45309}
      .qt-dark .qt-btn{background:transparent;border-color:#64748b;color:#fff}
      .qt-dark .qt-btn.saved{background:#f59e0b;border-color:#f59e0b;color:#fff}
      .qt-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#0f172a;color:#fff;
        padding:10px 16px;border-radius:8px;font-size:.9rem;z-index:4000;max-width:90%;text-align:center}
    `;
    document.head.appendChild(st);
  }

  function toast(msg) {
    try {
      const t = document.createElement('div');
      t.className = 'qt-toast';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2200);
    } catch (e) { /* ignore */ }
  }

  function syncAll() {
    const saved = loadSaved();
    buttons.forEach(b => {
      const k = keyFor(b.ctx);
      const on = !!(k && saved[k]);
      b.save.classList.toggle('saved', on);
      b.save.textContent = on ? '★' : '☆';
      b.save.title = on ? 'Remove from saved' : 'Save question';
    });
  }

  function toggleSave(ctx) {
    const c = getContext(ctx);
    const k = c.question ? hash(c.question) : '';
    if (!k) { toast('Question not loaded yet'); return; }
    const saved = loadSaved();
    if (saved[k]) { delete saved[k]; toast('Removed from saved'); }
    else {
      saved[k] = { q: c.question.slice(0, 300), options: c.options, section: c.section, ts: Date.now() };
      toast('Question saved ★');
    }
    if (!persist(saved)) toast('Could not save (storage blocked)');
    syncAll();
  }

  function openReport(ctx) {
    if (typeof reportHandler === 'function') {
      try { reportHandler(getContext(ctx)); }
      catch (e) { console.error('[QuestionTools] report failed:', e); toast('Report box could not open'); }
    } else {
      toast('Report is unavailable right now');
    }
  }

  function makeGroup(ctx, dark) {
    const g = document.createElement('div');
    g.className = 'qt-group' + (dark ? ' qt-dark' : '');
    g.setAttribute('data-qt', ctx);

    const save = document.createElement('button');
    save.type = 'button'; save.className = 'qt-btn'; save.textContent = '☆'; save.title = 'Save question';
    save.addEventListener('click', e => { e.stopPropagation(); toggleSave(ctx); });

    const rep = document.createElement('button');
    rep.type = 'button'; rep.className = 'qt-btn'; rep.textContent = '⚠️'; rep.title = 'Report question';
    rep.addEventListener('click', e => { e.stopPropagation(); openReport(ctx); });

    g.appendChild(save); g.appendChild(rep);
    buttons.push({ save, ctx });
    return g;
  }

  // ---------- mount ----------
  function mount() {
    // 1) Exam screen: .meta-bar (Question N ... Marks)
    const meta = document.querySelector('#exam-viewport .meta-bar');
    if (meta && !meta.querySelector('[data-qt="exam"]')) {
      const first = meta.firstElementChild;
      const g = makeGroup('exam', false);
      if (first && first.nextSibling) meta.insertBefore(g, first.nextSibling);
      else meta.appendChild(g);
    }
    // 2) Solution screen: header (dark)
    const solHead = document.querySelector('#solution-detail-overlay .sol-detail-header');
    if (solHead && !solHead.querySelector('[data-qt="solution"]')) {
      solHead.appendChild(makeGroup('solution', true));
    }
    syncAll();
  }

  function watch() {
    // Sirf 2 chhote containers ki children badalne par icon sync (koi loop nahi)
    ['question-container', 'sol-question-text'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      new MutationObserver(() => syncAll()).observe(el, { childList: true });
    });
  }

  function init() {
    try {
      injectStyles();
      mount();
      watch();
    } catch (e) { console.error('[QuestionTools] init failed:', e); }
  }

  function setReportHandler(fn) { reportHandler = fn; }

  document.addEventListener('DOMContentLoaded', init);

  return { setReportHandler, toast, getContext };
})();
