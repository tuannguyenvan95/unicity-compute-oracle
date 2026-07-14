/* script.js */
const runBtn = document.getElementById('runBtn');
const resultDiv = document.getElementById('result');
const jsonPre = document.getElementById('jsonOutput');

runBtn.addEventListener('click', async () => {
  runBtn.disabled = true;
  runBtn.textContent = 'Running...';
  try {
    const response = await fetch('/api/run');
    const data = await response.json();
    jsonPre.textContent = JSON.stringify(data, null, 2);
    resultDiv.classList.remove('hidden');
  } catch (err) {
    jsonPre.textContent = 'Error: ' + err.message;
    resultDiv.classList.remove('hidden');
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = 'Run Cycle';
  }
});
