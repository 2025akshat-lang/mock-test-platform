export async function fetchDynamicData(mode, exam, level, testNum) {
  const targetPath = `../data/${mode}/${exam}-${level}-${testNum}.js`;

  try {
    const dataModule = await import(targetPath);
    const payload = mode === 'mocks' ? dataModule.mockData : dataModule.notesData;
    
    if (!payload) return { success: false, reason: "EMPTY_PAYLOAD" };
    return { success: true, data: payload };
    
  } catch (err) {
    return { success: false, reason: "FILE_NOT_FOUND" };
  }
}
