document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load existing API Key from chrome.storage
  chrome.storage.sync.get(['openaiKey'], (result) => {
    if (result.openaiKey) {
      apiKeyInput.value = result.openaiKey;
    }
  });

  // Save new API Key
  saveBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      statusDiv.style.color = '#f44336';
      statusDiv.innerText = 'Please enter a valid key.';
      return;
    }

    chrome.storage.sync.set({ openaiKey: key }, () => {
      statusDiv.style.color = '#4caf50';
      statusDiv.innerText = 'Key saved successfully!';
      setTimeout(() => { statusDiv.innerText = ''; }, 3000);
    });
  });
});