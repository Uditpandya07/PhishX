// PhishX Background Service Worker

// Initialize Context Menu & Welcome Page
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'welcome.html' });
  }
  chrome.contextMenus.create({
    id: "scan-phishx",
    title: "Scan link with PhishX",
    contexts: ["link"]
  });
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "scan-phishx" && info.linkUrl) {
    try {
      const result = await scanUrl(info.linkUrl);
      const isPhishing = result.prediction === 'Phishing';
      const riskScore = Math.round(result.risk_score || 0);

      // Inject sleek DOM overlay instead of harsh alert()
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (isPhish, url, risk) => {
          const div = document.createElement('div');
          div.style.position = 'fixed';
          div.style.bottom = '20px';
          div.style.right = '20px';
          div.style.zIndex = '999999';
          div.style.padding = '20px';
          div.style.borderRadius = '12px';
          div.style.fontFamily = 'system-ui, sans-serif';
          div.style.color = '#fff';
          div.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
          div.style.background = isPhish ? 'rgba(244, 63, 94, 0.95)' : 'rgba(16, 185, 129, 0.95)';
          div.style.border = isPhish ? '1px solid #ef4444' : '1px solid #4ade80';
          div.style.backdropFilter = 'blur(10px)';
          div.style.maxWidth = '300px';
          
          div.innerHTML = `
            <h3 style="margin:0 0 10px 0; font-size:16px;">PhishX Scan Result</h3>
            <p style="margin:0; font-size:14px; line-height:1.4;">
              ${isPhish ? `<strong>⚠️ PHISHING DETECTED</strong><br>Risk Score: ${risk}%<br>Do not click or enter credentials on this link!` : `<strong>✅ SAFE LINK</strong><br>This URL appears to be safe.`}
            </p>
            <button style="margin-top:15px; padding:8px 16px; border:none; border-radius:6px; background:rgba(0,0,0,0.2); color:#fff; cursor:pointer;" onclick="this.parentElement.remove()">Dismiss</button>
          `;
          document.body.appendChild(div);
          setTimeout(() => { if(div.parentElement) div.remove(); }, 8000);
        },
        args: [isPhishing, info.linkUrl, riskScore]
      });
      
    } catch (e) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => alert("PhishX: Failed to scan the link. Please check your extension settings.")
      });
    }
  }
});

// Handle Tab Updates for automatic scanning
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    try {
      const result = await scanUrl(tab.url);
      const isDanger = result.prediction === 'Phishing';
      
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
      // Optional: show a small question mark if API is unreachable
      // chrome.action.setBadgeText({ text: '?', tabId: tabId });
    }
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scanCurrentUrl" && request.url) {
    scanUrl(request.url)
      .then(result => sendResponse(result))
      .catch(err => {
        console.error('Background scan error:', err);
        sendResponse({ error: 'API Error' });
      });
    return true; // Keep the message channel open for async response
  }
});

// Core Scanning Logic pulling from Storage
async function scanUrl(urlToScan) {
  const { apiUrl = 'http://127.0.0.1:8000', apiToken = '' } = await chrome.storage.local.get(['apiUrl', 'apiToken']);
  
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/scans/predict`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {})
    },
    body: JSON.stringify({ url: urlToScan })
  });
  
  if (!response.ok) {
    throw new Error('API Error');
  }
  
  return await response.json();
}
