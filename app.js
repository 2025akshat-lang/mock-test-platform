import { EXAM_ROUTES } from './config/exam-routes.js';
import { fetchDynamicData } from './modules/data-loader.js';

const modeSelect = document.getElementById('mode-select');
const examSelect = document.getElementById('exam-select');
const levelSelect = document.getElementById('level-select');
const cardsContainer = document.getElementById('cards-container');
const overlay = document.getElementById('test-overlay');
const modalContent = document.getElementById('modal-content');

// Boot Init
function init() {
  examSelect.innerHTML = Object.keys(EXAM_ROUTES).map(key => 
    `<option value="${key}">${EXAM_ROUTES[key].name}</option>`
  ).join('');
  
  updateLevels();
}

function updateLevels() {
  const selectedExam = examSelect.value;
  const levels = EXAM_ROUTES[selectedExam]?.levels || [];
  levelSelect.innerHTML = levels.map(lvl => 
    `<option value="${lvl.id}">${lvl.label}</option>`
  ).join('');
  
  renderMockCards();
}

examSelect.addEventListener('change', updateLevels);
levelSelect.addEventListener('change', renderMockCards);
modeSelect.addEventListener('change', renderMockCards);

// Auto Card Grid Generator
function renderMockCards() {
  const exam = examSelect.value;
  const levelId = levelSelect.value;
  const mode = modeSelect.value;
  
  const levelObj = EXAM_ROUTES[exam].levels.find(l => l.id === levelId);
  const totalMocks = levelObj ? levelObj.totalMocks : 1;

  let html = '';
  for(let i = 1; i <= totalMocks; i++) {
    html += `
      <div class="test-card">
        <div>
          <h4>${levelObj.label} - ${mode === 'mocks' ? 'Mock Test' : 'Notes'} ${i}</h4>
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

// Global scope attachment for inline onclicks
window.openInstructions = async function(mode, exam, level, testNum) {
  modalContent.innerHTML = "<p>Loading Test Details...</p>";
  overlay.classList.remove('hidden');

  const res = await fetchDynamicData(mode, exam, level, testNum);

  if(!res.success) {
    modalContent.innerHTML = `
      <h3>🚫 Content Not Available</h3>
      <p style="margin-top:10px;">This test file is not uploaded in server folder yet.</p>
      <button class="btn-start" style="margin-top:15px; background:#6b7280;" onclick="window.closeModal()">Close</button>
    `;
    return;
  }

  const data = res.data;

  // Render Sarkari Exam Instructions Page
  modalContent.innerHTML = `
    <h3>📋 Instructions for ${data.title}</h3>
    <ul class="instruction-list">
      <li>Total Duration: <b>${data.durationMinutes || 60} Minutes</b>.</li>
      <li>Total Questions: <b>${data.questions ? data.questions.length : 0}</b>.</li>
      <li>Each correct answer awards 2 marks. 0.50 negative marking for wrong choices.</li>
      <li>Ensure stable internet before starting the examination.</li>
    </ul>

    <div class="lang-selector">
      <label><b>Select Language / भाषा चुनें:</b></label>
      <select id="exam-lang" class="custom-select" style="margin-top:5px; height:40px;">
        <option value="en">English</option>
        <option value="hi">Hindi (हिंदी)</option>
      </select>
    </div>

    <div style="display:flex; gap:10px; margin-top:20px;">
      <button class="btn-start" style="background:#6b7280; flex:1;" onclick="window.closeModal()">Cancel</button>
      <button class="btn-start" style="flex:1;" onclick="window.startExam(${JSON.stringify(data).replace(/"/g, '&quot;')})">Start Test</button>
    </div>
  `;
};

window.closeModal = function() {
  overlay.classList.add('hidden');
};

// Start Actual Test & Submit Handler
window.startExam = function(data) {
  let questionsHtml = data.questions.map((q, idx) => `
    <div style="background:#f9fafb; padding:12px; border-radius:8px; margin-bottom:12px; border:1px solid #e5e7eb;">
      <p style="font-size:15px; margin-bottom:8px;"><b>Q${idx+1}. ${q.question}</b></p>
      ${q.options.map((opt, optIdx) => `
        <label style="display:block; padding:8px; background:#fff; margin:4px 0; border-radius:4px; border:1px solid #d1d5db;">
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
      <button type="button" class="btn-start" style="width:100%; height:48px; background:#10b981; margin-top:10px;" onclick="window.submitTest(${JSON.stringify(data.questions).replace(/"/g, '&quot;')})">Submit Test</button>
    </form>
  `;
};

window.submitTest = function(questions) {
  let score = 0;
  let attempted = 0;

  questions.forEach(q => {
    const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
    if(selected) {
      attempted++;
      if(parseInt(selected.value) === q.answer) {
        score += 2; // Correct
      } else {
        score -= 0.5; // Negative mark
      }
    }
  });

  modalContent.innerHTML = `
    <div style="text-align:center;">
      <h2>🎉 Test Submitted!</h2>
      <div style="margin:20px 0; background:#f0fdf4; padding:15px; border-radius:8px; border:1px solid #86efac;">
        <h3 style="color:#15803d;">Your Score: ${score}</h3>
        <p>Attempted: ${attempted} / ${questions.length} Questions</p>
      </div>
      <button class="btn-start" onclick="window.closeModal()">Back to Dashboard</button>
    </div>
  `;
};

init();
