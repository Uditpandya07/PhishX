// PhishX Content Script: Input Field Monitoring

let domainScanned = false;
let isPhishingSite = false;

// Listen for password input fields
document.addEventListener('focusin', async (e) => {
  if (e.target.tagName === 'INPUT' && e.target.type === 'password') {
    // Check if Password Input Shield is enabled in storage
    const { inputShield = true } = await chrome.storage.local.get(['inputShield']);
    if (!inputShield) return;

    if (!domainScanned) {
      showInputWarning("PhishX: Verifying site security before you enter your password...", "warning");
      
      chrome.runtime.sendMessage({ action: "scanCurrentUrl", url: window.location.href }, (response) => {
        domainScanned = true;
        if (response && response.prediction === 'Phishing') {
          isPhishingSite = true;
          showInputWarning("🚨 PHISHING DETECTED! Do NOT enter your password on this site!", "danger");
          e.target.blur();
        } else if (response && response.prediction === 'Safe') {
          showInputWarning("✅ This site appears safe. You may proceed.", "safe");
          setTimeout(removeInputWarning, 3000);
        }
      });
    } else if (isPhishingSite) {
      showInputWarning("🚨 PHISHING DETECTED! Do NOT enter your password on this site!", "danger");
      e.target.blur();
    }
  }
});

function showInputWarning(message, type) {
  let warningDiv = document.getElementById('phishx-input-warning');
  if (!warningDiv) {
    warningDiv = document.createElement('div');
    warningDiv.id = 'phishx-input-warning';
    warningDiv.style.position = 'fixed';
    warningDiv.style.top = '20px';
    warningDiv.style.left = '50%';
    warningDiv.style.transform = 'translateX(-50%)';
    warningDiv.style.zIndex = '2147483647';
    warningDiv.style.padding = '12px 24px';
    warningDiv.style.borderRadius = '8px';
    warningDiv.style.fontFamily = 'system-ui, sans-serif';
    warningDiv.style.fontWeight = 'bold';
    warningDiv.style.color = '#fff';
    warningDiv.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    warningDiv.style.backdropFilter = 'blur(10px)';
    warningDiv.style.transition = 'all 0.3s ease-in-out';
    document.body.appendChild(warningDiv);
  }

  warningDiv.textContent = message;
  
  if (type === 'danger') {
    warningDiv.style.background = 'rgba(244, 63, 94, 0.95)';
    warningDiv.style.border = '1px solid #e11d48';
  } else if (type === 'safe') {
    warningDiv.style.background = 'rgba(16, 185, 129, 0.95)';
    warningDiv.style.border = '1px solid #059669';
  } else {
    warningDiv.style.background = 'rgba(245, 158, 11, 0.95)';
    warningDiv.style.border = '1px solid #d97706';
  }
}

function removeInputWarning() {
  const warningDiv = document.getElementById('phishx-input-warning');
  if (warningDiv) {
    warningDiv.remove();
  }
}
