// ============================================================
// CORE APP ENGINE — the "central traffic controller"
// ============================================================
// This file is now small and stable on purpose. It never contains
// exam questions, exam titles, or category names — all of that
// lives in /data/*.json and is fetched through data-loader.js.
//
// Adding a new exam, level, or test should NEVER require editing
// this file. If it does, something's wrong with the split.
// ============================================================

// ---- APP STATE ----
let manifestData = null;          // data/manifest.json, loaded once at startup
let currentSubCatTests = [];      // index.json contents for the currently open sub-category
let navHistoryStack = [];
let activeMainCat = null;
let activeSubCat = null;

let currentActiveTest = null;
let rawQuizData = [];
let currentQIdx = 0, overallTime = 1800, timerInterval = null;
let userState = [];
let attemptHistory = {};
let revealedSolutions = new Set(); // which solution cards user has tapped open
let registeredEmail = localStorage.getItem('user_email') || '';

// ---- FAIL-SAFE HELPERS ----
// Show a friendly full-screen message instead of a broken/blank page.
function showFailSafe(message) {
  document.querySelectorAll('.app-screen').forEach(el => el.style.display = 'none');
  document.getElementById('exam-header').style.display = 'none';
  document.getElementById('section-tabs').style.display = 'none';
  document.getElementById('exam-viewport').style.display = 'none';
  document.getElementById('exam-footer').style.display = 'none';

  document.getElementById('error-detail').innerText = message || "This section hasn't been added yet. Please check back soon.";
  document.getElementById('error-screen').style.display = 'flex';
}

// ---- STARTUP ----
async function initApp() {
  const res = await DataLoader.getManifest();
  if (!res.ok) {
    showFailSafe("Couldn't load the exam list. Please check your connection and try again.");
    console.error(res.error);
    return;
  }
  manifestData = res.data;
  goToHome();
}

// INITIALIZE CLEAN HOME SCREEN
function goToHome() {
  document.getElementById('error-screen').style.display = 'none';
  document.getElementById('home-dashboard').style.display = 'flex';

  navHistoryStack = ['level-1'];
  activeMainCat = null;
  activeSubCat = null;

  document.getElementById('nav-header-bar').style.display = 'none';
  renderLevel1();
  document.getElementById('view-level-1').style.display = 'grid';
  document.getElementById('view-level-2').style.display = 'none';
  document.getElementById('view-level-3').style.display = 'none';
}

