// PhishX Content Script: Input Field Monitoring

let domainScanned = false;
let isPhishingSite = false;

// Listen for password input fields
document.addEventListener('focusin', async (e) => {
  if (e.target.tagName === 'INPUT' && e.target.type === 'password') {
    if (!domainScanned) {
      // If we haven't verified this domain yet, show a small caution toast
      showInputWarning("PhishX: Verifying site security before you enter your password...", "warning");
      
      // Perform a quick check via the background script
      chrome.runtime.sendMessage({ action: "scanCurrentUrl", url: window.location.href }, (response) => {
        domainScanned = true;
        if (response && response.prediction === 'Phishing') {
          isPhishingSite = true;
          showInputWarning("🚨 PHISHING DETECTED! Do NOT enter your password on this site!", "danger");
          e.target.blur(); // Unfocus the password field to protect the user
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

// ----------------------------------------------------
// PHASE 2: DOM Link Defanging (Inline Link Scanning)
// ----------------------------------------------------

// To avoid overloading the backend and the browser, we scan links on hover rather than all at once.
let scannedLinks = new Map();

document.addEventListener('mouseover', (e) => {
  let target = e.target;
  // Traverse up to find the anchor tag if hovering over an inner element
  while (target && target.tagName !== 'A') {
    target = target.parentElement;
  }
  
  if (target && target.href && target.href.startsWith('http')) {
    const url = target.href;
    
    // Check if we already scanned this link
    if (scannedLinks.has(url)) return;
    
    scannedLinks.set(url, 'scanning');
    
    // Add visual indicator that we are scanning (subtle dashed underline)
    target.style.borderBottom = '1px dashed #94a3b8';
    target.title = 'PhishX: Scanning link...';
    
    chrome.runtime.sendMessage({ action: "scanCurrentUrl", url: url }, (response) => {
      if (response && response.prediction === 'Phishing') {
        scannedLinks.set(url, 'phishing');
        // Defang the link visually and functionally
        target.style.color = '#e11d48';
        target.style.textDecoration = 'line-through';
        target.style.borderBottom = 'none';
        target.title = `🚨 PHISHING LINK: ${Math.round(response.risk_score)}% Risk Score. Do not click!`;
        
        target.addEventListener('click', (ev) => {
          if (!confirm(`🚨 WARNING! PhishX flagged this link as a Phishing threat (${Math.round(response.risk_score)}% risk).\n\nAre you sure you want to visit:\n${url}`)) {
            ev.preventDefault();
            ev.stopPropagation();
          }
        }, { capture: true });
        
      } else {
        scannedLinks.set(url, 'safe');
        target.style.borderBottom = 'none';
        target.title = `✅ PhishX Verified Safe Link`;
      }
    });
  }
});
