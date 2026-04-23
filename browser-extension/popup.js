document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const urlDisplay = document.getElementById('url-display');
  const scanBtn = document.getElementById('scan-now');
  const resultBox = document.getElementById('result-box');
  const predictionBox = document.getElementById('prediction');

  if (tab) {
    urlDisplay.textContent = new URL(tab.url).hostname;
  }

  scanBtn.addEventListener('click', async () => {
    scanBtn.disabled = true;
    scanBtn.textContent = 'Analyzing...';
    
    try {
      // Note: In a real extension, you'd store the API key in chrome.storage
      // For this demo, we'll call the public endpoint or assume a stored key
      const response = await fetch('http://127.0.0.1:8000/api/v1/scans/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tab.url })
      });
      
      const data = await response.json();
      resultBox.style.display = 'block';
      predictionBox.textContent = data.prediction === 'Phishing' ? '🚨 PHISHING DETECTED' : '✅ PAGE IS SAFE';
      predictionBox.style.background = data.prediction === 'Phishing' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)';
      predictionBox.style.color = data.prediction === 'Phishing' ? '#ef4444' : '#4ade80';
      predictionBox.style.border = `1px solid ${data.prediction === 'Phishing' ? '#ef4444' : '#4ade80'}`;
      
    } catch (err) {
      predictionBox.textContent = 'Connection Error';
      predictionBox.style.color = '#ff9800';
      resultBox.style.display = 'block';
    } finally {
      scanBtn.disabled = false;
      scanBtn.textContent = 'Scan Current Page';
    }
  });
});
