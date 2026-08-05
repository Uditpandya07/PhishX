document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  restoreOptions();
  checkTrialStatus();

  document.getElementById('saveBtn').addEventListener('click', saveOptions);
  document.getElementById('backBtn').addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  });
});

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      document.getElementById(`tab-${target}`).classList.add('active');
    });
  });
}

function saveOptions() {
  const settings = {
    autoScan: document.getElementById('autoScan').checked,
    linkDefanging: document.getElementById('linkDefanging').checked,
    inputShield: document.getElementById('inputShield').checked,
    sensitivity: document.getElementById('sensitivity').value,
    desktopAlerts: document.getElementById('desktopAlerts').checked,
    soundAlerts: document.getElementById('soundAlerts').checked,
    alertDuration: document.getElementById('alertDuration').value,
    customWhitelist: document.getElementById('customWhitelist').value.trim(),
    customBlacklist: document.getElementById('customBlacklist').value.trim(),
    apiUrl: document.getElementById('apiUrl').value.trim() || 'http://127.0.0.1:8000',
    apiToken: document.getElementById('apiToken').value.trim()
  };

  chrome.storage.local.set(settings, () => {
    const toast = document.getElementById('status-toast');
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 2500);
  });
}

function restoreOptions() {
  const defaults = {
    autoScan: true,
    linkDefanging: true,
    inputShield: true,
    sensitivity: 'standard',
    desktopAlerts: true,
    soundAlerts: false,
    alertDuration: '8000',
    customWhitelist: '',
    customBlacklist: '',
    apiUrl: 'http://127.0.0.1:8000',
    apiToken: ''
  };

  chrome.storage.local.get(defaults, (items) => {
    document.getElementById('autoScan').checked = items.autoScan;
    document.getElementById('linkDefanging').checked = items.linkDefanging;
    document.getElementById('inputShield').checked = items.inputShield;
    document.getElementById('sensitivity').value = items.sensitivity;
    document.getElementById('desktopAlerts').checked = items.desktopAlerts;
    document.getElementById('soundAlerts').checked = items.soundAlerts;
    document.getElementById('alertDuration').value = items.alertDuration;
    document.getElementById('customWhitelist').value = items.customWhitelist;
    document.getElementById('customBlacklist').value = items.customBlacklist;
    document.getElementById('apiUrl').value = items.apiUrl;
    document.getElementById('apiToken').value = items.apiToken;
  });
}

async function checkTrialStatus() {
  const badgeTitle = document.getElementById('trial-badge-title');
  const badgeDesc = document.getElementById('trial-badge-desc');

  try {
    const { trialToken, deviceUuid, apiUrl = 'http://127.0.0.1:8000' } = await chrome.storage.local.get(['trialToken', 'deviceUuid', 'apiUrl']);
    if (trialToken || deviceUuid) {
      const param = trialToken ? `trial_token=${trialToken}` : `device_uuid=${deviceUuid}`;
      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/trial/status?${param}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'active') {
          badgeTitle.textContent = `15-Day Trial Active (${data.days_remaining} Days Remaining)`;
          badgeDesc.textContent = `Trial registered for ${data.email || 'your device'}. Full AI protection enabled.`;
        } else if (data.status === 'expired') {
          badgeTitle.textContent = `15-Day Trial Expired`;
          badgeTitle.style.color = '#f43f5e';
          badgeDesc.textContent = `Your trial period has ended. Upgrade to Pro for unlimited scanning.`;
        }
      }
    }
  } catch (e) {
    console.log('Trial status offline check');
  }
}
