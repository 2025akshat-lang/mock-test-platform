/**
 * ============================================================
 * 📝 PREPZONE NOTES ENGINE (PRODUCTION READY - NO FREEZE, SMOOTH 60FPS)
 * ============================================================
 */

const NotesEngine = {
  manifestData: null,
  currentSubjectData: null,
  activeTagFilter: 'all',

  // 1. Manifest initialization
  init: async function() {
    try {
      const response = await fetch('data/notes/notes-manifest.json');
      if (!response.ok) throw new Error("Manifest file not found");
      this.manifestData = await response.json();
      this.renderExamCategories();
    } catch (error) {
      console.error("Notes Engine Initialization Failed:", error);
    }
  },

  // 2. Main Menu view (Hides filter area)
  renderExamCategories: function() {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let htmlContent = '';
    this.manifestData.exam_categories.forEach(category => {
      htmlContent += `
        <div style="grid-column: 1/-1; margin-top: 15px; margin-bottom: 5px;">
          <h3 style="margin: 0; color: #0f172a; font-size: 1.15rem; border-left: 4px solid #2563eb; padding-left: 8px; font-family: sans-serif;">${category.name}</h3>
        </div>
      `;
      
      category.subjects.forEach(subject => {
        htmlContent += `
          <div onclick="NotesEngine.loadSubject('${subject.path}')" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); cursor: pointer; -webkit-tap-highlight-color: transparent;">
            <div style="font-weight: 700; color: #1e293b; font-size: 1rem; margin-bottom: 3px;">${subject.name}</div>
            <div style="font-size: 0.8rem; color: #64748b;">📚 Tap to open repository</div>
          </div>
        `;
      });
    });

    grid.innerHTML = htmlContent;
    
    const filterArea = document.getElementById('notes-filter-area');
    if (filterArea) filterArea.style.display = 'none';
  },

  // 3. Fetch Subject File Safely
  loadSubject: async function(filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error("Subject data file not found");
      this.currentSubjectData = await response.json();
      this.activeTagFilter = 'all';
      
      this.renderSubMenus();
      this.renderNotesTree();
    } catch (error) {
      console.error("Failed to load subject notes:", error);
      alert("Notes data could not be loaded! Please check if JSON exists at: " + filePath);
    }
  },

  // 4. Render Top Filter Menu Bar
  renderSubMenus: function() {
    const filterArea = document.getElementById('notes-filter-area');
    if (!filterArea) return;
    filterArea.style.display = 'flex';
    filterArea.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.innerText = "⬅ Back to Master Tree";
    backBtn.style.cssText = "background: #0f172a; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.8rem;";
    backBtn.onclick = () => this.renderExamCategories();
    filterArea.appendChild(backBtn);

    if (this.currentSubjectData.search_sub_menus) {
      this.currentSubjectData.search_sub_menus.forEach(menu => {
        const btn = document.createElement('button');
        btn.innerText = menu.label;
        const isActive = this.activeTagFilter === menu.tag;
        btn.style.cssText = `padding: 8px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.8rem; border: 1px solid #cbd5e1; background: ${isActive ? '#2563eb' : '#fff'}; color: ${isActive ? '#fff' : '#334155'}; transition: background 0.1s;`;
        
        btn.onclick = () => {
          this.activeTagFilter = menu.tag;
          this.renderSubMenus();
          this.renderNotesTree();
        };
        filterArea.appendChild(btn);
      });
    }
  },

  // 5. Expandable Tree Architecture (Cleanly Hidden Inside Accordions by Default)
  renderNotesTree: function() {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const searchInput = document.getElementById('note-search');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';

    if (!this.currentSubjectData || !this.currentSubjectData.hierarchy) return;

    this.currentSubjectData.hierarchy.forEach(chapter => {
      let chapterHasVisibleContent = false;
      
      const chapterDiv = document.createElement('div');
      chapterDiv.style.cssText = "grid-column: 1/-1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; overflow: hidden; display: flex; flex-direction: column;";
      
      let chapterHtml = `
        <div style="background: #e2e8f0; padding: 12px 15px; font-weight: 800; color: #1e293b; font-size: 1.05rem; border-bottom: 1px solid #cbd5e1;">
          📂 ${chapter.chapter_title}
        </div>
        <div style="padding: 10px; display: flex; flex-direction: column; gap: 10px;">
      `;

      chapter.topics.forEach(topic => {
        const filteredNotes = topic.notes_list.filter(note => {
          const matchesSearch = note.title.toLowerCase().includes(searchQuery) || note.basic_overview.toLowerCase().includes(searchQuery);
          const matchesTag = this.activeTagFilter === 'all' || note.tags.includes(this.activeTagFilter);
          return matchesSearch && matchesTag;
        });

        if (filteredNotes.length > 0) {
          chapterHasVisibleContent = true;
          
          chapterHtml += `
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; overflow: hidden; display: flex; flex-direction: column;">
              <!-- 🔽 Accordion Toggle Header -->
              <div onclick="NotesEngine.toggleAccordion('${topic.topic_id}')" style="background: #f1f5f9; padding: 10px 12px; font-weight: 700; color: #334155; font-size: 0.95rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; -webkit-tap-highlight-color: transparent;">
                <span>📄 ${topic.topic_title}</span>
                <span id="icon-${topic.topic_id}" style="transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); transform: rotate(0deg);">🔽</span>
              </div>
              
              <!-- 🚫 Content Box - Hidden by default till tapped -->
              <div id="body-${topic.topic_id}" style="display: none; padding: 12px; border-top: 1px solid #cbd5e1; flex-direction: column; gap: 12px;">
          `;

          filteredNotes.forEach(note => {
            const btnColor = note.extra_info_btn_color || '#2563eb';
            
            chapterHtml += `
              <div style="border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px; margin-bottom: 5px;">
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 6px;">
                  <h4 style="margin: 0; color: #0f172a; font-size: 0.95rem; font-weight: 700; line-height: 1.4;">${DOMPurify.sanitize(note.title)}</h4>
                  
                  ${note.has_extra_info ? `
                    <button onclick="NotesEngine.toggleExtraInfo(event, '\({note.id}')" style="background: \){btnColor}; color: #fff; border: none; width: 22px; height: 30px; border-radius: 4px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; letter-spacing: -1px; writing-mode: vertical-lr; -webkit-tap-highlight-color: transparent;" title="Click for Extra Info">|||</button>
                  ` : ''}
                </div>
                
                <p style="margin: 0; color: #334155; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap;">${DOMPurify.sanitize(note.basic_overview)}</p>
                
                ${note.has_extra_info ? `
                  <div id="extra-\${note.id}" style="display: none; margin-top: 8px; padding: 10px 12px; background: #fff8e1; border-left: 4px solid \({btnColor}; border-radius: 4px; font-size: 0.85rem; color: #b78103; white-space: pre-wrap; font-weight: 600; line-height: 1.4;">\){DOMPurify.sanitize(note.extra_info_content)}</div>
                ` : ''}
              </div>
            `;
          });

          chapterHtml += `
              </div>
            </div>
          `;
        }
      });

      chapterHtml += `</div>`;
      chapterDiv.innerHTML = chapterHtml;
      
      if (chapterHasVisibleContent) {
        grid.appendChild(chapterDiv);
      }
    });

    // MathJax Trigger for beautiful execution of LaTeX formulas
    if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
      MathJax.typesetPromise();
    }
  },

  // Accordion open/close engine
  toggleAccordion: function(topicId) {
    const body = document.getElementById(`body-${topicId}`);
    const icon = document.getElementById(`icon-${topicId}`);
    if (body && icon) {
      if (body.style.display === 'none' || body.style.display === '') {
        body.style.display = 'flex';
        icon.style.transform = 'rotate(180deg)';
      } else {
        body.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
      }
    }
  },

  // ||| Extra info slide toggler
  toggleExtraInfo: function(event, noteId) {
    event.stopPropagation();
    const extraBox = document.getElementById(`extra-${noteId}`);
    if (extraBox) {
      extraBox.style.display = extraBox.style.display === 'none' ? 'block' : 'none';
    }
  }
};
