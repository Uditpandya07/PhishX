document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);
document.getElementById('backBtn').addEventListener('click', () => {
  window.close();
});

function saveOptions() {
  const apiUrl = document.getElementById('apiUrl').value.trim();
  const apiToken = document.getElementById('apiToken').value.trim();

  chrome.storage.local.set(
    { apiUrl, apiToken },
    () => {
      const status = document.getElementById('status');
      status.style.opacity = 1;
      setTimeout(() => {
        status.style.opacity = 0;
      }, 2000);
    }
  );
}

function restoreOptions() {
  chrome.storage.local.get(
    { apiUrl: 'http://127.0.0.1:8000', apiToken: '' },
    (items) => {
      document.getElementById('apiUrl').value = items.apiUrl;
      document.getElementById('apiToken').value = items.apiToken;
    }
  );
}
