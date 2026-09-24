// ============================================================
// 🎮 1. CENTRAL CONTROL PANEL (App Orchestrator)
// ============================================================
const ControlPanel = (() => {
  let activePanelId = 'mock-panel';

  function init() {
    MockPanel.init();
    console.log("Central Control Panel: All Modules Hooked Up Securely.");
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && overlay) {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    }
  }

  function switchPanel(panelId) {
    activePanelId = panelId;
    
    document.querySelectorAll('.app-panel-wrapper').forEach(el => {
      el.classList.remove('active');
    });
    
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }

    document.querySelectorAll('.sidebar-menu .menu-item').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`menu-btn-${panelId}`);
    if (activeBtn) activeBtn.classList.add('active');

    toggleSidebar();
  }

  return { init, toggleSidebar, switchPanel };
})();

// ============================================================
// 🚀 2. MOCK TEST PANEL (Safe Sandbox)
// ============================================================
const MockPanel = (() => {
  let manifestData = null;
  let currentSubCatTests = [];
  let navHistoryStack = [];
  let activeMainCat = null;
  let activeSubCat = null;

  let currentActiveTest = null;
  let rawQuizData = [];
  let currentQIdx = 0, overallTime = 1800, timerInterval = null;
  let userState = [];
  let attemptHistory = {};
  let revealedSolutions = new Set();
  let registeredEmail = localStorage.getItem('user_email') || '';

  function showFailSafe(message) {
    document.querySelectorAll('.app-screen').forEach(el => el.style.display = 'none');
    const examHeader = document.getElementById('exam-header');
    if(examHeader) examHeader.style.display = 'none';
    const sectionTabs = document.getElementById('section-tabs');
    if(sectionTabs) sectionTabs.style.display = 'none';
    const examViewport = document.getElementById('exam-viewport');
    if(examViewport) examViewport.style.display = 'none';
    const examFooter = document.getElementById('exam-footer');
    if(examFooter) examFooter.style.display = 'none';

    const errDetail = document.getElementById('error-detail');
    if(errDetail) errDetail.innerText = message || "This section hasn't been added yet. Please check back soon.";
    const errScreen = document.getElementById('error-screen');
    if(errScreen) errScreen.style.display = 'flex';
  }
  function goToHome() {
    const errScreen = document.getElementById('error-screen');
    if(errScreen) errScreen.style.display = 'none';
    
    // 👇 Yeh add karna zaroori hai taaki exam/analysis screen agar khuli ho toh band ho jaye
    const examHeader = document.getElementById('exam-header');
    if(examHeader) examHeader.style.display = 'none';
    const sectionTabs = document.getElementById('section-tabs');
    if(sectionTabs) sectionTabs.style.display = 'none';
    const examViewport = document.getElementById('exam-viewport');
    if(examViewport) examViewport.style.display = 'none';
    const examFooter = document.getElementById('exam-footer');
    if(examFooter) examFooter.style.display = 'none';
    const analysisScreen = document.getElementById('test-analysis-screen');
    if(analysisScreen) analysisScreen.style.display = 'none';
    const drawer = document.getElementById('question-palette-drawer');
    if(drawer) drawer.style.display = 'none';

    const homeDash = document.getElementById('home-dashboard');
    if(homeDash) homeDash.style.display = 'flex';

    navHistoryStack = ['level-1'];
    activeMainCat = null;
    activeSubCat = null;

    const navHeader = document.getElementById('nav-header-bar');
    if(navHeader) navHeader.style.display = 'none';
    renderLevel1();
    
    const v1 = document.getElementById('view-level-1');
    const v2 = document.getElementById('view-level-2');
    const v3 = document.getElementById('view-level-3');
    if(v1) v1.style.display = 'grid';
    if(v2) v2.style.display = 'none';
    if(v3) v3.style.display = 'none';
  }

  async function init() {
    if (typeof DataLoader === 'undefined') {
      showFailSafe("DataLoader is not defined. Please check your script imports.");
      return;
    }
    const res = await DataLoader.getManifest();
    if (!res.ok) {
      showFailSafe("Couldn't load the exam list. Please check your connection and try again.");
      console.error(res.error);
      return;
    }
    manifestData = res.data;
    goToHome();
  }

  
  function renderLevel1() {
    const container = document.getElementById('view-level-1');
    if (!container) return;
    if (!manifestData || !manifestData.categories || manifestData.categories.length === 0) {
      container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px; font-weight:600;">No categories configured yet.</div>`;
      return;
    }
    container.innerHTML = manifestData.categories.map(cat => `
      <div class="menu-card" onclick="MockPanel.openLevel2('${cat.id}')">
        <div class="menu-card-left">
          <div class="menu-icon">${cat.icon || '📁'}</div>
          <div>
            <div class="menu-title">${cat.title}</div>
            <div class="menu-desc">${cat.desc || ''}</div>
          </div>
        </div>
        <div class="menu-arrow">➔</div>
      </div>
    `).join('');
  }

  function openLevel2(mainCatKey) {
    activeMainCat = mainCatKey;
    const catDetails = manifestData.categories.find(c => c.id === mainCatKey);

    if (!catDetails) {
      showFailSafe(`Category "${mainCatKey}" was not found in manifest.json.`);
      return;
    }

    const titleEl = document.getElementById('current-page-title');
    if(titleEl) titleEl.innerText = catDetails.title;
    const navHeader = document.getElementById('nav-header-bar');
    if(navHeader) navHeader.style.display = 'flex';

    const subContainer = document.getElementById('view-level-2');
    if(subContainer) {
      subContainer.innerHTML = catDetails.subCategories.map(sub => `
        <div class="sub-card" onclick="MockPanel.openLevel3('${sub.id}', '${sub.name.replace(/'/g, "\\'")}')">
          ${sub.name}
        </div>
      `).join('');
    }

    const v1 = document.getElementById('view-level-1');
    const v2 = document.getElementById('view-level-2');
    const v3 = document.getElementById('view-level-3');
    if(v1) v1.style.display = 'none';
    if(v2) v2.style.display = 'grid';
    if(v3) v3.style.display = 'none';

    navHistoryStack.push('level-2');
  }

  async function openLevel3(subCatId, subCatName) {
    activeSubCat = subCatId;
    const titleEl = document.getElementById('current-page-title');
    if(titleEl) titleEl.innerText = subCatName;

    const testsContainer = document.getElementById('view-level-3');
    const v1 = document.getElementById('view-level-1');
    const v2 = document.getElementById('view-level-2');
    const v3 = document.getElementById('view-level-3');

    if(v1) v1.style.display = 'none';
    if(v2) v2.style.display = 'none';
    if(v3) v3.style.display = 'flex';
    navHistoryStack.push('level-3');

    if(testsContainer) testsContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px;">Loading tests…</div>`;

    const res = await DataLoader.getTestIndex(subCatId);

    if (!res.ok) {
      currentSubCatTests = [];
      if(testsContainer) testsContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px; font-weight:600;">Upcoming Mock Tests will be added soon!</div>`;
      return;
    }

    currentSubCatTests = res.data || [];

    if (currentSubCatTests.length === 0) {
      if(testsContainer) testsContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px; font-weight:600;">Upcoming Mock Tests will be added soon!</div>`;
    } else {
      if(testsContainer) {
        testsContainer.innerHTML = currentSubCatTests.map(m => `
          <div class="test-series-card">
            <span class="card-badge ${m.badgeClass}">${m.badgeText}</span>
            <div class="series-title">${m.title}</div>
            <div class="series-meta">
              <span>📝 ${m.questionCount} Qs</span>
              <span>⏱️ ${m.timeMins} Mins</span>
              <span>🎯 ${m.maxMarks} Marks</span>
            </div>
            <div class="series-action">
              <button class="btn btn-secondary" onclick="MockPanel.viewPreviousAttempt('${m.id}')">Results</button>
              <button class="btn btn-primary" onclick="MockPanel.startMock('${m.id}')">Start Test 🚀</button>
            </div>
          </div>
        `).join('');
      }
    }
  }

  function goBackStep() {
    navHistoryStack.pop();
    const currentView = navHistoryStack[navHistoryStack.length - 1];

    if (currentView === 'level-1' || !currentView) {
      goToHome();
    } else if (currentView === 'level-2') {
      openLevel2(activeMainCat);
      navHistoryStack.pop();
    }
  }

  function promptUserEmail() {
    const email = prompt("Enter account email to sync score & dispatch reports:", registeredEmail || "user@prepzone.com");
    if (email) {
      registeredEmail = email;
      localStorage.setItem('user_email', email);
      alert(`Account synced with: ${email}`);
    }
  }

  function normalizeQuestion(q) {
    return {
      ...q,
      marks: { pos: 1.0, neg: 0, ...(q.marks || {}) },
      timeAvg: q.timeAvg || "00:30",
      rightPct: q.rightPct || "--",
      explanation: q.explanation || "No explanation provided for this question yet."
    };
  }

  function renderMarkdownLite(text) {
    if (!text) return '';
    let html = String(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    const lines = html.split(/\r?\n/);
    const out = [];
    let inList = false;
    lines.forEach(line => {
      const trimmed = line.trim();
      const isBullet = /^[-*]\s+/.test(trimmed);
      if (isBullet) {
        if (!inList) { out.push('<ul class="sol-key-points">'); inList = true; }
        out.push('<li>' + trimmed.replace(/^[-*]\s+/, '') + '</li>');
      } else {
        if (inList) { out.push('</ul>'); inList = false; }
        if (trimmed.length) out.push('<p>' + trimmed + '</p>');
      }
    });
    if (inList) out.push('</ul>');
    return out.join('');
  }

      function renderMath(container) {
    if (!container) return;
    
    // Check if MathJax is available on the window object
    if (window.MathJax && typeof window.MathJax.typeset === 'function') {
      try {
        // Clear any old tracking for this container if typesetClear exists
        if (typeof window.MathJax.typesetClear === 'function') {
          window.MathJax.typesetClear([container]);
        }
        // Force sync typesetting on the specific element container
        window.MathJax.typeset([container]);
      } catch (e) {
        console.error('MathJax render failed:', e);
      }
    } else {
      // Fallback: If MathJax script is still loading asynchronously, retry after a short delay
      setTimeout(() => {
        if (window.MathJax && typeof window.MathJax.typeset === 'function') {
          window.MathJax.typeset([container]);
        }
      }, 300);
    }
  }


  async function startMock(testId) {
    const meta = currentSubCatTests.find(m => m.id === testId);
    if (!meta) {
      showFailSafe(`Test "${testId}" is no longer listed in this section.`);
      return;
    }

    const res = await DataLoader.getTest(activeSubCat, meta.file);
    if (!res.ok || !res.data || !Array.isArray(res.data.questions) || res.data.questions.length === 0) {
      showFailSafe("This test's question file is missing or invalid, so it can't be started right now.");
      console.error(res.error);
      return;
    }
    currentActiveTest = res.data;
    const normalized = currentActiveTest.questions.map(normalizeQuestion);
    const sectionOrderMap = new Map();
    normalized.forEach(q => {
      if (!sectionOrderMap.has(q.section)) {
        sectionOrderMap.set(q.section, sectionOrderMap.size);
      }
    });
    rawQuizData = normalized.sort((a, b) => {
      return sectionOrderMap.get(a.section) - sectionOrderMap.get(b.section);
    });
    
    document.getElementById('home-dashboard').style.display = 'none';
    document.getElementById('exam-header').style.display = 'flex';
    document.getElementById('section-tabs').style.display = 'flex';
    document.getElementById('exam-viewport').style.display = 'flex';
    const footer = document.getElementById('exam-footer');
    if(footer) footer.style.display = 'flex';
    reattemptTest();
  }

  function exitToHome() {
    clearInterval(timerInterval);
    const overlay = document.getElementById('test-analysis-screen');
    if(overlay) overlay.style.display = 'none';
    document.getElementById('exam-header').style.display = 'none';
    document.getElementById('section-tabs').style.display = 'none';
    document.getElementById('exam-viewport').style.display = 'none';
    const footer = document.getElementById('exam-footer');
    if(footer) footer.style.display = 'none';
    document.getElementById('home-dashboard').style.display = 'flex';
  }
  function reattemptTest() {
    clearInterval(timerInterval);
    overallTime = currentActiveTest.timeMins * 60; 
    currentQIdx = 0;
    userState = rawQuizData.map(() => ({ selectedOption: null, status: 'not-visited' }));
    
    // 👇 Analysis screen aur home dashboard ko band karke exam elements ko wapas visible karo
    const analysisScreen = document.getElementById('test-analysis-screen');
    if(analysisScreen) analysisScreen.style.display = 'none';
    const homeDash = document.getElementById('home-dashboard');
    if(homeDash) homeDash.style.display = 'none';

    const examHeader = document.getElementById('exam-header');
    if(examHeader) examHeader.style.display = 'flex';
    const sectionTabs = document.getElementById('section-tabs');
    if(sectionTabs) sectionTabs.style.display = 'flex';
    const examViewport = document.getElementById('exam-viewport');
    if(examViewport) examViewport.style.display = 'flex';
    const examFooter = document.getElementById('exam-footer');
    if(examFooter) examFooter.style.display = 'flex';

    renderSections(); 
    loadQuestion(0); 
    startTimers();
  }

 
  function renderSections() {
    const secs = [...new Set(rawQuizData.map(q => q.section))];
    const currentSec = rawQuizData[currentQIdx].section;
    const tabsContainer = document.getElementById('section-tabs');
    if(tabsContainer) {
      tabsContainer.innerHTML = secs.map(sec => `
        <button class="tab-btn ${sec === currentSec ? 'active' : ''}" onclick="MockPanel.switchSection('${sec}')">${sec}</button>
      `).join('');
    }
  }

  function switchSection(secName) {
    const firstIdx = rawQuizData.findIndex(q => q.section === secName);
    if (firstIdx !== -1) loadQuestion(firstIdx);
  }

  function loadQuestion(idx) {
    currentQIdx = idx; 
    const q = rawQuizData[idx]; 
    const state = userState[idx];
    if (state.status === 'not-visited') state.status = 'not-answered';
    
    const qNumEl = document.getElementById('display-q-num');
    if(qNumEl) qNumEl.innerText = idx + 1;
    
    const qContainer = document.getElementById('question-container');
    if(qContainer) {
      qContainer.innerHTML = `
        <div class="q-text-content">${q.question}</div>
        <div id="q-diagram">${q.diagram || ''}</div>
        <div class="options-list" id="options-container" style="margin-top: 15px;"></div>
      `;
    }

    const optContainer = document.getElementById('options-container');
    if(optContainer && q.options) {
      optContainer.innerHTML = Object.keys(q.options).map(key => `
        <div class="option-card ${state.selectedOption === key ? 'selected' : ''}" onclick="MockPanel.selectOption('${key}')" style="display:flex; gap:10px; padding:10px; margin-bottom:8px; border:1px solid #cbd5e1; border-radius:6px; cursor:pointer;">
          <div class="option-idx" style="font-weight:bold;">${key}.</div>
          <div>${q.options[key]}</div>
        </div>
      `).join('');
    }

    renderMath(document.getElementById('exam-viewport'));
    renderSections();
    renderPalette();
  }

  function selectOption(k) { 
    userState[currentQIdx].selectedOption = k; 
    loadQuestion(currentQIdx); 
  }

  function clearResponse() { 
    userState[currentQIdx].selectedOption = null; 
    loadQuestion(currentQIdx); 
  }

  function saveAndNext() {
    const state = userState[currentQIdx];
    state.status = state.selectedOption ? 'answered' : 'not-answered';
    if (currentQIdx === rawQuizData.length - 1) submitExam();
    else loadQuestion(currentQIdx + 1);
  }

  function markReview() {
    userState[currentQIdx].status = 'review';
    if (currentQIdx === rawQuizData.length - 1) submitExam();
    else loadQuestion(currentQIdx + 1);
  }

  function prevQuestion() {
    if (currentQIdx > 0) loadQuestion(currentQIdx - 1);
  }

    function toggleDrawer() { 
    const drawer = document.getElementById('question-palette-drawer');
    if(drawer) {
      // Yahan check karke isko 'flex' karenge taaki scrollable grid theek se kaam kare
      const currentDisp = window.getComputedStyle(drawer).display;
      drawer.style.display = (currentDisp === 'none' || drawer.style.display === 'none') ? 'flex' : 'none';
    }
  }

  function renderPalette() {
    const grid = document.getElementById('palette-grid');
    if(grid) {
      grid.innerHTML = userState.map((st, i) => `
        <div class="palette-node status-${st.status}" onclick="MockPanel.loadQuestion(${i})" style="width:100%; height:32px; display:flex; align-items:center; justify-content:center; background:#e2e8f0; border-radius:4px; cursor:pointer; font-weight:bold;">${i + 1}</div>
      `).join('');
    }
  }

  function startTimers() {
    timerInterval = setInterval(() => {
      if (overallTime > 0) {
        overallTime--;
        const m = String(Math.floor(overallTime / 60)).padStart(2, '0');
        const s = String(overallTime % 60).padStart(2, '0');
        const timerEl = document.getElementById('overall-timer');
        if(timerEl) timerEl.innerText = `${m}:${s}`;
      } else {
        submitExam();
      }
    }, 1000);
  }

    function submitTestModal() {
    // 👇 Submit dabate hi sabse pehle palette drawer ko band kar do taaki click block na ho
    const drawer = document.getElementById('question-palette-drawer');
    if(drawer) {
      drawer.style.display = 'none';
      drawer.classList.remove('open');
    }

    // Google Sites ke iframe ke liye direct submitExam chala do
    submitExam();
  }


  function submitExam() {
    clearInterval(timerInterval);
    let score = 0, attempted = 0, correct = 0, incorrect = 0, unattempted = 0;
    rawQuizData.forEach((q, i) => {
      const sel = userState[i].selectedOption;
      if (sel) {
        attempted++;
        if (sel === q.correct) { score += q.marks.pos; correct++; }
        else { score -= q.marks.neg; incorrect++; }
      } else {
        unattempted++;
      }
    });
    const maxMarks = rawQuizData.reduce((sum, q) => sum + q.marks.pos, 0);
    const totalStudents = 1200;
    const rank = Math.max(1, Math.floor((1 - (score / maxMarks)) * 100) + 12);
    const percentile = (((totalStudents - rank) / totalStudents) * 100).toFixed(1);
    const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
    
    if (currentActiveTest) {
      attemptHistory[currentActiveTest.id] = {
        testTitle: currentActiveTest.title,
        score: score.toFixed(2),
        maxScore: maxMarks,
        accuracy: `${accuracy}%`,
        rank: `${rank}/${totalStudents}`,
        percentile: `${percentile}%`,
        correct, incorrect, unattempted,
        userState: JSON.parse(JSON.stringify(userState)),
        questionsData: rawQuizData
      };
       

    
      renderAnalyticsView(currentActiveTest.id);
    }
  }

  function viewPreviousAttempt(testId) {
    if (attemptHistory[testId]) {
      renderAnalyticsView(testId);
    } else {
      alert("Pehle yeh test attempt karo, phir results yahan dikhenge!");
    }
  }

  function openAttemptedList() {
    const keys = Object.keys(attemptHistory);
    if (keys.length === 0) {
      alert("Abhi tak koi mock test attempt nahi kiya hai!");
    } else {
      viewPreviousAttempt(keys[keys.length - 1]);
    }
  }

  function renderAnalyticsView(testId) {
    const data = attemptHistory[testId];
    if(!data) return;
    userState = data.userState;
    rawQuizData = data.questionsData;
    revealedSolutions = new Set();

    document.getElementById('exam-header').style.display = 'none';
    document.getElementById('section-tabs').style.display = 'none';
    document.getElementById('exam-viewport').style.display = 'none';
    const footer = document.getElementById('exam-footer');
    if(footer) footer.style.display = 'none';
    const drawer = document.getElementById('question-palette-drawer');
    if(drawer) drawer.style.display = 'none';

    document.getElementById('score-display').innerText = `${data.score} / ${data.maxScore}`;
    document.getElementById('status-display').innerText = "Completed";
    document.getElementById('accuracy-display').innerText = data.accuracy;
    document.getElementById('sec-all').innerText = rawQuizData.length;
    document.getElementById('sec-correct').innerText = data.correct;
    document.getElementById('sec-incorrect').innerText = data.incorrect;
    document.getElementById('sec-unattempted').innerText = data.unattempted;

    renderSolutionsList();
    document.getElementById('test-analysis-screen').style.display = 'block';
  }

  function switchAnalysisTab(tab) {
    const analysisTab = document.getElementById('analysis-tab-content');
    const solutionsTab = document.getElementById('solutions-tab-content');
    const btnAna = document.getElementById('tab-analysis-btn');
    const btnSol = document.getElementById('tab-solutions-btn');

    if (tab === 'analysis') {
      if(analysisTab) analysisTab.style.display = 'block';
      if(solutionsTab) solutionsTab.style.display = 'none';
      if(btnAna) { btnAna.className = 'btn btn-primary'; }
      if(btnSol) { btnSol.className = 'btn btn-secondary'; }
    } else {
      if(analysisTab) analysisTab.style.display = 'none';
      if(solutionsTab) solutionsTab.style.display = 'block';
      if(btnAna) { btnAna.className = 'btn btn-secondary'; }
      if(btnSol) { btnSol.className = 'btn btn-primary'; }
    }
  }

  function renderSolutionsList() {
    const container = document.getElementById('solutions-list-container');
    if(!container) return;
    container.innerHTML = rawQuizData.map((q, i) => {
      const state = userState[i];
      const isCorrect = state.selectedOption === q.correct;
      const isUnattempted = !state.selectedOption;
      return `
        <div class="notes-card" onclick="MockPanel.openSolutionDetail(${i})" style="cursor:pointer; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#64748b; margin-bottom:5px;">
            <span>⏱️ Time: ${q.timeAvg}</span>
            <span style="font-weight:bold; color:${isCorrect ? '#22c55e' : isUnattempted ? '#64748b' : '#ef4444'}">
              ${isCorrect ? 'Correct' : isUnattempted ? 'Unattempted' : 'Incorrect'}
            </span>
          </div>
          <div style="font-weight:600; font-size:0.95rem;">Q${i + 1}. ${q.question}</div>
        </div>
      `;
    }).join('');
    renderMath(container);
  }

    function openSolutionDetail(i) {
    const q = rawQuizData[i];
    const state = userState[i];
    const overlay = document.getElementById('solution-detail-overlay');
    if(overlay) overlay.classList.add('active');

    document.getElementById('sol-meta').innerText = `Question ${i + 1} (${q.section || ''})`;
    document.getElementById('sol-question-text').innerHTML = q.question;
    
    // 👇 Options ko generate karne ka code jo pehle missing tha
    const optionsContainerId = document.getElementById('sol-options-container');
    if (optionsContainerId && q.options) {
      optionsContainerId.innerHTML = Object.keys(q.options).map(key => {
        const isCorrectOpt = (key === q.correct);
        const isUserSelected = (key === state.selectedOption);
        
        let optStyle = "display:flex; gap:10px; padding:10px; margin-bottom:8px; border:1px solid #cbd5e1; border-radius:6px;";
        
        // Agar option sahi hai toh green background/border
        if (isCorrectOpt) {
          optStyle += " background-color: #dcfce7; border-color: #22c55e; color: #166534;";
        } 
        // Agar user ne galat select kiya tha toh red background
        else if (isUserSelected && !isCorrectOpt) {
          optStyle += " background-color: #fee2e2; border-color: #ef4444; color: #991b1b;";
        }

        return `
          <div style="${optStyle}">
            <div style="font-weight:bold;">${key}.</div>
            <div>${q.options[key]} ${isUserSelected ? '<strong>(Your Answer)</strong>' : ''} ${isCorrectOpt ? '<strong>(Correct Answer)</strong>' : ''}</div>
          </div>
        `;
      }).join('');
    } else if (document.getElementById('sol-correct-answer')) {
      // Fallback agar options container na ho HTML mein
      document.getElementById('sol-correct-answer').innerHTML = `Correct Answer: <u>${q.correct}</u> (Your Answer: ${state.selectedOption || 'None'})`;
    }

    document.getElementById('sol-explanation-text').innerHTML = renderMarkdownLite(q.explanation);

    renderSolutionDetailNav(i);
    renderMath(overlay);
  }

  function closeSolutionDetail() {
    const overlay = document.getElementById('solution-detail-overlay');
    if(overlay) overlay.classList.remove('active');
  }

  function renderSolutionDetailNav(activeIdx) {
    const nav = document.getElementById('sol-detail-nav');
    if(!nav) return;
    nav.innerHTML = rawQuizData.map((q, i) => {
      const st = userState[i];
      const unattempted = !st.selectedOption;
      const correct = st.selectedOption === q.correct;
      const cls = unattempted ? 'nav-unattempted' : (correct ? 'nav-correct' : 'nav-incorrect');
      return `<div class="sol-nav-node ${cls} ${i === activeIdx ? 'active' : ''}" onclick="MockPanel.openSolutionDetail(${i})">${i + 1}</div>`;
    }).join('');
  }
    let currentSolutionIndex = 0;

  // 1. Solution detail kholne ke liye
  function openSolutionDetail(i) {
    currentSolutionIndex = i;
    const overlay = document.getElementById('solution-dataset-overlay') || document.getElementById('solution-detail-overlay');
    if(overlay) overlay.classList.add('active');
    renderSolutionQuestionView(currentSolutionIndex);
  }

  // 2. Question, Options aur Explanation render karne ke liye
  function renderSolutionQuestionView(i) {
    currentSolutionIndex = i;
    const q = rawQuizData[i];
    const state = userState[i] || {};

    // Meta details update karo
    const timeMeta = document.getElementById('sol-time-meta');
    if(timeMeta) timeMeta.innerHTML = `⏱️ Time: ${q.timeAvg || '00:15'} | 🎯 Section: ${q.section || 'General'}`;

    const qText = document.getElementById('sol-question-text');
    if(qText) qText.innerHTML = `Q${i + 1}. ${q.question}`;

    // Options render karo
    const optionsContainer = document.getElementById('sol-options-container');
    if (optionsContainer && q.options) {
      optionsContainer.innerHTML = Object.keys(q.options).map(key => {
        const isCorrectOpt = (key === q.correct);
        const isUserSelected = (key === state.selectedOption);

        let optBg = "#ffffff";
        let optBorder = "#cbd5e1";
        let icon = "";

        if (isCorrectOpt) {
          optBg = "#dcfce7";
          optBorder = "#22c55e";
          icon = " ✅ (Correct)";
        } else if (isUserSelected && !isCorrectOpt) {
          optBg = "#fee2e2";
          optBorder = "#ef4444";
          icon = " ❌ (Your Answer)";
        }

        return `
          <div style="display:flex; align-items:center; justify-content:space-between; padding: 12px 15px; margin-bottom: 8px; border: 1px solid ${optBorder}; background-color: ${optBg}; border-radius: 6px; font-size: 0.95rem;">
            <div><strong>${key}.</strong> ${q.options[key]}</div>
            <div style="font-weight:600; font-size:0.85rem; color:${isCorrectOpt ? '#166534' : '#991b1b'}">${icon}</div>
          </div>
        `;
      }).join('');
    }

    // Shuru mein solution box hide rahega aur View Solution button dikhega
    const revealBox = document.getElementById('solution-reveal-box');
    const btnContainer = document.getElementById('view-solution-btn-container');
    
    if(revealBox) revealBox.style.display = 'none';
    if(btnContainer) btnContainer.style.display = 'block';

    // JSON se explanation yahan set hoga
    const correctText = document.getElementById('sol-correct-text');
    if(correctText) correctText.innerHTML = `Correct Answer: ${q.correct} - ${q.options[q.correct] || ''}`;

    const expText = document.getElementById('sol-explanation-text');
    if(expText) expText.innerHTML = renderMarkdownLite(q.explanation || 'No explanation available.');

    renderSolutionDetailNav(i);
    if(typeof renderMath === 'function') renderMath(document.getElementById('solution-detail-overlay'));
  }

  // 3. 'View Solution' button click hone par chalega
  function revealCurrentSolution() {
    const revealBox = document.getElementById('solution-reveal-box');
    const btnContainer = document.getElementById('view-solution-btn-container');
    
    if(revealBox) revealBox.style.display = 'block';
    if(btnContainer) btnContainer.style.display = 'none';
  }

  // 4. Prev / Next Navigation buttons ke liye
  function prevSolutionQuestion() {
    if (currentSolutionIndex > 0) {
      renderSolutionQuestionView(currentSolutionIndex - 1);
    }
  }

  function nextSolutionQuestion() {
    if (currentSolutionIndex < rawQuizData.length - 1) {
      renderSolutionQuestionView(currentSolutionIndex + 1);
    }
  }

  function closeSolutionDetail() {
    const overlay = document.getElementById('solution-detail-overlay');
    if(overlay) overlay.classList.remove('active');
  }

  function renderSolutionDetailNav(activeIdx) {
    const nav = document.getElementById('sol-detail-nav');
    if(!nav) return;
    nav.innerHTML = rawQuizData.map((q, i) => {
      const st = userState[i] || {};
      const unattempted = !st.selectedOption;
      const correct = st.selectedOption === q.correct;
      let bg = "#e2e8f0";
      let color = "#000";
      if(!unattempted) {
        bg = correct ? "#22c55e" : "#ef4444";
        color = "#fff";
      }
      return `<div onclick="MockPanel.openSolutionDetail(${i})" style="min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: ${bg}; color: ${color}; font-weight: 600; font-size: 0.85rem; cursor: pointer; ${i === activeIdx ? 'border: 2px solid #0f172a;' : ''}">${i + 1}</div>`;
    }).join('');
  }


    return {
    init, openLevel2, openLevel3, startMock, loadQuestion, selectOption,
    saveAndNext, submitExam, goToHome, goBackStep, promptUserEmail,
    openAttemptedList, exitToHome, toggleDrawer, clearResponse,
    markReview, prevQuestion, reattemptTest, switchSection,
    switchAnalysisTab, openSolutionDetail, closeSolutionDetail, submitTestModal,
    revealCurrentSolution, prevSolutionQuestion, nextSolutionQuestion
  };

})();

// ============================================================
// 📝 3. NOTES PANEL (Independent Modules Sandbox)
// ============================================================
const NotesPanel = (() => {
  function init() {
    // Custom Notes init logic if needed
  }
  return { init };
})();

// BOOTSTRAP APP ON LOAD
document.addEventListener('DOMContentLoaded', () => {
  ControlPanel.init();
  NotesPanel.init();
});
