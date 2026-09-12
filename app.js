import { EXAM_ROUTES } from './config/exam-routes.js';
import { fetchDynamicData } from './modules/data-loader.js';
import { renderSubLevels, displayContentCard, displayErrorState } from './modules/ui-render.js';

const examSelect = document.getElementById('exam-select');
const levelSelect = document.getElementById('level-select');
const loadBtn = document.getElementById('load-btn');
const container = document.getElementById('display-container');

// 1. Auto Sync Dropdowns (Exam change hone par Level auto update honge)
examSelect.addEventListener('change', () => {
  renderSubLevels(examSelect.value, EXAM_ROUTES, levelSelect);
});

// Initialize sub-levels first time
renderSubLevels(examSelect.value, EXAM_ROUTES, levelSelect);

// 2. Load Content Click Handler
loadBtn.addEventListener('click', async () => {
  const state = {
    mode: document.getElementById('mode-select').value,
    exam: examSelect.value,
    level: levelSelect.value,
    testNum: document.getElementById('test-num').value
  };

  container.innerHTML = "<p>Searching file in system...</p>";

  const response = await fetchDynamicData(state.mode, state.exam, state.level, state.testNum);

  if (response.success) {
    displayContentCard(container, response.data, state.mode);
  } else {
    displayErrorState(container, state);
  }
});
