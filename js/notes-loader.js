/**
 * ============================================================
 * 📝 PREPZONE NOTES ENGINE v4 (WORKING SEARCH + QUICK-JUMP NAV)
 * ------------------------------------------------------------
 * Completely isolated from app.js / data-loader.js (mock test engine).
 * Only touches: #notes-grid, #notes-filter-area, #note-search, and a
 * new #notes-quickjump bar it injects itself right after the search
 * box (index.html is NOT edited — this file builds that DOM at runtime).
 *
 * v4 changes (from v3):
 *  - FIXED: search box now actually works. Before, typing only
 *    re-filtered chapters that were already manually opened, so if
 *    nothing was open (the normal starting state) search did nothing.
 *    Now typing searches across the WHOLE subject: matching chapters
 *    (and matching sections/topics inside them) auto-expand, chapters/
 *    sections with zero matches are hidden. Clearing the box returns
 *    to the normal one-at-a-time accordion view.
 *  - NEW: a 4-step Quick-Jump bar (Subject -> Chapter -> Section ->
 *    Topic) below the search box. Picking a topic opens the exact
 *    chapter/section/topic (reusing the same open/close functions as
 *    manual clicking, so all exclusivity rules still apply) and
 *    scrolls it into view.
 *  - Chapter-level and nested-section-level accordions remain
 *    EXCLUSIVE (only one open at a time) for normal manual browsing,
 *    same as v3. Topic/notes level is still non-exclusive.
 * ============================================================
 */

// ============================================================
// 🛠️  MAINTENANCE MODE — ONE-LINE ON/OFF SWITCH
// ------------------------------------------------------------
// Working on the notes section (editing JSON, tweaking layout,
// adding a new chapter, etc.)? Flip this ON before you start —
// visitors see a clean "Under Maintenance" screen instead of a
// half-edited section. Flip it OFF the moment you're done.
//
// TO TURN ON  : comment out the "false" line below, uncomment "true"
// TO TURN OFF : comment out the "true" line below, uncomment "false" (default)
// ============================================================
// const NOTES_MAINTENANCE_MODE = true;
const NOTES_MAINTENANCE_MODE = true;

