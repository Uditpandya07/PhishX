// PhishX Background Service Worker
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    const API_URL = "http://localhost:8000"; // Should be updated during build
    try {
      const { token } = await chrome.storage.local.get(['token']);
      const response = await fetch(`${API_URL}/api/v1/scans/predict`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
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
