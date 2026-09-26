/**
 * ============================================================
 * 📝 PREPZONE NOTES ENGINE (PURELY ISOLATED FROM MOCK TEST)
 * ============================================================
 */

const NotesEngine = {
  manifestData: null,
  currentSubjectData: null,
  activeTagFilter: 'all',

  // 1. सबसे पहले manifest.json को लोड करना
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

  // 2. एग्जाम्स और उनके सब्जेक्ट्स की लिस्ट दिखाना
  renderExamCategories: function() {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let htmlContent = '';
    this.manifestData.exam_categories.forEach(category => {
      htmlContent += `
        <div style="grid-column: 1/-1; margin-top: 15px; margin-bottom: 5px;">
          <h3 style="margin: 0; color: #0f172a; font-size: 1.2rem; border-left: 4px solid #2563eb; padding-left: 8px;">${category.name}</h3>
        </div>
      `;
      
      category.subjects.forEach(subject => {
        htmlContent += `
          <div onclick="NotesEngine.loadSubject('${subject.path}')" style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.shadow='0 4px 6px rgba(0,0,0,0.05)'" onmouseout="this.style.transform='none'; this.style.shadow='0 1px 3px rgba(0,0,0,0.05)'">
            <div style="font-weight: 700; color: #1e293b; font-size: 1.05rem; margin-bottom: 4px;">${subject.name}</div>
            <div style="font-size: 0.8rem; color: #64748b;">📚 Tap to open notes repository</div>
          </div>
        `;
      });
    });

    grid.innerHTML = htmlContent;
    
    // वापस होम पर आने पर फ़िल्टर बार छुपा दें
    const filterArea = document.getElementById('notes-filter-area');
    if (filterArea) filterArea.style.display = 'none';
  },

  // 3. किसी खास सब्जेक्ट की JSON फ़ाइल को फ़ेच करना
  loadSubject: async function(filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error("Subject data file not found");
      this.currentSubjectData = await response.json();
      this.activeTagFilter = 'all';
      
      // सब-सर्च मेनू रेंडर करना
      this.renderSubMenus();
      // नोट्स ट्री रेंडर करना
      this.renderNotesTree();
    } catch (error) {
      console.error("Failed to load subject notes:", error);
      alert("Notes data could not be loaded!");
    }
  },

  // 4. सब-सर्च फ़िल्टर मेनू (Rebellions, QC Special, आदि) को दिखाना
  renderSubMenus: function() {
    const filterArea = document.getElementById('notes-filter-area');
    if (!filterArea) return;
    filterArea.style.display = 'flex';
    filterArea.innerHTML = '';

    // बैक बटन जोड़ना
    const backBtn = document.createElement('button');
    backBtn.innerText = "⬅ Back to Exams";
    backBtn.style.cssText = "background: #64748b; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem;";
    backBtn.onclick = () => this.renderExamCategories();
    filterArea.appendChild(backBtn);

    // JSON से आए फ़िल्टर बटन्स जोड़ना
    this.currentSubjectData.search_sub_menus.forEach(menu => {
      const btn = document.createElement('button');
      btn.innerText = menu.label;
      btn.style.cssText = `padding: 8px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem; border: 1px solid #cbd5e1; background: ${this.activeTagFilter === menu.tag ? '#2563eb' : '#fff'}; color: ${this.activeTagFilter === menu.tag ? '#fff' : '#334155'};`;
      
      btn.onclick = () => {
        this.activeTagFilter = menu.tag;
        this.renderSubMenus(); // बटन का एक्टिव कलर बदलने के लिए दोबारा रेंडर
        this.renderNotesTree();
      };
      filterArea.appendChild(btn);
    });
  },

  // 5. Expandable Hierarchical Tree और नोट्स को रेंडर करना
  renderNotesTree: function() {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const searchQuery = document.getElementById('note-search') ? document.getElementById('note-search').value.toLowerCase() : '';

    this.currentSubjectData.hierarchy.forEach(chapter => {
      let chapterHasVisibleContent = false;
      
      const chapterDiv = document.createElement('div');
      chapterDiv.style.cssText = "grid-column: 1/-1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; overflow: hidden;";
      
      let chapterHtml = `
        <div style="background: #e2e8f0; padding: 10px 15px; font-weight: 800; color: #1e293b; font-size: 1.1rem;">
          📂 ${chapter.chapter_title}
        </div>
        <div style="padding: 12px; display: flex; flex-direction: column; gap: 10px;">
      `;

      chapter.topics.forEach(topic => {
        // फ़िल्टर लॉजिक: सर्च क्वेरी और सब-मेनू टैग्स चेक करना
        const filteredNotes = topic.notes_list.filter(note => {
          const matchesSearch = note.title.toLowerCase().includes(searchQuery) || note.basic_overview.toLowerCase().includes(searchQuery);
          const matchesTag = this.activeTagFilter === 'all' || note.tags.includes(this.activeTagFilter);
          return matchesSearch && matchesTag;
        });

        if (filteredNotes.length > 0) {
          chapterHasVisibleContent = true;
          
          chapterHtml += `
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; overflow: hidden;">
              <!-- Expandable Header Toggle -->
              <div onclick="NotesEngine.toggleAccordion('${topic.topic_id}')" style="background: #f1f5f9; padding: 10px 12px; font-weight: 700; color: #334155; font-size: 0.95rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <span>📄 ${topic.topic_title}</span>
                <span id="icon-${topic.topic_id}" style="transition: transform 0.2s;">🔽</span>
              </div>
              
              <!-- Content Body -->
              <div id="body-${topic.topic_id}" style="display: none; padding: 12px; border-top: 1px solid #cbd5e1; flex-direction: column; gap: 12px;">
          `;

          filteredNotes.forEach(note => {
            chapterHtml += `
              <div style="border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px; margin-bottom: 10px;">
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 6px;">
                  <h4 style="margin: 0; color: #0f172a; font-size: 1rem; font-weight: 700;">${DOMPurify.sanitize(note.title)}</h4>
                  
                  <!-- कलर्ड वर्टिकल रेक्टेंगल '|||' एक्स्ट्रा बटन -->
                  ${note.has_extra_info ? `
                    <button onclick="NotesEngine.toggleExtraInfo(event, 'note.id')" style="background: {note.extra_info_btn_color || '#2563eb'}; color: #fff; border: none; width: 24px; height: 32px; border-radius: 4px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; letter-spacing: -1px; writing-mode: vertical-lr;" title="Click for Quick Extra Revision Info">|||</button>
                  ` : ''}
                </div>
                
                <p style="margin: 0; color: #334155; font-size: 0.9rem; line-height: 1.5;">${DOMPurify.sanitize(note.basic_overview)}</p>
                
                <!-- हिडन एक्स्टra इन्फो बॉक्स (||| बटन दबाने पर खुलेगा) -->
                ${note.has_extra_info ? `
                  <div id="extra-\${note.id}" style="display: none; margin-top: 10px; padding: 10px 12px; background: #fff8e1; border-left: 4px solid \${note.extra_info_btn_color || '#2563eb'}; border-radius: 4px; font-size: 0.85rem; color: #b78103; white-space: pre-wrap; font-weight: 600;">
                    \${DOMPurify.sanitize(note.extra_info_content)}
                  </div>
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

    // मैथ फ़ॉर्मूले रेंडर करने के लिए MathJax/KaTeX को ट्रिगर करना
    if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
      MathJax.typesetPromise();
    }
  },

  // Accordion को खोलने/बंद करने का फंक्शन
  toggleAccordion: function(topicId) {
    const body = document.getElementById(`body-${topicId}`);
    const icon = document.getElementById(`icon-${topicId}`);
    if (body) {
      if (body.style.display === 'none') {
        body.style.display = 'flex';
        icon.style.transform = 'rotate(180deg)';
      } else {
        body.style.display = 'none';
        icon.style.transform = 'none';
      }
    }
  },

  // ||| बटन दबाने पर एक्स्ट्रा इन्फो टॉगल करने का फंक्शन
  toggleExtraInfo: function(event, noteId) {
    event.stopPropagation(); // क्लिक इवेंट को एक्सीडियन हेडर तक जाने से रोकना
    const extraBox = document.getElementById(`extra-${noteId}`);
    if (extraBox) {
      extraBox.style.display = extraBox.style.display === 'none' ? 'block' : 'none';
    }
  }
};