// LEVEL 1: built entirely from data/manifest.json — add a new exam
// category there and it appears here automatically.
function renderLevel1() {
  const container = document.getElementById('view-level-1');
  if (!manifestData || !manifestData.categories || manifestData.categories.length === 0) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px; font-weight:600;">No categories configured yet.</div>`;
    return;
  }
  container.innerHTML = manifestData.categories.map(cat => `
    <div class="menu-card" onclick="openLevel2('${cat.id}')">
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

// LEVEL 2: OPEN SELECTED MAIN CATEGORY
function openLevel2(mainCatKey) {
  activeMainCat = mainCatKey;
  const catDetails = manifestData.categories.find(c => c.id === mainCatKey);

  if (!catDetails) {
    showFailSafe(`Category "${mainCatKey}" was not found in manifest.json.`);
    return;
  }

  document.getElementById('current-page-title').innerText = catDetails.title;
  document.getElementById('nav-header-bar').style.display = 'flex';

  // Render Subcategories
  const subContainer = document.getElementById('view-level-2');
  subContainer.innerHTML = catDetails.subCategories.map(sub => `
    <div class="sub-card" onclick="openLevel3('${sub.id}', '${sub.name.replace(/'/g, "\\'")}')">
      ${sub.name}
    </div>
  `).join('');

  document.getElementById('view-level-1').style.display = 'none';
  document.getElementById('view-level-2').style.display = 'grid';
  document.getElementById('view-level-3').style.display = 'none';

  navHistoryStack.push('level-2');
}

// LEVEL 3: OPEN TESTS FOR SELECTED SUB CATEGORY
// This is the auto-discovery step: it fetches data/<subCatId>/index.json,
// which is the only file you touch when adding a new test file.
async function openLevel3(subCatId, subCatName) {
  activeSubCat = subCatId;
  document.getElementById('current-page-title').innerText = subCatName;

  const testsContainer = document.getElementById('view-level-3');
  document.getElementById('view-level-1').style.display = 'none';
  document.getElementById('view-level-2').style.display = 'none';
  document.getElementById('view-level-3').style.display = 'flex';
  navHistoryStack.push('level-3');

  testsContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px;">Loading tests…</div>`;

  const res = await DataLoader.getTestIndex(subCatId);

  if (!res.ok) {
    // Fail-safe: missing/broken index.json never crashes the app —
    // it just reads as "nothing here yet".
    currentSubCatTests = [];
    testsContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px; font-weight:600;">Upcoming Mock Tests will be added soon!</div>`;
    return;
  }

  currentSubCatTests = res.data || [];

  if (currentSubCatTests.length === 0) {
    testsContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px; font-weight:600;">Upcoming Mock Tests will be added soon!</div>`;
  } else {
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
          <button class="btn btn-secondary" onclick="viewPreviousAttempt('${m.id}')">Results</button>
          <button class="btn btn-primary" onclick="startMock('${m.id}')">Start Test 🚀</button>
        </div>
      </div>
    `).join('');
  }
}

// REVERSE BACK STEP LOGIC
function goBackStep() {
  navHistoryStack.pop();
  const currentView = navHistoryStack[navHistoryStack.length - 1];

  if (currentView === 'level-1' || !currentView) {
    goToHome();
  } else if (currentView === 'level-2') {
    openLevel2(activeMainCat);
    navHistoryStack.pop(); // Remove duplicate push from openLevel2
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

// ---- Helpers: questions arrive pre-normalized from the build step,
// but we normalize again at runtime too, so a hand-edited JSON file
// with missing optional fields still can't crash the exam.
function normalizeQuestion(q) {
  return {
    ...q,
    marks: { pos: 1.0, neg: 0, ...(q.marks || {}) },
    timeAvg: q.timeAvg || "00:30",
    rightPct: q.rightPct || "--",
    explanation: q.explanation || "No explanation provided for this question yet."
  };
}

// Scans a rendered container for LaTeX written inside the JSON text
// ($...$ inline, $$...$$ block) and turns it into real math with KaTeX.
// Safe to call even before the KaTeX <script defer> tags have finished
// loading — it just silently does nothing that one time.
// Explanation text in the JSON is plain text, not real HTML — so writing
// **bold** or "- point" in the JSON did nothing before. This turns those
// into actual <strong> tags and a bulleted "Key Points" list (styled in
// style.css as .sol-key-points). LaTeX ($...$) is untouched here — KaTeX
// runs afterwards via renderMath() and finds it regardless of the tags
// this adds around it.
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
  if (!container || typeof window.renderMathInElement !== 'function') return;
  try {
    window.renderMathInElement(container, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
  } catch (e) { console.error('KaTeX render failed:', e); }
}

// START A TEST — fetches the full test file (with questions) only now,
// lazily, so browsing the test list stays fast.
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
  
  // 1. Pehle sabhi questions ko normalise kar lo
  const normalized = currentActiveTest.questions.map(normalizeQuestion);
  
  // 2. Continuous Section Sorting: Same section wale saare questions ek saath group ho jayenge
  // (Order preserved rahega bas same section ek jagah aa jayenge)
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
  document.getElementById('exam-footer').style.display = 'flex';

  reattemptTest();
}

function exitToHome() {
  clearInterval(timerInterval);
  document.getElementById('analytics-overlay').classList.remove('active');

  document.getElementById('exam-header').style.display = 'none';
  document.getElementById('section-tabs').style.display = 'none';
  document.getElementById('exam-viewport').style.display = 'none';
  document.getElementById('exam-footer').style.display = 'none';

  document.getElementById('home-dashboard').style.display = 'flex';
}

function reattemptTest() {
  clearInterval(timerInterval);
  overallTime = currentActiveTest.timeMins * 60; currentQIdx = 0;
  userState = rawQuizData.map(() => ({ selectedOption: null, status: 'not-visited' }));
  document.getElementById('analytics-overlay').classList.remove('active');
  renderSections(); loadQuestion(0); startTimers();
}

function renderSections() {
  const secs = [...new Set(rawQuizData.map(q => q.section))];
  const currentSec = rawQuizData[currentQIdx].section;
  document.getElementById('section-tabs').innerHTML = secs.map(sec => `
    <button class="tab-btn ${sec === currentSec ? 'active' : ''}" onclick="switchSection('${sec}')">${sec}</button>
  `).join('');
}

function switchSection(secName) {
  const firstIdx = rawQuizData.findIndex(q => q.section === secName);
  if (firstIdx !== -1) loadQuestion(firstIdx);
}

function loadQuestion(idx) {
  currentQIdx = idx; const q = rawQuizData[idx]; const state = userState[idx];
  if (state.status === 'not-visited') state.status = 'not-answered';

  document.getElementById('display-q-num').innerText = idx + 1;
  document.getElementById('q-text').innerHTML = q.question;
  document.getElementById('q-diagram').innerHTML = q.diagram || '';
  document.getElementById('mark-pos').innerText = q.marks.pos.toFixed(1);
  document.getElementById('mark-neg').innerText = q.marks.neg.toFixed(2);
  document.getElementById('save-next-btn').innerText = idx === rawQuizData.length - 1 ? "Save & Submit" : "Save & Next";

  document.getElementById('options-container').innerHTML = Object.keys(q.options).map(key => `
    <div class="option-card ${state.selectedOption === key ? 'selected' : ''}" onclick="selectOption('${key}')">
      <div class="option-idx">${key}</div>
      <div>${q.options[key]}</div>
    </div>
  `).join('');

  renderMath(document.getElementById('exam-viewport'));
  renderSections();
  renderPalette();
}

function selectOption(k) { userState[currentQIdx].selectedOption = k; loadQuestion(currentQIdx); }
function clearResponse() { userState[currentQIdx].selectedOption = null; loadQuestion(currentQIdx); }

function saveAndNext() {
  const state = userState[currentQIdx];
  state.status = state.selectedOption ? 'answered' : 'not-answered';
  if (currentQIdx === rawQuizData.length - 1) submitExam();
  else loadQuestion(currentQIdx + 1);
}

function markForReviewAndNext() {
  userState[currentQIdx].status = 'review';
  if (currentQIdx === rawQuizData.length - 1) submitExam();
  else loadQuestion(currentQIdx + 1);
}

function navigate(dir) {
  const n = currentQIdx + dir;
  if (n >= 0 && n < rawQuizData.length) loadQuestion(n);
}

function toggleDrawer() { document.getElementById('drawer').classList.toggle('open'); }

function renderPalette() {
  document.getElementById('palette-grid').innerHTML = userState.map((st, i) => `
    <div class="palette-node status-${st.status}" onclick="loadQuestion(${i})">${i + 1}</div>
  `).join('');
}

function startTimers() {
  timerInterval = setInterval(() => {
    if (overallTime > 0) {
      overallTime--;
      const m = String(Math.floor(overallTime / 60)).padStart(2, '0');
      const s = String(overallTime % 60).padStart(2, '0');
      document.getElementById('overall-timer').innerText = `00:${m}:${s}`;
    } else submitExam();
  }, 1000);
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
  userState = data.userState;
  rawQuizData = data.questionsData;
  revealedSolutions = new Set();

  document.getElementById('res-score').innerText = data.score;
  document.getElementById('res-max-score').innerText = data.maxScore;
  document.getElementById('res-accuracy').innerText = data.accuracy;
  document.getElementById('res-rank').innerText = data.rank;
  document.getElementById('res-percentile').innerText = data.percentile;

  document.getElementById('cnt-all').innerText = rawQuizData.length;
  document.getElementById('cnt-correct').innerText = data.correct;
  document.getElementById('cnt-incorrect').innerText = data.incorrect;
  document.getElementById('cnt-unattempted').innerText = data.unattempted;

  renderSectionalSummary();
  renderSolutions('all');

  document.getElementById('analytics-overlay').classList.add('active');
}

function switchAnalyticsTab(tab) {
  document.querySelectorAll('.top-nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-btn-${tab}`).classList.add('active');

  document.getElementById('tab-analysis').style.display = tab === 'analysis' ? 'block' : 'none';
  document.getElementById('tab-solutions').style.display = tab === 'solutions' ? 'block' : 'none';
}

