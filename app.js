import { EXAM_ROUTES } from './config/exam-routes.js';
import { fetchDynamicData } from './modules/data-loader.js';

const modeSelect = document.getElementById('mode-select');
const examSelect = document.getElementById('exam-select');
const levelSelect = document.getElementById('level-select');
const testNumInput = document.getElementById('test-num');
const loadBtn = document.getElementById('load-btn');
const container = document.getElementById('display-container');

// 1. Dynamic Dropdown Population
function populateExams() {
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
}

examSelect.addEventListener('change', updateLevels);

// 2. Dynamic Content Renderer
function renderContent(data, mode) {
  if (mode === 'mocks') {
    const qList = data.questions ? data.questions.map((q, i) => `
      <div class="question-item">
        <p><b>Q${i+1}: ${q.question}</b></p>
        ${q.options.map((opt, optIdx) => `
          <label class="option-label">
            <input type="radio" name="q_${q.id}" value="${optIdx}"> ${opt}
          </label>
        `).join('')}
      </div>
    `).join('') : '<p>No questions found in file.</p>';

    container.innerHTML = `
      <h3>${data.title}</h3>
      <p style="margin-bottom: 15px; color: #666;">Duration: ${data.durationMinutes || 60} mins</p>
      ${qList}
    `;
  } else {
    container.innerHTML = `
      <h3>${data.title}</h3>
      <div style="margin-top:10px;">${data.contentHtml || 'No content uploaded.'}</div>
    `;
  }
}

function renderError(info) {
  container.innerHTML = `
    <div class="error-box">
      <h4>🚫 Content Not Uploaded</h4>
      <p style="margin-top: 5px;">File for <b>${info.exam.toUpperCase()} - ${info.level.toUpperCase()} (Test #${info.testNum})</b> does not exist in <code>/data/${info.mode}/</code>.</p>
    </div>
  `;
}

// 3. Load Action
loadBtn.addEventListener('click', async () => {
  const state = {
    mode: modeSelect.value,
    exam: examSelect.value,
    level: levelSelect.value,
    testNum: testNumInput.value
  };

  container.innerHTML = "<p>Loading data...</p>";

  const res = await fetchDynamicData(state.mode, state.exam, state.level, state.testNum);

  if (res.success) {
    renderContent(res.data, state.mode);
  } else {
    renderError(state);
  }
});

// Init on boot
populateExams();
