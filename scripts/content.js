// Wait for LeetCode page to load completely before injecting UI
window.addEventListener('load', () => {
  setTimeout(injectStudentBuddyUI, 2500);
});

function injectStudentBuddyUI() {
  if (document.getElementById('leetcode-buddy-root')) return;

  // Create Root Container
  const rootDiv = document.createElement('div');
  rootDiv.id = 'leetcode-buddy-root';

  // Attach Shadow DOM to prevent CSS leaks between LeetCode and our Widget
  const shadow = rootDiv.attachShadow({ mode: 'open' });

  // Component Layout & Styles
  shadow.innerHTML = `
    <style>
      .buddy-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        background: #ffa116;
        color: #000;
        border: none;
        padding: 12px 20px;
        border-radius: 24px;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s ease;
      }
      .buddy-fab:hover {
        transform: scale(1.05);
      }
      .buddy-panel {
        position: fixed;
        bottom: 80px;
        right: 24px;
        width: 360px;
        max-height: 500px;
        background: #1e1e1e;
        border: 1px solid #333;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6);
        display: none;
        flex-direction: column;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #e0e0e0;
        overflow: hidden;
      }
      .panel-header {
        background: #282828;
        padding: 12px 16px;
        font-weight: bold;
        color: #ffa116;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .action-btns {
        display: flex;
        gap: 6px;
        padding: 12px;
        background: #222;
        border-bottom: 1px solid #333;
      }
      .action-btns button {
        flex: 1;
        padding: 8px 4px;
        background: #333;
        color: #fff;
        border: 1px solid #444;
        border-radius: 6px;
        font-size: 11px;
        cursor: pointer;
        font-weight: 500;
      }
      .action-btns button:hover {
        background: #ffa116;
        color: #000;
      }
      .panel-body {
        padding: 16px;
        font-size: 13px;
        line-height: 1.5;
        overflow-y: auto;
        max-height: 350px;
        white-space: pre-wrap;
      }
    </style>

    <button class="buddy-fab" id="fab">🤖 Ask Buddy</button>

    <div class="buddy-panel" id="panel">
      <div class="panel-header">
        <span>💡 Student Buddy Mentor</span>
      </div>
      <div class="action-btns">
        <button id="btn-hint">💡 Get Hint</button>
        <button id="btn-debug">🐛 Debug Code</button>
        <button id="btn-complexity">⏱️ Complexity</button>
      </div>
      <div class="panel-body" id="output">
        Select an option above to get feedback from your peer mentor!
      </div>
    </div>
  `;

  document.body.appendChild(rootDiv);

  // Setup DOM references
  const fab = shadow.getElementById('fab');
  const panel = shadow.getElementById('panel');
  const output = shadow.getElementById('output');

  // Toggle Panel Visibility
  fab.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
  });

  // Event Listeners for Mentoring Modes
  shadow.getElementById('btn-hint').addEventListener('click', () => triggerMentorQuery('HINT', output));
  shadow.getElementById('btn-debug').addEventListener('click', () => triggerMentorQuery('DEBUG', output));
  shadow.getElementById('btn-complexity').addEventListener('click', () => triggerMentorQuery('COMPLEXITY', output));
}

// Scrape context from LeetCode page & request feedback
function triggerMentorQuery(mode, outputElement) {
  outputElement.innerText = "⏳ Inspecting code & asking mentor...";

  // Scrape title and description from DOM
  const title = document.querySelector('div[data-cy="question-title"]')?.innerText 
                || document.title 
                || "LeetCode Problem";
                
  const description = document.querySelector('div[class*="elfjS"]')?.innerText 
                      || "Problem description context unavailable.";

  // Extract user code from Monaco Editor lines
  const codeLines = document.querySelectorAll('.view-lines .view-line');
  const userCode = Array.from(codeLines).map(line => line.innerText).join('\n');

  // Send request to background.js
  chrome.runtime.sendMessage({
    action: "FETCH_MENTOR_FEEDBACK",
    payload: {
      problemTitle: title,
      problemDesc: description,
      userCode: userCode,
      mode: mode
    }
  }, (response) => {
    if (chrome.runtime.lastError) {
      outputElement.innerText = "Error: " + chrome.runtime.lastError.message;
      return;
    }

    if (response.success) {
      outputElement.innerText = response.reply;
    } else {
      outputElement.innerText = "❌ " + response.error;
    }
  });
}