const SYSTEM_PROMPT = `
You are an encouraging Socratic Peer and Coding Mentor assisting a student on LeetCode.
Your core principle: NEVER reveal full solution code immediately unless specifically requested.

Behavior Guidelines:
1. "HINT" mode: Provide a subtle nudge, point out an unhandled edge case, or ask a guiding question.
2. "DEBUG" mode: Point out logical flaws or syntax bugs without re-writing the whole code.
3. "COMPLEXITY" mode: Briefly explain time and space complexity ($O(N)$, $O(\log N)$).

Keep responses concise and clear.
`;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_MENTOR_FEEDBACK") {
    handleMentorRequest(request.payload)
      .then(reply => sendResponse({ success: true, reply }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    
    return true; // Keep messaging channel open
  }
});

async function handleMentorRequest({ problemTitle, problemDesc, userCode, mode }) {
  const data = await chrome.storage.sync.get(['openaiKey']); // Reusing key storage slot
  const apiKey = data.openaiKey;

  if (!apiKey) {
    throw new Error("API Key not found. Please click the extension icon and set your Gemini API Key.");
  }

  const userPrompt = `
System Instruction: ${SYSTEM_PROMPT}

Mode: ${mode}
Problem Title: ${problemTitle}
Problem Description: ${problemDesc}
User's Current Code:
${userCode || "No code written yet."}
`;

  // Fetch using Google Gemini 1.5 Flash Free API
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: userPrompt }]
      }]
    })
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error?.message || "Failed to fetch response from Gemini API.");
  }

  return responseData.candidates[0].content.parts[0].text;
}