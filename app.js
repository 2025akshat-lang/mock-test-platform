import { fetchDynamicData } from './modules/data-loader.js';
import { displayContentCard, displayErrorState } from './modules/ui-render.js';

document.getElementById('load-btn').addEventListener('click', async () => {
  const container = document.getElementById('display-container');
  
  const state = {
    mode: document.getElementById('mode-select').value,
    exam: document.getElementById('exam-select').value,
    level: document.getElementById('level-select').value,
    testNum: document.getElementById('test-num').value
  };

  container.innerHTML = "<p>Loading...</p>";

  const response = await fetchDynamicData(state.mode, state.exam, state.level, state.testNum);

  if (response.success) {
    displayContentCard(container, response.data, state.mode);
  } else {
    displayErrorState(container, state);
  }
});
