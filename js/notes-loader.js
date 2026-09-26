/**
 * ============================================================
 * 📝 PREPZONE NOTES ENGINE v2 (LAZY CHAPTER LOADING + CONTEXTUAL FILTERS)
 * ------------------------------------------------------------
 * Completely isolated from app.js / data-loader.js (mock test engine).
 * Only touches: #notes-grid, #notes-filter-area, #note-search
 * ============================================================
 */

const NotesEngine = {
  manifestData: null,        // data/notes/manifest.json (exam categories -> subjects)
  subjectIndexData: null,    // currently selected subject's chapter list (light)
  chapterCache: {},          // chapterId -> full chapter JSON (fetched on first expand)
  chapterFilters: {},        // chapterId -> active tag ('all' by default)
  openChapters: new Set(),   // chapterIds currently expanded
  _searchTimeout: null,

  // ------------------------------------------------------------
  // 1. Boot: fetch only the root manifest (tiny file)
  // ------------------------------------------------------------
  init: async function () {
    try {
      const res = await fetch('data/notes/manifest.json');
      if (!res.ok) throw new Error('manifest.json not found');
      this.manifestData = await res.json();
      this.renderExamCategories();
      this._bindSearchInput();
    } catch (err) {
      console.error('NotesEngine init failed:', err);
      const grid = document.getElementById('notes-grid');
      if (grid) grid.innerHTML = `<div style="padding:20px;color:#ef4444;">Notes could not be loaded. Please check data/notes/manifest.json exists.</div>`;
    }
  },

  // Bind ONE debounced input listener (fixes keystroke-lag)
  _bindSearchInput: function () {
    const input = document.getElementById('note-search');
    if (!input || input._notesEngineBound) return;
    input._notesEngineBound = true;
    input.addEventListener('input', () => {
      clearTimeout(this._searchTimeout);
      this._searchTimeout = setTimeout(() => this._rerenderOpenChapters(), 200);
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
  // 2. Level 1: Exam categories -> Subjects
  // ------------------------------------------------------------
  renderExamCategories: function () {
    this.subjectIndexData = null;
    this.chapterCache = {};
    this.chapterFilters = {};
    this.openChapters = new Set();

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

      this._renderBackBar();
      this.renderChapterShells();
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

    const backBtn = document.createElement('button');
    backBtn.innerText = '⬅ Back to Master Tree';
    backBtn.style.cssText = 'background:#0f172a;color:#fff;border:none;padding:8px 12px;border-radius:6px;font-weight:700;cursor:pointer;font-size:0.8rem;';
    backBtn.onclick = () => this.renderExamCategories();
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
      chapterDiv.style.cssText = 'grid-column:1/-1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;overflow:hidden;display:flex;flex-direction:column;';
      chapterDiv.innerHTML = `
        <div onclick="NotesEngine.toggleChapter('${this._esc(ch.id)}','${this._esc(ch.file)}')" style="background:#e2e8f0;padding:12px 15px;font-weight:800;color:#1e293b;font-size:1.05rem;border-bottom:1px solid #cbd5e1;cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none;-webkit-tap-highlight-color:transparent;">
          <span>📂 ${ch.title}</span>
          <span id="chicon-${ch.id}" style="transition:transform 0.2s cubic-bezier(0.4,0,0.2,1);transform:rotate(0deg);">🔽</span>
        </div>
        <div id="chbody-${ch.id}" style="display:none;padding:12px;border-top:1px solid #cbd5e1;flex-direction:column;gap:10px;"></div>
      `;
      fragment.appendChild(chapterDiv);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);
  },

  // ------------------------------------------------------------
  // 5. Expand/collapse a chapter — fetches its JSON ONLY ONCE
  // ------------------------------------------------------------
  toggleChapter: async function (chapterId, file) {
    const body = document.getElementById(`chbody-${chapterId}`);
    const icon = document.getElementById(`chicon-${chapterId}`);
    if (!body || !icon) return;

    if (this.openChapters.has(chapterId)) {
      body.style.display = 'none';
      icon.style.transform = 'rotate(0deg)';
      this.openChapters.delete(chapterId);
      return;
    }

    body.style.display = 'flex';
    icon.style.transform = 'rotate(180deg)';
    this.openChapters.add(chapterId);

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

  // ------------------------------------------------------------
  // 6. Render one chapter's body.
  //    Two supported schemas:
  //    (a) FLAT   — chapterData.topics directly (e.g. Polity, Geography)
  //    (b) NESTED — chapterData.sections (e.g. History → Ancient/Medieval/
  //        Modern), each section behaving exactly like a flat chapter
  //        would (its own optional filter menu + topics), just one
  //        level deeper. No extra fetch needed — whole chapter JSON
  //        (including all sections) was already loaded once in toggleChapter.
  // ------------------------------------------------------------
  renderChapterBody: function (chapterId) {
    const chapterData = this.chapterCache[chapterId];
    const body = document.getElementById(`chbody-${chapterId}`);
    if (!body || !chapterData) return;

    const searchInput = document.getElementById('note-search');
    const query = searchInput ? searchInput.value.toLowerCase() : '';

    let html = '';

    if (chapterData.sections && chapterData.sections.length) {
      // NESTED: chapterId -> era/section accordions -> topics -> notes
      chapterData.sections.forEach(section => {
        const sectionKey = `${chapterId}__sec-${section.id}`;
        const innerHtml = this._renderFilterAndTopics(sectionKey, section.topics, section.filters, query);
        html += `
          <div style="border:1px solid #cbd5e1;border-radius:6px;background:#fff;overflow:hidden;display:flex;flex-direction:column;">
            <div onclick="NotesEngine.toggleTopic('${this._esc(sectionKey)}')" style="background:#eef2ff;padding:10px 12px;font-weight:800;color:#312e81;font-size:0.95rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none;-webkit-tap-highlight-color:transparent;">
              <span>🗂️ ${section.title}</span>
              <span id="tpicon-${sectionKey}" style="transition:transform 0.2s cubic-bezier(0.4,0,0.2,1);transform:rotate(0deg);">🔽</span>
            </div>
            <div id="tpbody-${sectionKey}" style="display:none;padding:12px;border-top:1px solid #cbd5e1;flex-direction:column;gap:10px;">
              ${innerHtml}
            </div>
          </div>
        `;
      });
    } else {
      // FLAT: chapterId -> topics -> notes directly (unchanged old behavior)
      html += this._renderFilterAndTopics(chapterId, chapterData.topics, chapterData.filters, query);
    }

    body.innerHTML = html;

    if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
      MathJax.typesetPromise([body]).catch(err => console.error('MathJax typeset error:', err));
    }
  },

  // Renders: [optional tag-filter row] + [topic accordions -> notes].
  // filterKey is either a chapterId (flat case) or "chapterId__sec-xyz"
  // (nested case) — setChapterFilter() below parses it back apart.
  _renderFilterAndTopics: function (filterKey, topics, filtersDef, query) {
    const activeTag = this.chapterFilters[filterKey] || 'all';
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
      html += `
        <div style="border:1px solid #cbd5e1;border-radius:6px;background:#fff;overflow:hidden;display:flex;flex-direction:column;">
          <div onclick="NotesEngine.toggleTopic('${this._esc(topicKey)}')" style="background:#f1f5f9;padding:10px 12px;font-weight:700;color:#334155;font-size:0.95rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none;-webkit-tap-highlight-color:transparent;">
            <span>📄 ${topic.topic_title}</span>
            <span id="tpicon-${topicKey}" style="transition:transform 0.2s cubic-bezier(0.4,0,0.2,1);transform:rotate(0deg);">🔽</span>
          </div>
          <div id="tpbody-${topicKey}" style="display:none;padding:12px;border-top:1px solid #cbd5e1;flex-direction:column;gap:12px;">
      `;

      filteredNotes.forEach(note => {
        const btnColor = note.extra_info_btn_color || '#2563eb';
        const noteKey = `${topicKey}__${note.id}`;
        html += `
          <div style="border-bottom:1px dashed #e2e8f0;padding-bottom:10px;margin-bottom:5px;">
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

    return html;
  },

  // filterKey is either "chapterId" (flat) or "chapterId__sec-xyz" (nested) —
  // always re-render the top-level chapter body so the whole tree stays in sync.
  setChapterFilter: function (filterKey, tag) {
    this.chapterFilters[filterKey] = tag;
    const chapterId = filterKey.split('__sec-')[0];
    this.renderChapterBody(chapterId);
  },

  // Called by debounced search — only re-renders chapters already open/cached
  _rerenderOpenChapters: function () {
    this.openChapters.forEach(chapterId => {
      if (this.chapterCache[chapterId]) this.renderChapterBody(chapterId);
    });
  },

  toggleTopic: function (topicKey) {
    const body = document.getElementById(`tpbody-${topicKey}`);
    const icon = document.getElementById(`tpicon-${topicKey}`);
    if (!body || !icon) return;
    if (body.style.display === 'none' || body.style.display === '') {
      body.style.display = 'flex';
      icon.style.transform = 'rotate(180deg)';
    } else {
      body.style.display = 'none';
      icon.style.transform = 'rotate(0deg)';
    }
  },

  toggleExtraInfo: function (event, noteKey) {
    event.stopPropagation();
    const extraBox = document.getElementById(`extra-${noteKey}`);
    if (extraBox) {
      extraBox.style.display = extraBox.style.display === 'none' ? 'block' : 'none';
    }
  }
};
