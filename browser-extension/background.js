// PhishX Background Service Worker
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/scans/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tab.url })
      });
      
      const data = await response.json();
      const isDanger = data.prediction === 'Phishing';
      
      // Update badge
      chrome.action.setBadgeText({
        text: isDanger ? '!' : '',
        tabId: tabId
      });
      
      chrome.action.setBadgeBackgroundColor({
        color: isDanger ? '#ef4444' : '#4ade80',
        tabId: tabId
      });

    } catch (err) {
      console.error('PhishX background scan failed:', err);
    }
  }
});
