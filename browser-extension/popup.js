document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const urlDisplay = document.getElementById('url-display');
  const scanBtn = document.getElementById('scan-now');
  const btnText = document.getElementById('btn-text');
  const resultBox = document.getElementById('result-box');
  const predictionBox = document.getElementById('prediction');
  const featuresList = document.getElementById('features-list');
  const gaugeContainer = document.getElementById('gauge-container');
  const loadingContainer = document.getElementById('loading-container');
  const gaugeProgress = document.getElementById('gauge-progress');
  const gaugeValue = document.getElementById('gauge-value');
  const settingsBtn = document.getElementById('settings-btn');

  if (tab && tab.url) {
    try {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:') || tab.url.startsWith('file://')) {
        urlDisplay.textContent = tab.url.replace(/^https?:\/\//, '');
      } else {
        urlDisplay.textContent = new URL(tab.url).hostname;
      }
    } catch (e) {
      urlDisplay.textContent = tab.url.substring(0, 30) + '...';
    }
  }

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  const accountBtn = document.getElementById('account-btn');
  if (accountBtn) {
    accountBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://phishx-app.vercel.app/' });
    });
  }

  // Check Trial Status
  try {
    const { trialToken, deviceUuid, apiUrl = 'http://127.0.0.1:8000' } = await chrome.storage.local.get(['trialToken', 'deviceUuid', 'apiUrl']);
    if (trialToken || deviceUuid) {
      const param = trialToken ? `trial_token=${trialToken}` : `device_uuid=${deviceUuid}`;
      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/trial/status?${param}`);
      if (res.ok) {
        const tData = await res.json();
        if (tData.status === 'active') {
          const headerDiv = document.querySelector('.header');
          if (headerDiv) {
            const badge = document.createElement('div');
            badge.style.cssText = 'font-size: 0.75rem; color: #72f542; background: rgba(114, 245, 66, 0.1); border: 1px solid rgba(114, 245, 66, 0.3); padding: 2px 8px; border-radius: 12px; font-weight: bold; margin-left: 8px; align-self: center;';
            badge.textContent = `${tData.days_remaining}d Trial`;
            headerDiv.appendChild(badge);
          }
        } else if (tData.status === 'expired') {
          scanBtn.disabled = true;
          btnText.textContent = 'TRIAL EXPIRED';
          predictionBox.innerHTML = '⚠️ 15-DAY TRIAL EXPIRED<br><a href="https://phishx-app.vercel.app/?view=pricing" target="_blank" style="color: #72f542; text-decoration: underline; font-size: 0.85rem;">Click here to Upgrade to Pro</a>';
          predictionBox.style.background = 'rgba(244, 63, 94, 0.2)';
          predictionBox.style.color = '#f43f5e';
          predictionBox.style.border = '1px solid #f43f5e';
          resultBox.style.display = 'block';
        }
      }
    }
  } catch (e) {
    console.log('Trial status check offline fallback');
  }

  scanBtn.addEventListener('click', async () => {
    scanBtn.disabled = true;
    btnText.textContent = 'ANALYZING...';
    resultBox.style.display = 'none';
    gaugeContainer.style.display = 'none';
    loadingContainer.style.display = 'flex';
    
    // Reset gauge
    gaugeProgress.style.strokeDashoffset = 283;
    gaugeValue.textContent = '0%';
    
    try {
      const { apiUrl = 'http://127.0.0.1:8000', apiToken = '', trialToken = '', deviceUuid = '' } = await chrome.storage.local.get(['apiUrl', 'apiToken', 'trialToken', 'deviceUuid']);
      
      const headers = {
        'Content-Type': 'application/json'
      };
      if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`;
      if (trialToken) headers['X-Trial-Token'] = trialToken;
      if (deviceUuid) headers['X-Device-UUID'] = deviceUuid;

      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/scans/predict`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: tab.url })
      });
      
      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('Trial Expired! Upgrade to Pro');
        }
        throw new Error('API Error');
      }
      
      const rawData = await response.json();
      const data = rawData.result || rawData;
      
      // Delay slightly for premium feel
      setTimeout(() => {
        loadingContainer.style.display = 'none';
        resultBox.style.display = 'block';
        gaugeContainer.style.display = 'block';
        
        const isPhishing = data.prediction === 'Phishing';
        const riskScore = data.risk_score || 0;
        const color = isPhishing ? '#f43f5e' : '#10b981';
        
        predictionBox.innerHTML = isPhishing ? 
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> PHISHING DETECTED' : 
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> PAGE IS SAFE';
        
        predictionBox.style.background = isPhishing ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)';
        predictionBox.style.color = color;
        predictionBox.style.border = `1px solid ${color}`;
        
        // Animate SVG Gauge
        const offset = 283 - (283 * (riskScore / 100));
        setTimeout(() => {
          gaugeProgress.style.stroke = color;
          gaugeProgress.style.strokeDashoffset = offset;
          gaugeValue.style.color = color;
          
          // Animate numbers
          let current = 0;
          const target = Math.round(riskScore);
          const interval = setInterval(() => {
            if (current >= target) {
              clearInterval(interval);
              gaugeValue.textContent = `${target}%`;
            } else {
              current++;
              gaugeValue.textContent = `${current}%`;
            }
          }, 15);
        }, 100);
        
        // Populate Features
        featuresList.innerHTML = '';
        if (data.features && Object.keys(data.features).length > 0) {
          for (const [key, value] of Object.entries(data.features)) {
            const formattedKey = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const item = document.createElement('div');
            item.className = 'feature-item';
            
            let valClass = 'feature-neutral';
            let valIcon = '-';
            
            if (value === true) {
              valClass = isPhishing ? 'feature-false' : 'feature-true';
              valIcon = '✓';
            }
            if (value === false) {
              valClass = isPhishing ? 'feature-true' : 'feature-false';
              valIcon = '✗';
            }
            
            item.innerHTML = `<span>${formattedKey}</span> <strong class="${valClass}">${valIcon}</strong>`;
            featuresList.appendChild(item);
          }
        } else {
          featuresList.innerHTML = '<div style="text-align:center; padding: 10px; opacity:0.5;">No specific features triggered</div>';
        }
        
        // Show report actions
        const reportActions = document.getElementById('report-actions');
        if (reportActions) reportActions.style.display = 'flex';
        
      }, 300); // 300ms delay for premium feel

    } catch (err) {
      predictionBox.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> CONNECTION ERROR';
      predictionBox.style.background = 'rgba(245, 158, 11, 0.15)';
      predictionBox.style.color = '#f59e0b';
      predictionBox.style.border = '1px solid #f59e0b';
      featuresList.innerHTML = `<div style="text-align:center; padding: 10px; opacity:0.6;">Failed to reach API. Check settings.</div>`;
      loadingContainer.style.display = 'none';
      resultBox.style.display = 'block';
      gaugeContainer.style.display = 'none';
      if (document.getElementById('report-actions')) document.getElementById('report-actions').style.display = 'none';
    } finally {
      scanBtn.disabled = false;
      btnText.textContent = 'DEEP SCAN PAGE';
    }
  });

  // Reporting Logic
  const reportFP = document.getElementById('report-false-positive');
  const reportMP = document.getElementById('report-missed-phish');
  
  if (reportFP) {
    reportFP.addEventListener('click', () => {
      reportFP.textContent = 'Reported! ✓';
      reportFP.style.color = '#10b981';
      setTimeout(() => { reportFP.textContent = 'Report False Positive'; reportFP.style.color = 'var(--text-muted)'; }, 3000);
    });
  }
  if (reportMP) {
    reportMP.addEventListener('click', () => {
      reportMP.textContent = 'Reported! ✓';
      reportMP.style.color = '#10b981';
      setTimeout(() => { reportMP.textContent = 'Report Missed Phish'; reportMP.style.color = 'var(--text-muted)'; }, 3000);
    });
  }
});