const NotesEngine = {
  manifestData: null,        // data/notes/manifest.json (exam categories -> subjects)
  subjectIndexData: null,    // currently selected subject's chapter list (light)
  chapterCache: {},          // chapterId -> full chapter JSON (fetched on first expand)
  chapterFilters: {},        // chapterId -> active tag ('all' by default)
  openChapters: new Set(),   // chapterIds currently expanded
  openTopics: new Set(),     // section/topic keys currently expanded (survives re-renders)
  activeChapterId: null,     // the ONE chapter currently expanded manually, or null
  activeSectionKey: null,    // the ONE nested section currently expanded manually, or null
  _searchTimeout: null,

  // ------------------------------------------------------------
  // 1. Boot: fetch only the root manifest (tiny file)
  // ------------------------------------------------------------
  init: async function () {
    if (NOTES_MAINTENANCE_MODE) {
      this._renderMaintenanceOverlay();
      return; // manifest.json is never even fetched — no console errors while you edit mid-flight data
    }
    try {
      const res = await fetch('data/notes/manifest.json');
      if (!res.ok) throw new Error('manifest.json not found');
      this.manifestData = await res.json();
      this.renderExamCategories();
      this._bindSearchInput();
      this._buildQuickJumpUI();
    } catch (err) {
      console.error('NotesEngine init failed:', err);
      const grid = document.getElementById('notes-grid');
      if (grid) grid.innerHTML = `<div style="padding:20px;color:#ef4444;">Notes could not be loaded. Please check data/notes/manifest.json exists.</div>`;
    }
  },

  // Premium "Under Maintenance" screen — replaces the search bar,
  // quick-jump bar, and notes grid with a centered animated badge.
  // Only touches elements inside the notes panel, exactly like
  // everything else in this file.
  _renderMaintenanceOverlay: function () {
    const searchInput = document.getElementById('note-search');
    const searchWrapper = searchInput ? (searchInput.closest('div') || searchInput.parentElement) : null;
    const filterArea = document.getElementById('notes-filter-area');
    const quickJump = document.getElementById('notes-quickjump');
    const grid = document.getElementById('notes-grid');

    if (searchWrapper) searchWrapper.style.display = 'none';
    if (filterArea) filterArea.style.display = 'none';
    if (quickJump) quickJump.style.display = 'none';
    if (!grid) return;

    // Animated construction-worker scene: waving hand (says hi) + a
    // shovel digging into a dirt mound with little dust puffs flying.
    // Pure inline SVG + CSS keyframes, no external image/font needed.
    grid.innerHTML = `
      <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 24px;min-height:55vh;">
        <svg width="230" height="200" viewBox="0 0 240 220" style="margin-bottom:6px;overflow:visible;">
          <ellipse cx="104" cy="197" rx="42" ry="6" fill="#e2e8f0"/>

          <!-- traffic cone -->
          <polygon points="22,192 33,148 44,192" fill="#f97316"/>
          <rect x="16" y="186" width="34" height="8" rx="2" fill="#ea580c"/>
          <rect x="24" y="165" width="18" height="6" fill="#ffffff"/>

          <!-- dirt mound -->
          <ellipse cx="188" cy="193" rx="32" ry="9" fill="#b98b52"/>
          <path d="M160 193 Q188 172 216 193 Z" fill="#a97c46"/>
          <ellipse cx="188" cy="194" rx="13" ry="4" fill="#7c5a34"/>

          <!-- dust puffs kicked up by the shovel -->
          <circle class="pz-d1" cx="184" cy="182" r="3" fill="#c8a165" opacity="0"/>
          <circle class="pz-d2" cx="192" cy="179" r="2.4" fill="#c8a165" opacity="0"/>
          <circle class="pz-d3" cx="178" cy="177" r="2" fill="#c8a165" opacity="0"/>

          <!-- legs + boots -->
          <rect x="86" y="148" width="14" height="42" rx="6" fill="#1e293b"/>
          <rect x="108" y="148" width="14" height="42" rx="6" fill="#1e293b"/>
          <ellipse cx="93" cy="192" rx="10" ry="6" fill="#0f172a"/>
          <ellipse cx="115" cy="192" rx="10" ry="6" fill="#0f172a"/>

          <!-- torso (hi-vis vest) -->
          <rect x="76" y="104" width="56" height="50" rx="16" fill="#2563eb"/>
          <rect x="76" y="126" width="56" height="9" fill="#fbbf24"/>

          <!-- right arm holding the shovel handle -->
          <rect x="118" y="110" width="14" height="32" rx="7" fill="#2563eb" transform="rotate(20 125 110)"/>
          <circle cx="142" cy="138" r="7" fill="#f2c9a0"/>

          <!-- shovel: swings like it's digging -->
          <g class="pz-dig" style="transform-origin:142px 138px;">
            <rect x="138" y="68" width="8" height="74" rx="4" fill="#92400e"/>
            <path d="M122 54 h34 l-7 20 h-20 z" fill="#94a3b8"/>
          </g>

          <!-- head -->
          <circle cx="104" cy="86" r="20" fill="#f2c9a0"/>
          <circle cx="97" cy="84" r="2.2" fill="#1e293b"/>
          <circle cx="111" cy="84" r="2.2" fill="#1e293b"/>
          <path d="M96 94 Q104 100 112 94" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round"/>

          <!-- hard hat -->
          <path d="M82 74 a22 18 0 0 1 44 0 z" fill="#f59e0b"/>
          <rect x="78" y="72" width="52" height="6" rx="3" fill="#d97706"/>

          <!-- left arm: waving hello -->
          <g class="pz-wave" style="transform-origin:76px 110px;">
            <path d="M76 110 Q60 95 52 76" stroke="#2563eb" stroke-width="13" stroke-linecap="round" fill="none"/>
            <circle cx="52" cy="76" r="8" fill="#f2c9a0"/>
          </g>
        </svg>
        <div style="font-size:1.35rem;font-weight:900;color:#0f172a;margin-bottom:8px;letter-spacing:0.3px;">Under Maintenance</div>
        <div style="font-size:0.9rem;color:#64748b;max-width:320px;line-height:1.55;">Our crew is digging into some improvements here — please visit again soon!</div>
      </div>
      <style>
        @keyframes pzWave { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(20deg); } }
        .pz-wave { animation: pzWave 1s ease-in-out infinite; }
        @keyframes pzDig { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(16deg); } }
        .pz-dig { animation: pzDig 1.6s ease-in-out infinite; }
        @keyframes pzDustA { 0% { opacity:0; transform:translate(0,0); } 35% { opacity:1; } 100% { opacity:0; transform:translate(8px,-18px); } }
        @keyframes pzDustB { 0% { opacity:0; transform:translate(0,0); } 35% { opacity:1; } 100% { opacity:0; transform:translate(-6px,-16px); } }
        @keyframes pzDustC { 0% { opacity:0; transform:translate(0,0); } 35% { opacity:1; } 100% { opacity:0; transform:translate(4px,-20px); } }
        .pz-d1 { animation: pzDustA 1.6s ease-out infinite; }
        .pz-d2 { animation: pzDustB 1.6s ease-out infinite 0.25s; }
        .pz-d3 { animation: pzDustC 1.6s ease-out infinite 0.5s; }
      </style>
    `;
  },

  // Bind ONE debounced input listener (fixes keystroke-lag)
  _bindSearchInput: function () {
    const input = document.getElementById('note-search');
    if (!input || input._notesEngineBound) return;
    input._notesEngineBound = true;
    input.addEventListener('input', () => {
      clearTimeout(this._searchTimeout);
      this._searchTimeout = setTimeout(() => this._handleSearchInput(), 200);
    });
  },

  _esc: function (str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  },

  // Safe wrapper: uses DOMPurify if it loaded, otherwise falls back to basic
  // HTML-escaping so a blocked/offline CDN never crashes rendering.
  _safe: function (html) {
    if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
      return DOMPurify.sanitize(html);
    }
    console.warn('DOMPurify not loaded — falling back to plain text escaping for this note.');
    return String(html == null ? '' : html)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  // ------------------------------------------------------------
  // Context-aware Back button: steps up exactly ONE level.
  //   section open?  -> collapse section, show its siblings
  //   chapter open?  -> collapse chapter, show its siblings
  //   neither?       -> go up to exam categories (old behavior)
  // ------------------------------------------------------------
  _handleBack: function () {
    if (this.activeSectionKey) {
      this._collapseActiveSection();
    } else if (this.activeChapterId) {
      this._closeChapter(this.activeChapterId);
    } else {
      this.renderExamCategories();
    }
  },

  // ------------------------------------------------------------
  // 2. Level 1: Exam categories -> Subjects
  // ------------------------------------------------------------
  renderExamCategories: function () {
    this.subjectIndexData = null;
    this.chapterCache = {};
    this.chapterFilters = {};
    this.openChapters = new Set();
    this.openTopics = new Set();
    this.activeChapterId = null;
    this.activeSectionKey = null;

    const grid = document.getElementById('notes-grid');
    if (!grid) return;

    let html = '';
    (this.manifestData.exam_categories || []).forEach(category => {
      html += `
        <div style="grid-column:1/-1;margin-top:15px;margin-bottom:5px;">
          <h3 style="margin:0;color:#0f172a;font-size:1.15rem;border-left:4px solid #2563eb;padding-left:8px;font-family:sans-serif;">${category.name}</h3>
        </div>
      `;
      (category.subjects || []).forEach(subject => {
        html += `
          <div onclick="NotesEngine.loadSubject('${this._esc(subject.index)}', '${this._esc(subject.name)}')" style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.05);cursor:pointer;-webkit-tap-highlight-color:transparent;">
            <div style="font-weight:700;color:#1e293b;font-size:1rem;margin-bottom:3px;">${subject.name}</div>
            <div style="font-size:0.8rem;color:#64748b;">📚 Tap to open repository</div>
          </div>
        `;
      });
    });
    grid.innerHTML = html;

    const filterArea = document.getElementById('notes-filter-area');
    if (filterArea) filterArea.style.display = 'none';

    const searchInput = document.getElementById('note-search');
    if (searchInput) searchInput.value = '';

    const qjSubject = document.getElementById('qj-subject');
    if (qjSubject) qjSubject.value = '';
    this._resetQuickJumpDownstream();
  },

  // ------------------------------------------------------------
  // 3. Level 2: Load a subject's LIGHT index (chapter list only)
  // ------------------------------------------------------------
  loadSubject: async function (indexPath, subjectName) {
    try {
      const res = await fetch(indexPath);
      if (!res.ok) throw new Error('subject index not found: ' + indexPath);
      this.subjectIndexData = await res.json();
      this.subjectIndexData._subjectName = subjectName;
      this.chapterCache = {};
      this.chapterFilters = {};
      this.openChapters = new Set();
      this.openTopics = new Set();
      this.activeChapterId = null;
      this.activeSectionKey = null;

      this._renderBackBar();
      this.renderChapterShells();

      const qjSubject = document.getElementById('qj-subject');
      if (qjSubject) qjSubject.value = indexPath;
      this._resetQuickJumpDownstream();
    } catch (err) {
      console.error('Failed to load subject:', err);
      alert('Notes data could not be loaded! Please check if JSON exists at: ' + indexPath);
    }
  },

  _renderBackBar: function () {
    const filterArea = document.getElementById('notes-filter-area');
    if (!filterArea) return;
    filterArea.style.display = 'flex';
    filterArea.innerHTML = '';

    // Reuses the existing .back-btn class from style.css (same light
    // gray back button already used in the mock-test nav-header-bar).
    const backBtn = document.createElement('button');
    backBtn.className = 'back-btn';
    backBtn.innerHTML = '⬅ Back';
    backBtn.onclick = () => this._handleBack();
    filterArea.appendChild(backBtn);
  },

  // ------------------------------------------------------------
  // 4. Render chapter accordion SHELLS only (no content yet = fast)
  // ------------------------------------------------------------
  renderChapterShells: function () {
    const grid = document.getElementById('notes-grid');
    if (!grid || !this.subjectIndexData) return;

    const fragment = document.createDocumentFragment();

    (this.subjectIndexData.chapters || []).forEach(ch => {
      const chapterDiv = document.createElement('div');
      chapterDiv.className = 'pz-chapter-wrap';
      chapterDiv.dataset.chapterId = ch.id;
      // Wrapper itself carries no visual styling now — it just stacks
      // the header card and the (initially hidden) body below it with
      // some breathing room. All the actual look-and-feel below reuses
      // the SAME classes as the home dashboard's menu cards
      // (.menu-card / .menu-card-left / .menu-icon / .menu-title /
      // .menu-desc / .menu-arrow, all already defined in style.css),
      // so chapter cards match the home screen exactly.
      chapterDiv.style.cssText = 'grid-column:1/-1;margin-bottom:16px;';
      chapterDiv.innerHTML = `
        <div class="menu-card" onclick="NotesEngine.toggleChapter('${this._esc(ch.id)}','${this._esc(ch.file)}')">
          <div class="menu-card-left">
            <div class="menu-icon">📂</div>
            <div>
              <div class="menu-title">${ch.title}</div>
              <div class="menu-desc">Tap to expand notes</div>
            </div>
          </div>
          <div class="menu-arrow" id="chicon-${ch.id}" style="transition:transform 0.2s cubic-bezier(0.4,0,0.2,1);transform:rotate(0deg);">❯</div>
        </div>
        <div id="chbody-${ch.id}" style="display:none;margin-top:8px;padding:14px 10px;background:#fff;border:1px solid var(--card-border);border-radius:12px;flex-direction:column;gap:10px;width:100%;box-sizing:border-box;box-shadow:0 1px 3px rgba(0,0,0,0.03);"></div>
      `;
      fragment.appendChild(chapterDiv);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
  },

  // Hides every chapter wrapper except the active one (null = show all)
  _showOnlyChapter: function (activeId) {
    document.querySelectorAll('.pz-chapter-wrap').forEach(el => {
      el.style.display = (activeId === null || el.dataset.chapterId === activeId) ? '' : 'none';
    });
  },

  // ------------------------------------------------------------
  // 5. Expand/collapse a chapter — EXCLUSIVE (only one open at a time),
  //    fetches its JSON ONLY ONCE
  // ------------------------------------------------------------
  toggleChapter: async function (chapterId, file) {
    const body = document.getElementById(`chbody-${chapterId}`);
    const icon = document.getElementById(`chicon-${chapterId}`);
    if (!body || !icon) return;

    if (this.openChapters.has(chapterId) && this.activeChapterId === chapterId) {
      this._closeChapter(chapterId);
      return;
    }

    // Safety net: collapse any other open chapter first (should be at most one)
    this.openChapters.forEach(id => {
      if (id === chapterId) return;
      const b = document.getElementById(`chbody-${id}`);
      const ic = document.getElementById(`chicon-${id}`);
      if (b) b.style.display = 'none';
      if (ic) ic.style.transform = 'rotate(0deg)';
    });

    this.openChapters = new Set([chapterId]);
    this.activeChapterId = chapterId;
    this.activeSectionKey = null;

    body.style.display = 'flex';
    icon.style.transform = 'rotate(90deg)';
    this._showOnlyChapter(chapterId); // hide sibling chapters

    if (!this.chapterCache[chapterId]) {
      body.innerHTML = `<div style="padding:10px;color:#64748b;font-size:0.85rem;">Loading…</div>`;
      try {
        const res = await fetch(file);
        if (!res.ok) throw new Error('chapter file not found: ' + file);
        this.chapterCache[chapterId] = await res.json();
      } catch (err) {
        console.error('Failed to load chapter:', err);
        body.innerHTML = `<div style="padding:10px;color:#ef4444;font-size:0.85rem;">Could not load this chapter's notes.</div>`;
        return;
      }
    }

    try {
      this.renderChapterBody(chapterId);
    } catch (err) {
      console.error('Failed to render chapter body (check history.json structure):', err);
      body.innerHTML = `<div style="padding:10px;color:#ef4444;font-size:0.85rem;">This chapter's data loaded, but something in its JSON structure is breaking the render. Open the browser console (F12) for the exact error.</div>`;
    }
  },

  // Collapses a chapter and shows all sibling chapters again.
  _closeChapter: function (chapterId) {
    const body = document.getElementById(`chbody-${chapterId}`);
    const icon = document.getElementById(`chicon-${chapterId}`);
    if (body) body.style.display = 'none';
    if (icon) icon.style.transform = 'rotate(0deg)';
    this.openChapters.delete(chapterId);
    this.activeChapterId = null;
    this.activeSectionKey = null;
    this._showOnlyChapter(null);
  },

  // ------------------------------------------------------------
  // 6. Render one chapter's body.
  //    Two supported schemas:
  //    (a) FLAT   — chapterData.topics directly (e.g. Polity, Geography)
  //    (b) NESTED — chapterData.sections (e.g. History → Ancient/Medieval/
  //        Modern). Sections are an EXCLUSIVE accordion during normal
  //        manual browsing — but during an active search, ALL matching
  //        sections/topics auto-expand at once so results are visible
  //        immediately (search overrides the one-at-a-time rule on
  //        purpose, since a query can legitimately match more than one
  //        section/chapter).
  //    Returns true if this chapter has at least one matching note for
  //    the current search query (used by the global search sweep to
  //    decide whether to show/hide the whole chapter).
  // ------------------------------------------------------------
  renderChapterBody: function (chapterId) {
    const chapterData = this.chapterCache[chapterId];
    const body = document.getElementById(`chbody-${chapterId}`);
    if (!body || !chapterData) return false;

    const searchInput = document.getElementById('note-search');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const isSearchActive = !!query;

    let html = '';
    let chapterHasMatch = false;

    if (chapterData.sections && chapterData.sections.length) {
      // NESTED: chapterId -> era/section accordions -> topics -> notes
      chapterData.sections.forEach(section => {
        const sectionKey = `${chapterId}__sec-${section.id}`;
        const result = this._renderFilterAndTopics(sectionKey, section.topics, section.filters, query);
        if (result.hasMatch) chapterHasMatch = true;

        const wrapHidden = isSearchActive && !result.hasMatch;
        const bodyOpen = isSearchActive && result.hasMatch;

        if (bodyOpen) this.openTopics.add(sectionKey);

        // Section headers keep the SAME toggle mechanics as before (🔽
        // rotating 0<->180deg) — only colors/padding/spacing are updated
        // to match the home screen's palette. The wrapper's own display
        // is set exactly once (no more duplicate display: declarations),
        // fixing a bug where a stray later "display:flex" could cancel
        // an earlier "display:none" in the same inline style string.
        html += `
          <div class="pz-section-wrap" data-chapter-id="${this._esc(chapterId)}" data-section-key="${this._esc(sectionKey)}" style="display:${wrapHidden ? 'none' : 'block'};border:1px solid var(--card-border);border-left:4px solid var(--primary);border-radius:10px;background:#fff;overflow:hidden;width:100%;box-sizing:border-box;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
            <div onclick="NotesEngine.toggleSection('${this._esc(sectionKey)}','${this._esc(chapterId)}')" style="background:#eff6ff;padding:14px 16px;font-weight:800;color:var(--primary-dark);font-size:0.95rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none;-webkit-tap-highlight-color:transparent;gap:10px;">
              <span style="display:flex;align-items:center;gap:10px;">
                <span style="width:34px;height:34px;border-radius:8px;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">🗂️</span>
                ${section.title}
              </span>
              <span id="tpicon-${sectionKey}" style="transition:transform 0.2s cubic-bezier(0.4,0,0.2,1);transform:${bodyOpen ? 'rotate(180deg)' : 'rotate(0deg)'};color:var(--primary);font-weight:800;">🔽</span>
            </div>
            <div id="tpbody-${sectionKey}" style="display:${bodyOpen ? 'flex' : 'none'};padding:14px 10px;border-top:1px solid var(--card-border);flex-direction:column;gap:10px;width:100%;box-sizing:border-box;">
              ${result.html}
            </div>
          </div>
        `;
      });
    } else {
      // FLAT: chapterId -> topics -> notes directly (unchanged old behavior)
      const result = this._renderFilterAndTopics(chapterId, chapterData.topics, chapterData.filters, query);
      html += result.html;
      chapterHasMatch = result.hasMatch;
    }

    body.innerHTML = html;

    if (!isSearchActive) {
      // Only needed outside search mode: restore manual expand/collapse state
      this._restoreOpenTopics();
    }

   if (window.typesetMath) {
  window.typesetMath(body);
}

    return chapterHasMatch;
  },

  // Re-opens any section/topic accordion whose key is still in
  // openTopics, after their DOM nodes were just recreated — and
  // re-applies exclusive section visibility if one is active.
  _restoreOpenTopics: function () {
    this.openTopics.forEach(key => {
      const tbody = document.getElementById(`tpbody-${key}`);
      const icon = document.getElementById(`tpicon-${key}`);
      if (tbody && icon) {
        tbody.style.display = 'flex';
        icon.style.transform = 'rotate(180deg)';
      }
    });
    if (this.activeSectionKey && this.activeChapterId) {
      this._showOnlySection(this.activeChapterId, this.activeSectionKey);
    }
  },

  // ------------------------------------------------------------
  // Nested section accordion (Ancient/Medieval/Modern etc.) — EXCLUSIVE
  // during normal manual browsing.
  // ------------------------------------------------------------
  toggleSection: function (sectionKey, chapterId) {
    const body = document.getElementById(`tpbody-${sectionKey}`);
    const icon = document.getElementById(`tpicon-${sectionKey}`);
    if (!body || !icon) return;

    const isOpen = body.style.display === 'flex';

    if (isOpen && this.activeSectionKey === sectionKey) {
      this._collapseActiveSection();
      return;
    }

    // Exclusivity: collapse any other open section within this same chapter
    document.querySelectorAll(`.pz-section-wrap[data-chapter-id="${chapterId}"]`).forEach(wrap => {
      const key = wrap.dataset.sectionKey;
      if (key === sectionKey) return;
      const b = document.getElementById(`tpbody-${key}`);
      const ic = document.getElementById(`tpicon-${key}`);
      if (b) b.style.display = 'none';
      if (ic) ic.style.transform = 'rotate(0deg)';
      this.openTopics.delete(key);
    });

    body.style.display = 'flex';
    icon.style.transform = 'rotate(180deg)';
    this.openTopics.add(sectionKey);
    this.activeChapterId = chapterId;
    this.activeSectionKey = sectionKey;
    this._showOnlySection(chapterId, sectionKey);
  },

  // Collapses whichever section is currently active and shows its siblings again.
  _collapseActiveSection: function () {
    const key = this.activeSectionKey;
    if (!key) return;
    const chapterId = this.activeChapterId;
    const body = document.getElementById(`tpbody-${key}`);
    const icon = document.getElementById(`tpicon-${key}`);
    if (body) body.style.display = 'none';
    if (icon) icon.style.transform = 'rotate(0deg)';
    this.openTopics.delete(key);
    this.activeSectionKey = null;
    this._showOnlySection(chapterId, null);
  },

  // Hides every section wrapper (within one chapter) except the active one (null = show all)
  _showOnlySection: function (chapterId, activeKey) {
    document.querySelectorAll(`.pz-section-wrap[data-chapter-id="${chapterId}"]`).forEach(el => {
      el.style.display = (activeKey === null || el.dataset.sectionKey === activeKey) ? '' : 'none';
    });
  },

  // Renders: [optional tag-filter row] + [topic accordions -> notes].
  // filterKey is either a chapterId (flat case) or "chapterId__sec-xyz"
  // (nested case) — setChapterFilter() below parses it back apart.
  // Returns { html, hasMatch } — hasMatch = at least one topic had a
  // note matching the current search query (or query is empty, in
  // which case everything "matches").
  _renderFilterAndTopics: function (filterKey, topics, filtersDef, query) {
    const activeTag = this.chapterFilters[filterKey] || 'all';
    const autoExpand = !!query; // search mode: auto-open matching topics so results are visible immediately
    let html = '';

    if (filtersDef && filtersDef.length) {
      html += `<div style="display:flex;gap:8px;flex-wrap:wrap;">`;
      const allActive = activeTag === 'all';
      html += `<button onclick="NotesEngine.setChapterFilter('${this._esc(filterKey)}','all')" style="padding:6px 10px;border-radius:6px;font-weight:600;cursor:pointer;font-size:0.78rem;border:1px solid #cbd5e1;background:${allActive ? '#2563eb' : '#fff'};color:${allActive ? '#fff' : '#334155'};">All</button>`;
      filtersDef.forEach(f => {
        const isActive = activeTag === f.tag;
        html += `<button onclick="NotesEngine.setChapterFilter('${this._esc(filterKey)}','${this._esc(f.tag)}')" style="padding:6px 10px;border-radius:6px;font-weight:600;cursor:pointer;font-size:0.78rem;border:1px solid #cbd5e1;background:${isActive ? '#2563eb' : '#fff'};color:${isActive ? '#fff' : '#334155'};">${f.label}</button>`;
      });
      html += `</div>`;
    }

    let anyTopicVisible = false;

    (topics || []).forEach(topic => {
      const filteredNotes = (topic.notes_list || []).filter(note => {
        const matchesSearch = !query || note.title.toLowerCase().includes(query) || note.basic_overview.toLowerCase().includes(query);
        const matchesTag = activeTag === 'all' || (note.tags || []).includes(activeTag);
        return matchesSearch && matchesTag;
      });
      if (filteredNotes.length === 0) return;
      anyTopicVisible = true;

      const topicKey = `${filterKey}__${topic.topic_id}`;
      const topicBodyDisplay = autoExpand ? 'flex' : 'none';
      const topicIconRotate = autoExpand ? 'rotate(180deg)' : 'rotate(0deg)';
      if (autoExpand) this.openTopics.add(topicKey);

      html += `
        <div style="border:1px solid #cbd5e1;border-radius:6px;background:#fff;overflow:hidden;display:flex;flex-direction:column;width:100%;box-sizing:border-box;">
          <div onclick="NotesEngine.toggleTopic('${this._esc(topicKey)}')" style="background:#f1f5f9;padding:10px 12px;font-weight:700;color:#334155;font-size:0.95rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none;-webkit-tap-highlight-color:transparent;">
            <span>📄 ${topic.topic_title}</span>
            <span id="tpicon-${topicKey}" style="transition:transform 0.2s cubic-bezier(0.4,0,0.2,1);transform:${topicIconRotate};">🔽</span>
          </div>
          <div id="tpbody-${topicKey}" style="display:${topicBodyDisplay};padding:12px 4px;border-top:1px solid #cbd5e1;flex-direction:column;gap:12px;width:100%;box-sizing:border-box;">
      `;

      filteredNotes.forEach(note => {
        const btnColor = note.extra_info_btn_color || '#2563eb';
        const noteKey = `${topicKey}__${note.id}`;
        html += `
          <div style="border-bottom:1px dashed #e2e8f0;padding-bottom:10px;margin-bottom:5px;width:100%;box-sizing:border-box;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:6px;">
              <h4 style="margin:0;color:#0f172a;font-size:0.95rem;font-weight:700;line-height:1.4;">${this._safe(note.title)}</h4>
              ${note.has_extra_info ? `
                    <button onclick="NotesEngine.toggleExtraInfo(event, '${this._esc(noteKey)}')" style="background:${btnColor};color:#fff;border:none;width:24px;height:32px;border-radius:6px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.75rem;letter-spacing:-1px;writing-mode:vertical-lr;-webkit-tap-highlight-color:transparent;box-shadow:0 2px 4px rgba(0,0,0,0.25);flex-shrink:0;" title="Tap for more detail">|||</button>
              ` : ''}
            </div>
            <p style="margin:0;color:#334155;font-size:0.9rem;line-height:1.5;white-space:pre-wrap;">${this._safe(note.basic_overview)}</p>
            ${note.has_extra_info ? `
              <div id="extra-${noteKey}" style="display:none;margin-top:8px;padding:10px 12px;background:#fff8e1;border-left:4px solid ${btnColor};border-radius:4px;font-size:0.85rem;color:#b78103;white-space:pre-wrap;font-weight:600;line-height:1.4;">${this._safe(note.extra_info_content)}</div>
            ` : ''}
          </div>
        `;
      });

      html += `</div></div>`;
    });

    if (!anyTopicVisible) {
      html += `<div style="padding:8px 2px;color:#64748b;font-size:0.85rem;">No notes match this search/filter here.</div>`;
    }

    return { html, hasMatch: anyTopicVisible };
  },

  // filterKey is either "chapterId" (flat) or "chapterId__sec-xyz" (nested) —
  // always re-render the top-level chapter body so the whole tree stays in sync.
  setChapterFilter: function (filterKey, tag) {
    this.chapterFilters[filterKey] = tag;
    const chapterId = filterKey.split('__sec-')[0];
    this.renderChapterBody(chapterId);
  },

  toggleTopic: function (topicKey) {
    const body = document.getElementById(`tpbody-${topicKey}`);
    const icon = document.getElementById(`tpicon-${topicKey}`);
    if (!body || !icon) return;
    if (body.style.display === 'none' || body.style.display === '') {
      body.style.display = 'flex';
      icon.style.transform = 'rotate(180deg)';
      this.openTopics.add(topicKey);
    } else {
      body.style.display = 'none';
      icon.style.transform = 'rotate(0deg)';
      this.openTopics.delete(topicKey);
    }
  },

  toggleExtraInfo: function (event, noteKey) {
    event.stopPropagation();
    const extraBox = document.getElementById(`extra-${noteKey}`);
    if (extraBox) {
      extraBox.style.display = extraBox.style.display === 'none' ? 'block' : 'none';
    }
  },

  // ============================================================
  // 7. SEARCH — now actually searches the whole subject
  // ============================================================
  _handleSearchInput: async function () {
    if (!this.subjectIndexData) return; // no repository open yet, nothing to search

    const input = document.getElementById('note-search');
    const query = input ? input.value.trim().toLowerCase() : '';

    if (!query) {
      this._exitSearchMode();
      return;
    }

    await this._runGlobalSearch();
  },

  // Leaving the search box empty returns to the normal exclusive
  // one-chapter-at-a-time browsing view.
  _exitSearchMode: function () {
    this.openChapters = new Set();
    this.openTopics = new Set();
    this.activeChapterId = null;
    this.activeSectionKey = null;
    this.renderChapterShells();
  },

  // Fetches every not-yet-cached chapter in the current subject, then
  // renders each one; chapters with zero matching notes are hidden,
  // chapters with at least one match are shown fully expanded.
  _runGlobalSearch: async function () {
    const chapters = this.subjectIndexData.chapters || [];
    this.activeChapterId = null;
    this.activeSectionKey = null;

    await Promise.all(chapters.map(async ch => {
      if (this.chapterCache[ch.id]) return;
      try {
        const res = await fetch(ch.file);
        if (!res.ok) throw new Error('chapter file not found: ' + ch.file);
        this.chapterCache[ch.id] = await res.json();
      } catch (err) {
        console.error('Search: failed to load chapter', ch.id, err);
      }
    }));

    this.openChapters = new Set();

    chapters.forEach(ch => {
      const wrap = document.querySelector(`.pz-chapter-wrap[data-chapter-id="${ch.id}"]`);
      const body = document.getElementById(`chbody-${ch.id}`);
      const icon = document.getElementById(`chicon-${ch.id}`);

      if (!this.chapterCache[ch.id]) {
        if (wrap) wrap.style.display = 'none';
        return;
      }

      const hasMatch = this.renderChapterBody(ch.id);

      if (!hasMatch) {
        if (wrap) wrap.style.display = 'none';
        if (body) body.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
        return;
      }

      if (wrap) wrap.style.display = '';
      if (body) body.style.display = 'flex';
      if (icon) icon.style.transform = 'rotate(180deg)';
      this.openChapters.add(ch.id);
    });
  },

  // ============================================================
  // 8. QUICK-JUMP — cascading dropdown navigator: Subject -> Chapter
  //    -> Section (if the chapter has one) -> Topic. Picking a topic
  //    opens straight to it, reusing the same toggle functions used
  //    by manual clicking (so exclusivity + back button stay correct).
  //    Injected via JS right after the search box — index.html is
  //    never edited.
  // ============================================================
  _buildQuickJumpUI: function () {
    if (document.getElementById('notes-quickjump')) return; // already built once

    const searchInput = document.getElementById('note-search');
    if (!searchInput) return;
    const searchWrapper = searchInput.closest('div') || searchInput.parentElement;
    if (!searchWrapper || !searchWrapper.parentElement) return;

    const selStyle = 'padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.82rem;background:#fff;color:#334155;flex:1 1 140px;min-width:120px;';

    const qj = document.createElement('div');
    qj.id = 'notes-quickjump';
    qj.style.cssText = 'margin-bottom:15px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;background:#f8fafc;padding:10px;border-radius:8px;border:1px dashed #cbd5e1;';
    qj.innerHTML = `
      <select id="qj-subject" style="${selStyle}">
        <option value="">📚 Jump to subject...</option>
      </select>
      <select id="qj-chapter" style="${selStyle}" disabled>
        <option value="">Chapter...</option>
      </select>
      <select id="qj-section" style="${selStyle}display:none;" disabled>
        <option value="">Section...</option>
      </select>
      <select id="qj-topic" style="${selStyle}" disabled>
        <option value="">Topic (what to study)...</option>
      </select>
    `;

    searchWrapper.parentElement.insertBefore(qj, searchWrapper.nextSibling);

    const subjectSelect = qj.querySelector('#qj-subject');
    (this.manifestData.exam_categories || []).forEach(category => {
      (category.subjects || []).forEach(subject => {
        const opt = document.createElement('option');
        opt.value = subject.index;
        opt.textContent = `${category.name} → ${subject.name}`;
        subjectSelect.appendChild(opt);
      });
    });

    subjectSelect.addEventListener('change', () => this._onQuickJumpSubjectChange());
    qj.querySelector('#qj-chapter').addEventListener('change', () => this._onQuickJumpChapterChange());
    qj.querySelector('#qj-section').addEventListener('change', () => this._onQuickJumpSectionChange());
    qj.querySelector('#qj-topic').addEventListener('change', () => this._onQuickJumpTopicChange());
  },

  _resetQuickJumpDownstream: function () {
    const chapterSelect = document.getElementById('qj-chapter');
    const sectionSelect = document.getElementById('qj-section');
    const topicSelect = document.getElementById('qj-topic');
    if (chapterSelect) { chapterSelect.innerHTML = '<option value="">Chapter...</option>'; chapterSelect.disabled = true; }
    if (sectionSelect) { sectionSelect.innerHTML = '<option value="">Section...</option>'; sectionSelect.style.display = 'none'; sectionSelect.disabled = true; }
    if (topicSelect) { topicSelect.innerHTML = '<option value="">Topic (what to study)...</option>'; topicSelect.disabled = true; }
  },

  _onQuickJumpSubjectChange: async function () {
    const subjectSelect = document.getElementById('qj-subject');
    const chapterSelect = document.getElementById('qj-chapter');
    const indexPath = subjectSelect.value;

    this._resetQuickJumpDownstream();
    if (!indexPath) return;

    const subjectName = subjectSelect.options[subjectSelect.selectedIndex].textContent;
    await this.loadSubject(indexPath, subjectName);

    (this.subjectIndexData.chapters || []).forEach(ch => {
      const opt = document.createElement('option');
      opt.value = ch.id;
      opt.dataset.file = ch.file;
      opt.textContent = ch.title;
      chapterSelect.appendChild(opt);
    });
    chapterSelect.disabled = false;
  },

  _onQuickJumpChapterChange: async function () {
    const chapterSelect = document.getElementById('qj-chapter');
    const sectionSelect = document.getElementById('qj-section');
    const topicSelect = document.getElementById('qj-topic');
    const chapterId = chapterSelect.value;

    sectionSelect.innerHTML = '<option value="">Section...</option>';
    sectionSelect.style.display = 'none';
    sectionSelect.disabled = true;
    topicSelect.innerHTML = '<option value="">Topic (what to study)...</option>';
    topicSelect.disabled = true;

    if (!chapterId) return;

    const file = chapterSelect.options[chapterSelect.selectedIndex].dataset.file;

    if (!this.chapterCache[chapterId]) {
      try {
        const res = await fetch(file);
        if (!res.ok) throw new Error('chapter file not found: ' + file);
        this.chapterCache[chapterId] = await res.json();
      } catch (err) {
        console.error('Quick jump: failed to load chapter', chapterId, err);
        return;
      }
    }

    const chapterData = this.chapterCache[chapterId];

    if (chapterData.sections && chapterData.sections.length) {
      chapterData.sections.forEach(section => {
        const opt = document.createElement('option');
        opt.value = section.id;
        opt.textContent = section.title;
        sectionSelect.appendChild(opt);
      });
      sectionSelect.style.display = '';
      sectionSelect.disabled = false;
    } else {
      (chapterData.topics || []).forEach(topic => {
        const opt = document.createElement('option');
        opt.value = topic.topic_id;
        opt.textContent = topic.topic_title;
        topicSelect.appendChild(opt);
      });
      topicSelect.disabled = false;
    }
  },

  _onQuickJumpSectionChange: function () {
    const chapterSelect = document.getElementById('qj-chapter');
    const sectionSelect = document.getElementById('qj-section');
    const topicSelect = document.getElementById('qj-topic');
    const chapterId = chapterSelect.value;
    const sectionId = sectionSelect.value;

    topicSelect.innerHTML = '<option value="">Topic (what to study)...</option>';
    topicSelect.disabled = true;

    if (!chapterId || !sectionId) return;

    const chapterData = this.chapterCache[chapterId];
    if (!chapterData) return;
    const section = (chapterData.sections || []).find(s => String(s.id) === String(sectionId));
    if (!section) return;

    (section.topics || []).forEach(topic => {
      const opt = document.createElement('option');
      opt.value = topic.topic_id;
      opt.textContent = topic.topic_title;
      topicSelect.appendChild(opt);
    });
    topicSelect.disabled = false;
  },
_onQuickJumpTopicChange: async function () {
    const chapterSelect = document.getElementById('qj-chapter');
    const sectionSelect = document.getElementById('qj-section');
    const topicSelect = document.getElementById('qj-topic');

    const chapterId = chapterSelect.value;
    const sectionId = sectionSelect.value;
    const topicId = topicSelect.value;
    if (!chapterId || !topicId) return;

    const file = chapterSelect.options[chapterSelect.selectedIndex].dataset.file;

    const searchInput = document.getElementById('note-search');
    const wasSearching = !!(searchInput && searchInput.value);
    if (wasSearching) searchInput.value = '';

    if (this.activeChapterId !== chapterId) {
      await this.toggleChapter(chapterId, file);
    } else if (wasSearching) {
      this.renderChapterBody(chapterId);
      const body = document.getElementById(`chbody-${chapterId}`);
      if (body) body.dataset.rendered = 'true';
    }

    let topicKey;
    if (sectionId) {
      const sectionKey = `${chapterId}__sec-${sectionId}`;
      if (this.activeSectionKey !== sectionKey) {
        this.toggleSection(sectionKey, chapterId);
      }
      topicKey = `${sectionKey}__${topicId}`;
    } else {
      topicKey = `${chapterId}__${topicId}`;
    }

    if (!this.openTopics.has(topicKey)) {
      this.toggleTopic(topicKey);
    }

    const el = document.getElementById(`tpbody-${topicKey}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
  
