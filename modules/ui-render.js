export function displayContentCard(container, data, mode) {
  container.innerHTML = `
    <div class="content-card">
      <h2>${data.title}</h2>
      <p>Data successfully loaded via Central Coordinator! 🎉</p>
    </div>
  `;
}

export function displayErrorState(container, info) {
  container.innerHTML = `
    <div class="error-box">
      <h3>🚫 Content Not Found</h3>
      <p>File for <b>${info.exam.toUpperCase()} - ${info.level} (Test #${info.testNum})</b> is not available in <code>/data/${info.mode}/</code>.</p>
    </div>
  `;
}
