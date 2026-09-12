export function renderSubLevels(examKey, routes, selectElement) {
  const examData = routes[examKey];
  if (!examData) return;

  selectElement.innerHTML = examData.levels
    .map(level => `<option value="${level.id}">${level.label}</option>`)
    .join('');
}

export function displayContentCard(container, data, mode) {
  if (mode === 'mocks') {
    let questionsHtml = data.questions.map((q, idx) => `
      <div class="question-block" style="margin-top: 15px; padding: 10px; border-bottom: 1px solid #eee;">
        <p><b>Q${idx + 1}: ${q.question}</b></p>
        <div class="options">
          ${q.options.map((opt, oIdx) => `
            <label style="display: block; margin: 5px 0;">
              <input type="radio" name="q_${q.id}" value="${oIdx}"> ${opt}
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="content-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2>${data.title}</h2>
          <span>⏱️ Duration: ${data.duration} Mins</span>
        </div>
        <hr>
        ${questionsHtml}
        <button style="margin-top: 20px; padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit Test</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="content-card">
        <h2>${data.title}</h2>
        <p>${data.content}</p>
      </div>
    `;
  }
}

export function displayErrorState(container, info) {
  container.innerHTML = `
    <div class="error-box" style="color: #d9534f; background: #fdf7f7; padding: 15px; border-left: 5px solid #d9534f;">
      <h3>🚫 Content Not Available</h3>
      <p>Selected material <b>(${info.exam.toUpperCase()} - ${info.level.toUpperCase()} Test #${info.testNum})</b> is not available in folder.</p>
    </div>
  `;
}
