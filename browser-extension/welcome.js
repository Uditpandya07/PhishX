document.addEventListener('DOMContentLoaded', async () => {
  // Ensure device_uuid exists in storage
  let { deviceUuid, apiUrl = 'http://127.0.0.1:8000' } = await chrome.storage.local.get(['deviceUuid', 'apiUrl']);
  if (!deviceUuid) {
    deviceUuid = 'px_dev_' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
    await chrome.storage.local.set({ deviceUuid });
  }

  const trialModalBtn = document.getElementById('trial-modal-btn');
  const trialModal = document.getElementById('trial-modal');
  const sendOtpBtn = document.getElementById('send-otp-btn');
  const verifyOtpBtn = document.getElementById('verify-otp-btn');
  const trialFormStep = document.getElementById('trial-form-step');
  const trialOtpStep = document.getElementById('trial-otp-step');
  const statusMsg = document.getElementById('trial-status-msg');
  const otpSentMsg = document.getElementById('otp-sent-msg');

  if (trialModalBtn) {
    trialModalBtn.addEventListener('click', () => {
      trialModal.style.display = 'block';
      trialModal.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', async () => {
      const name = document.getElementById('trial-name').value.trim();
      const email = document.getElementById('trial-email').value.trim();
      const consent = document.getElementById('trial-consent').checked;

      if (!name || !email) {
        showStatus('Please enter your full name and email address.', '#f43f5e');
        return;
      }
      if (!consent) {
        showStatus('Please accept the consent terms to proceed.', '#f43f5e');
        return;
      }

      sendOtpBtn.disabled = true;
      sendOtpBtn.textContent = 'Sending OTP...';
      showStatus('Validating email and sending 6-digit code...', '#38bdf8');

      try {
        const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/trial/request-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            consent,
            device_uuid: deviceUuid
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Failed to send OTP code.');
        }

        trialFormStep.style.display = 'none';
        trialOtpStep.style.display = 'block';

        let msgText = `Verification code sent to ${email}!`;
        if (data.dev_otp_code) {
          msgText += ` (Dev OTP: ${data.dev_otp_code})`;
        }
        otpSentMsg.textContent = msgText;
        showStatus('Check your inbox for the 6-digit OTP code.', '#4ade80');

      } catch (err) {
        showStatus(err.message, '#f43f5e');
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send 6-Digit OTP Code';
      }
    });
  }

  if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', async () => {
      const email = document.getElementById('trial-email').value.trim();
      const otpCode = document.getElementById('trial-otp').value.trim();

      if (!otpCode || otpCode.length !== 6) {
        showStatus('Please enter a valid 6-digit OTP code.', '#f43f5e');
        return;
      }

      verifyOtpBtn.disabled = true;
      verifyOtpBtn.textContent = 'Verifying...';
      showStatus('Verifying code and activating trial...', '#38bdf8');

      try {
        const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/trial/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            otp_code: otpCode,
            device_uuid: deviceUuid
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Invalid OTP code.');
        }

        // Save Trial Token & Status to Chrome Local Storage
        await chrome.storage.local.set({
          trialToken: data.trial_token,
          trialEnd: data.trial_end,
          trialEmail: email
        });

        showStatus('🎉 15-Day Free Trial Activated! Closing onboarding...', '#4ade80');

        setTimeout(() => {
          if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.getCurrent) {
            chrome.tabs.getCurrent((tab) => {
              if (tab && tab.id) {
                chrome.tabs.remove(tab.id);
              } else {
                window.close();
              }
            });
          } else {
            window.close();
          }
        }, 2000);

      } catch (err) {
        showStatus(err.message, '#f43f5e');
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify & Activate 15 Days';
      }
    });
  }

  function showStatus(text, color) {
    if (statusMsg) {
      statusMsg.textContent = text;
      statusMsg.style.color = color;
    }
  }
});
