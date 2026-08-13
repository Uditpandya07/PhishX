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
        func: (isPhish, url, risk, dur, enableLiveAI, explanation) => {
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
          div.style.maxWidth = '350px';
          
          let aiSection = '';
          if (isPhish && enableLiveAI) {
            aiSection = `
              <div style="margin-top:15px; border-top: 1px solid rgba(255,255,255,0.2); padding-top:10px;">
                <p style="font-size:13px; font-style:italic; margin:0 0 10px 0;">✨ <strong>AI Analysis:</strong> ${explanation || 'Analyzing...'}</p>
                <div id="px-chat-history" style="max-height:100px; overflow-y:auto; font-size:12px; margin-bottom:10px; background:rgba(0,0,0,0.2); padding:8px; border-radius:6px; display:none;"></div>
                <div style="display:flex; gap:8px;">
                  <input type="text" id="px-chat-input" placeholder="Ask AI about this threat..." style="flex:1; padding:6px; border-radius:4px; border:none; outline:none; font-size:12px;">
                  <button id="px-chat-send" style="padding:6px 10px; background:#3b82f6; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:12px;">Ask</button>
                </div>
              </div>
            `;
          }

          div.innerHTML = `
            <h3 style="margin:0 0 10px 0; font-size:16px;">PhishX Scan Result</h3>
            <p style="margin:0; font-size:14px; line-height:1.4;">
              ${isPhish ? `<strong>⚠️ PHISHING DETECTED</strong><br>Risk Score: ${risk}%<br>Do not click or enter credentials on this link!` : `<strong>✅ SAFE LINK</strong><br>This URL appears to be safe.`}
            </p>
            ${aiSection}
            <button style="margin-top:15px; padding:8px 16px; border:none; border-radius:6px; background:rgba(0,0,0,0.2); color:#fff; cursor:pointer;" onclick="this.parentElement.remove()">Dismiss</button>
          `;
          document.body.appendChild(div);

          if (isPhish && enableLiveAI) {
            let chatHistory = [];
            const sendBtn = div.querySelector('#px-chat-send');
            const inputEl = div.querySelector('#px-chat-input');
            const historyEl = div.querySelector('#px-chat-history');

            const sendMessage = () => {
              const msg = inputEl.value.trim();
              if (!msg) return;
              
              historyEl.style.display = 'block';
              const userMsgEl = document.createElement('div');
              userMsgEl.style.marginBottom = '4px';
              const userLabelEl = document.createElement('strong');
              userLabelEl.textContent = 'You: ';
              userMsgEl.appendChild(userLabelEl);
              userMsgEl.appendChild(document.createTextNode(msg));
              historyEl.appendChild(userMsgEl);
              inputEl.value = '';
              sendBtn.innerText = '...';
              sendBtn.disabled = true;

              chrome.runtime.sendMessage({
                action: "sendChatMessage",
                payload: {
                  url: url,
                  risk_score: risk,
                  features: {},
                  history: chatHistory,
                  message: msg
                }
              }, (response) => {
                sendBtn.innerText = 'Ask';
                sendBtn.disabled = false;
                
                if (response && response.reply) {
                  const aiMsgEl = document.createElement('div');
                  aiMsgEl.style.marginBottom = '4px';
                  aiMsgEl.style.color = '#a7f3d0';
                  const aiLabelEl = document.createElement('strong');
                  aiLabelEl.textContent = 'AI: ';
                  aiMsgEl.appendChild(aiLabelEl);
                  aiMsgEl.appendChild(document.createTextNode(response.reply));
                  historyEl.appendChild(aiMsgEl);
                  chatHistory.push({ role: 'user', content: msg });
                  chatHistory.push({ role: 'model', content: response.reply });
                } else {
                  historyEl.innerHTML += `<div style="margin-bottom:4px; color:#fca5a5;"><strong>Error:</strong> Failed to connect to AI.</div>`;
                }
                historyEl.scrollTop = historyEl.scrollHeight;
              });
            };

            sendBtn.onclick = sendMessage;
            inputEl.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
          }

          if (dur > 0 && (!isPhish || !enableLiveAI)) {
            // Only auto-dismiss if AI chat is NOT active
            setTimeout(() => { if(div.parentElement) div.remove(); }, dur);
          }
        },
        args: [isPhishing, info.linkUrl, riskScore, durationMs, result.enableLiveAI || false, result.features?.ai_explanation || ""]
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
      .then(result => {
        chrome.storage.local.get(['enableLiveAI'], (items) => {
          result.enableLiveAI = !!items.enableLiveAI;
          sendResponse(result);
        });
      })
      .catch(err => {
        console.error('Background scan error:', err);
        sendResponse({ error: 'API Error' });
      });
    return true; // Keep channel open
  }

  if (request.action === "sendChatMessage") {
    sendChatMessage(request.payload)
      .then(reply => sendResponse(reply))
      .catch(err => {
        console.error('Chat proxy error:', err);
        sendResponse({ error: 'Chat API Error' });
      });
    return true; // Keep channel open
  }
});

async function sendChatMessage(payload) {
  const { apiUrl = 'http://127.0.0.1:8000', apiToken = '', trialToken = '', deviceUuid = '' } = await chrome.storage.local.get(['apiUrl', 'apiToken', 'trialToken', 'deviceUuid']);
  
  const headers = {
    'Content-Type': 'application/json'
  };

  if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`;
  if (trialToken) headers['X-Trial-Token'] = trialToken;
  if (deviceUuid) headers['X-Device-UUID'] = deviceUuid;

  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/chat/message`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Chat API Error');
  }

  return await response.json();
}

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
