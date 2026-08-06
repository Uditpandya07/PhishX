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

      const { alertDuration = '8000', desktopAlerts = true } = await chrome.storage.local.get(['alertDuration', 'desktopAlerts']);
      const durationMs = alertDuration === 'permanent' ? 0 : parseInt(alertDuration, 10);

      if (isPhishing && desktopAlerts) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'logo.png',
          title: '🚨 PhishX Threat Alert!',
          message: `Phishing link intercepted! Risk Score: ${riskScore}%. Do not click!`
        });
      }

      // Inject sleek DOM overlay
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (isPhish, url, risk, dur) => {
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
          if (dur > 0) {
            setTimeout(() => { if(div.parentElement) div.remove(); }, dur);
          }
        },
        args: [isPhishing, info.linkUrl, riskScore, durationMs]
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
    // Check autoScan setting
    const { autoScan = true, desktopAlerts = true } = await chrome.storage.local.get(['autoScan', 'desktopAlerts']);
    if (!autoScan) return;

    try {
      const result = await scanUrl(tab.url);
      const isDanger = result.prediction === 'Phishing';
      const riskScore = Math.round(result.risk_score || 0);

      // Update badge
      chrome.action.setBadgeText({
        text: isDanger ? '!' : '',
        tabId: tabId
      });
      
      chrome.action.setBadgeBackgroundColor({
        color: isDanger ? '#ef4444' : '#4ade80',
        tabId: tabId
      });

      if (isDanger && desktopAlerts) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'logo.png',
          title: '🚨 PhishX Threat Intercepted',
          message: `Warning: This page is flagged as Phishing (${riskScore}% Risk Level).`
        });
      }

    } catch (err) {
      console.error('PhishX background scan failed:', err);
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
    return true; // Keep channel open
  }
});

// Core Scanning Logic with Whitelist/Blacklist/Sensitivity Checks
async function scanUrl(urlToScan) {
  const { 
    apiUrl = 'http://127.0.0.1:8000', 
    apiToken = '', 
    trialToken = '', 
    deviceUuid = '',
    customWhitelist = '',
    customBlacklist = '',
    sensitivity = 'standard'
  } = await chrome.storage.local.get(['apiUrl', 'apiToken', 'trialToken', 'deviceUuid', 'customWhitelist', 'customBlacklist', 'sensitivity']);
  
  const cleanUrl = urlToScan.trim().toLowerCase();
  let domain = cleanUrl;
  try {
    domain = new URL(cleanUrl).hostname;
  } catch (e) {}

  // 1. Check Custom Whitelist
  if (customWhitelist) {
    const wDomains = customWhitelist.split(/[\n,]/).map(d => d.trim().toLowerCase()).filter(Boolean);
    if (wDomains.some(w => domain === w || domain.endsWith('.' + w))) {
      return { url: urlToScan, prediction: 'Safe', risk_score: 0.0, features: { custom_whitelist: true } };
    }
  }

  // 2. Check Custom Blacklist
  if (customBlacklist) {
    const bDomains = customBlacklist.split(/[\n,]/).map(d => d.trim().toLowerCase()).filter(Boolean);
    if (bDomains.some(b => domain === b || domain.endsWith('.' + b))) {
      return { url: urlToScan, prediction: 'Phishing', risk_score: 100.0, features: { custom_blacklist: true } };
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Sensitivity': sensitivity
  };

  if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`;
  if (trialToken) headers['X-Trial-Token'] = trialToken;
  if (deviceUuid) headers['X-Device-UUID'] = deviceUuid;

  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/scans/predict`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url: urlToScan })
  });
  
  if (!response.ok) {
    if (response.status === 402) {
      throw new Error('Trial Expired. Please upgrade to PhishX Pro.');
    }
    throw new Error('API Error');
  }
  
  const rawData = await response.json();
  const data = rawData.result || rawData;

  // Apply Sensitivity Threshold Override if specified
  const thresholdMap = { 'aggressive': 70, 'standard': 80, 'strict': 90 };
  const targetThreshold = thresholdMap[sensitivity] || 80;
  if (data.risk_score !== undefined) {
    data.prediction = data.risk_score >= targetThreshold ? 'Phishing' : 'Safe';
  }

  return data;
}