function renderSectionalSummary() {
  const secs = [...new Set(rawQuizData.map(q => q.section))];
  document.getElementById('sectional-summary-list').innerHTML = secs.map(sec => {
    let secScore = 0, maxSec = 0;
    rawQuizData.forEach((q, i) => {
      if (q.section !== sec) return;
      maxSec += q.marks.pos;
      const sel = userState[i].selectedOption;
      if (sel === q.correct) secScore += q.marks.pos;
      else if (sel) secScore -= q.marks.neg;
    });
    const pct = Math.max(0, (secScore / maxSec) * 100);

    return `
      <div style="margin-bottom:8px; background:#fff; border:1px solid var(--card-border); border-radius:8px; padding:10px;">
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700;">
          <span>${sec}</span>
          <span>${secScore.toFixed(1)} / ${maxSec}</span>
        </div>
        <div style="background:#e2e8f0; height:6px; border-radius:3px; overflow:hidden; margin-top:6px;">
          <div style="background:var(--primary); height:100%; width:${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

// currentSolutionFilter tracks which pill is active, purely so the list
// re-renders correctly after coming back from the detail view.
let currentSolutionFilter = 'all';
let solutionDetailIdx = 0;      // which question the full-screen detail view is showing
let swipeHandlersAttached = false;
let touchStartX = null;

// The Solutions tab itself is just a light list of question previews now —
// tapping a card opens the full-screen detail view (openSolutionDetail),
// which is where the actual "View Solution" reveal + scrolling happens.
function renderSolutions(filter) {
  currentSolutionFilter = filter;
  const container = document.getElementById('solutions-list-container');
  container.innerHTML = rawQuizData.map((q, i) => {
    const state = userState[i];
    const isCorrect = state.selectedOption === q.correct;
    const isUnattempted = !state.selectedOption;

    if (filter === 'correct' && !isCorrect) return '';
    if (filter === 'incorrect' && (isCorrect || isUnattempted)) return '';
    if (filter === 'unattempted' && !isUnattempted) return '';

    return `
      <div class="sol-card" onclick="openSolutionDetail(${i})" style="cursor:pointer;">
        <div class="sol-card-header">
          <span>⏱️ Time: ${q.timeAvg} | 🎯 ${q.rightPct} got it right</span>
          <span class="sol-badge" style="background:${isCorrect ? '#dcfce7' : isUnattempted ? '#f1f5f9' : '#fee2e2'}; color:${isCorrect ? '#166534' : isUnattempted ? '#475569' : '#991b1b'}">
            ${isCorrect ? 'Correct' : isUnattempted ? 'Unattempted' : 'Incorrect'}
          </span>
        </div>
        <div class="sol-card-text">Q${i + 1}. ${q.question}</div>
      </div>
    `;
  }).join('');
  renderMath(container);
}

function filterSolutions(type) {
  document.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderSolutions(type);
}

// ---- FULL-SCREEN SOLUTION DETAIL VIEW ----
// Opened from a tap on a Solutions card. Has its own question-number nav
// (like the exam palette) plus a scrollable body, so navigating between
// questions or reading a long solution never overlaps anything else.

function openSolutionDetail(i) {
  solutionDetailIdx = i;
  document.getElementById('solution-detail-overlay').classList.add('active');
  attachSolutionSwipeHandlers();
  renderSolutionDetailNav();
  renderSolutionDetailBody();
}

function closeSolutionDetail() {
  document.getElementById('solution-detail-overlay').classList.remove('active');
}

function renderSolutionDetailNav() {
  const nav = document.getElementById('sol-detail-nav');
  nav.innerHTML = rawQuizData.map((q, i) => {
    const st = userState[i];
    const unattempted = !st.selectedOption;
    const correct = st.selectedOption === q.correct;
    const cls = unattempted ? 'nav-unattempted' : (correct ? 'nav-correct' : 'nav-incorrect');
    return `<div class="sol-nav-node ${cls} ${i === solutionDetailIdx ? 'active' : ''}" onclick="goToSolutionDetail(${i})">${i + 1}</div>`;
  }).join('');

  const activeNode = nav.querySelector('.active');
  if (activeNode) activeNode.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
}

function goToSolutionDetail(i) {
  solutionDetailIdx = i;
  renderSolutionDetailNav();
  renderSolutionDetailBody();
}

function stepSolutionDetail(dir) {
  const n = solutionDetailIdx + dir;
  if (n >= 0 && n < rawQuizData.length) goToSolutionDetail(n);
}

function renderSolutionDetailBody() {
  const i = solutionDetailIdx;
  const q = rawQuizData[i];
  const state = userState[i];
  const isCorrect = state.selectedOption === q.correct;
  const isOpen = revealedSolutions.has(i);

  const optionsHtml = Object.keys(q.options).map(k => {
    const cls = isOpen
      ? (k === q.correct ? 'is-correct' : (state.selectedOption === k && !isCorrect ? 'is-user-wrong' : ''))
      : '';
    return `
      <div class="sol-opt-item ${cls}">
        <strong>${k}:</strong> ${q.options[k]} ${isOpen && k === q.correct ? '✅' : ''}
      </div>
    `;
  }).join('');

  const body = document.getElementById('sol-detail-body');
  body.innerHTML = `
    <div class="sol-detail-meta">⏱️ Time: ${q.timeAvg} | 🎯 ${q.rightPct} got it right</div>
    <div class="sol-detail-question">Q${i + 1}. ${q.question}</div>
    ${q.diagram ? `<div style="margin:10px 0;">${q.diagram}</div>` : ''}
    <div class="sol-opt-list">${optionsHtml}</div>
    ${isOpen ? `
      <div class="sol-detail-answer">
        <span>✅ Correct Answer: <u>${q.correct}: ${q.options[q.correct]}</u></span>
        <span class="sol-detail-pct">${q.rightPct} got this right</span>
      </div>
      <div class="sol-detail-solution-box">
        <div class="sol-detail-solution-title">💡 SOLUTION</div>
        <div class="sol-exp-box">${renderMarkdownLite(q.explanation)}</div>
      </div>
    ` : `
      <button class="btn btn-primary sol-detail-viewbtn" onclick="revealSolution(${i})">View Solution</button>
    `}
    <div class="sol-detail-nav-buttons">
      <button class="btn btn-secondary" onclick="stepSolutionDetail(-1)" ${i === 0 ? 'disabled' : ''}>⬅ Prev</button>
      <button class="btn btn-secondary" onclick="stepSolutionDetail(1)" ${i === rawQuizData.length - 1 ? 'disabled' : ''}>Next ➔</button>
    </div>
  `;
  body.scrollTop = 0; // jump back to top whenever we switch questions
  renderMath(body);
}

// Marks a question's answer as revealed and refreshes just the detail body
// (the nav dots don't need to change for a reveal).
function revealSolution(i) {
  revealedSolutions.add(i);
  renderSolutionDetailBody();
}

// Left/right swipe on the body moves to the next/previous question —
// attached once, since the container div itself is never replaced.
function attachSolutionSwipeHandlers() {
  if (swipeHandlersAttached) return;
  swipeHandlersAttached = true;
  const body = document.getElementById('sol-detail-body');
  body.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
  body.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) {
      if (dx < 0) stepSolutionDetail(1);
      else stepSolutionDetail(-1);
    }
    touchStartX = null;
  });
}

// START APPLICATION
initApp();
