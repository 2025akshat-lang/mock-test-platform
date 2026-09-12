import { EXAM_ROUTES } from './config/exam-routes.js';
import { fetchDynamicData } from './modules/data-loader.js';

// DOM Element Catchers
let modeSelect, examSelect, levelSelect, cardsContainer, overlay, modalContent;

// Execution wrapper after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  modeSelect = document.getElementById('mode-select');
  examSelect = document.getElementById('exam-select');
  levelSelect = document.getElementById('level-select');
  cardsContainer = document.getElementById('cards-container');
  overlay = document.getElementById('test-overlay');
  modalContent = document.getElementById('modal-content');

  // Step 1: Populate Primary Exam Dropdown
  populateExams();

  // Step 2: Event Listeners Binding
  examSelect.addEventListener('change', updateLevels);
  levelSelect.addEventListener('change', renderMockCards);
  modeSelect.addEventListener('change', renderMockCards);
});

// 1. Exam Populate Engine
function populateExams() {
  if (!EXAM_ROUTES || Object.keys(EXAM_ROUTES).length === 0) {
    examSelect.innerHTML = `<option value="">No Exams Configured</option>`;
    return;
  }

  examSelect.innerHTML = Object.keys(EXAM_ROUTES).map(key => 
    `<option value="${key}">${EXAM_ROUTES[key].name}</option>`
  ).join('');
  
  // Auto Trigger Child Dropdown Update
  updateLevels();
}

// 2. Sub-Level Sync Engine
function updateLevels() {
  const selectedExam = examSelect.value;
  const examData = EXAM_ROUTES[selectedExam];

  if (examData && examData.levels && examData.levels.length > 0) {
    levelSelect.innerHTML = examData.levels.map(lvl => 
      `<option value="${lvl.id}">${lvl.label}</option>`
    ).join('');
  } else {
    levelSelect.innerHTML = `<option value="">No Levels Available</option>`;
  }
  
  renderMockCards();
}

// 3. Card Renderer
function renderMockCards() {
  const exam = examSelect.value;
  const levelId = levelSelect.value;
  const mode = modeSelect.value;

  if (!exam || !levelId) {
    cardsContainer.innerHTML = `<p style="text-align:center; color:#888;">No content selected.</p>`;
    return;
  }
  
  const levelObj = EXAM_ROUTES[exam]?.levels?.find(l => l.id === levelId);
  const totalMocks = levelObj ? (levelObj.totalMocks || 1) : 1;

  let html = '';
  for(let i = 1; i <= totalMocks; i++) {
    html += `
      <div class="test-card">
        <div>
          <h4>${levelObj ? levelObj.label : 'Test'} - ${mode === 'mocks' ? 'Mock Test' : 'Notes'} ${i}</h4>
          <span style="font-size:12px; color:#6b7280;">Full Length Test</span>
        </div>
        <button class="btn-start" onclick="window.openInstructions('${mode}', '${exam}', '${levelId}', ${i})">
          ${mode === 'mocks' ? 'Attempt' : 'Read'}
        </button>
      </div>
    `;
  }
  cardsContainer.innerHTML = html;
}

// Window Global Scoped Event Handlers (Fixes Mobile Tap Event Drops)
window.openInstructions = async function(mode, exam, level, testNum) {
  modalContent.innerHTML = "<p>Loading Test Details...</p>";
  overlay.classList.remove('hidden');

  const res = await fetchDynamicData(mode, exam, level, testNum);

  if(!res || !res.success) {
    modalContent.innerHTML = `
      <h3>🚫 Content Not Available</h3>
      <p style="margin-top:10px;">File <code>/data/${mode}/${exam}-${level}-${testNum}.js</code> not found on server.</p>
      <button class="btn-start" style="margin-top:15px; background:#6b7280;" onclick="window.closeModal()">Close</button>
    `;
    return;
  }

  const data = res.data;

  // Sarkari Exam Style Instruction Screen
  modalContent.innerHTML = `
    <h3>📋 Instructions for ${data.title}</h3>
    <ul class="instruction-list">
      <li>Total Duration: <b>${data.durationMinutes || 60} Minutes</b>.</li>
      <li>Total Questions: <b>${data.questions ? data.questions.length : 0}</b>.</li>
      <li>Correct answer: +2 Marks | Wrong choice: -0.50 Marks.</li>
      <li>Do not refresh the page during exam attempt.</li>
    </ul>

    <div class="lang-selector">
      <label><b>Select Language / भाषा चुनें:</b></label>
      <select id="exam-lang" class="custom-select" style="margin-top:5px; height:44px;">
        <option value="en">English</option>
        <option value="hi">Hindi (हिंदी)</option>
      </select>
    </div>

    <div style="display:flex; gap:10px; margin-top:20px;">
      <button class="btn-start" style="background:#6b7280; flex:1;" onclick="window.closeModal()">Cancel</button>
      <button class="btn-start" style="flex:1;" id="start-test-btn">Start Test</button>
    </div>
  `;

  document.getElementById('start-test-btn').onclick = () => window.startExam(data);
};

window.closeModal = function() {
  overlay.classList.add('hidden');
};

window.startExam = function(data) {
  let questionsHtml = data.questions.map((q, idx) => `
    <div style="background:#f9fafb; padding:12px; border-radius:8px; margin-bottom:12px; border:1px solid #e5e7eb;">
      <p style="font-size:15px; margin-bottom:8px;"><b>Q${idx+1}. ${q.question}</b></p>
      ${q.options.map((opt, optIdx) => `
        <label style="display:block; padding:10px; background:#fff; margin:6px 0; border-radius:6px; border:1px solid #d1d5db;">
          <input type="radio" name="q_${q.id}" value="${optIdx}"> ${opt}
        </label>
      `).join('')}
    </div>
  `).join('');

  modalContent.innerHTML = `
    <h3>${data.title}</h3>
    <hr style="margin:10px 0;">
    <form id="mock-form">
      ${questionsHtml}
      <button type="button" id="submit-test-btn" class="btn-start" style="width:100%; height:48px; background:#10b981; margin-top:10px;">Submit Test</button>
    </form>
  `;

  document.getElementById('submit-test-btn').onclick = () => window.submitTest(data.questions);
};

window.submitTest = function(questions) {
  let score = 0;
  let attempted = 0;

  questions.forEach(q => {
    const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
    if(selected) {
      attempted++;
      if(parseInt(selected.value) === q.answer) {
        score += 2;
      } else {
        score -= 0.5;
      }
    }
  });

  modalContent.innerHTML = `
    <div style="text-align:center;">
      <h2>🎉 Test Submitted!</h2>
      <div style="margin:20px 0; background:#f0fdf4; padding:15px; border-radius:8px; border:1px solid #86efac;">
        <h3 style="color:#15803d;">Your Score: ${score} Marks</h3>
        <p>Attempted: ${attempted} / ${questions.length} Questions</p>
      </div>
      <button class="btn-start" onclick="window.closeModal()">Back to Dashboard</button>
    </div>
  `;
};
