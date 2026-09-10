function toggleAIChat() {
  const modal = document.getElementById("ai-modal");
  if (modal) {
    modal.style.display =
      (modal.style.display === "none" || modal.style.display === "")
        ? "block"
        : "none";
  }
}
function showAIChatMode() {
  const chatSection = document.getElementById("ai-chat-section");
  const plannerSection = document.getElementById("study-planner-section");
  const chatButton = document.getElementById("ai-chat-mode");
  const plannerButton = document.getElementById("study-plan-mode");
  if (chatSection) {
    chatSection.style.display = "block";
  }
  if (plannerSection) {
    plannerSection.style.display = "none";
  }
  if (chatButton) {
    chatButton.style.background = "#4285F4";
  }
  if (plannerButton) {
    plannerButton.style.background = "#444";
  }
}
function showStudyPlannerMode() {
  const chatSection = document.getElementById("ai-chat-section");
  const plannerSection = document.getElementById("study-planner-section");
  const chatButton = document.getElementById("ai-chat-mode");
  const plannerButton = document.getElementById("study-plan-mode");
  if (chatSection) {
    chatSection.style.display = "none";
  }
  if (plannerSection) {
    plannerSection.style.display = "block";
  }
  if (chatButton) {
    chatButton.style.background = "#444";
  }
  if (plannerButton) {
    plannerButton.style.background = "#4285F4";
  }
}
async function sendToGemini() {
  const inputField = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  if (!inputField || !chatBox) {
    return;
  }
  const userQuery = inputField.value.trim();
  if (!userQuery) {
    return;
  }
  chatBox.innerHTML += `
    <p>
      <strong>You:</strong> ${userQuery}
    </p>
  `;
  inputField.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;
  const loadingId = "loading-" + Date.now();
  chatBox.innerHTML += `
    <p id="${loadingId}" style="color: #4285F4;">
      <em>AI is thinking...</em>
    </p>
  `;
  chatBox.scrollTop = chatBox.scrollHeight;
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) {
        loadingEl.remove();
      }
      chatBox.innerHTML += `
        <p style="color: #ff4d4d;">
          <strong>Error:</strong> Please log in again.
        </p>
      `;
      return;
    }
    const response = await fetch(
      "https://student-management-analytics-1.onrender.com/ai-assistant",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          question: userQuery
        })
      }
    );
    const data = await response.json();
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.remove();
    }
    if (response.ok && data.reply) {
      chatBox.innerHTML += `
        <p style="color: #34A853;">
          <strong>AI Assistant:</strong> ${data.reply}
        </p>
      `;
    } else {
      console.error("AI API Error:", data);
      chatBox.innerHTML += `
        <p style="color: #ff4d4d;">
          <strong>Error:</strong>
          ${data.error || "Unable to get AI response."}
        </p>
      `;
    }
  } catch (error) {
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
      loadingEl.remove();
    }
    console.error("AI Assistant Error:", error);
    chatBox.innerHTML += `
      <p style="color: #ff4d4d;">
        <strong>Network Error:</strong>
        ${error.message}
      </p>
    `;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}
async function generateStudyPlan() {
  const daysSelect = document.getElementById("study-plan-days");
  const resultBox = document.getElementById("study-plan-result");
  if (!daysSelect || !resultBox) {
    return;
  }
  const days = Number(daysSelect.value);
  if (!days || days < 1 || days > 30) {
    resultBox.innerHTML = `
      <p style="color: #ff4d4d;">
        Please select a valid study plan duration.
      </p>
    `;
    return;
  }
  const token = localStorage.getItem("token");
  if (!token) {
    resultBox.innerHTML = `
      <p style="color: #ff4d4d;">
        <strong>Error:</strong> Please log in again.
      </p>
    `;
    return;
  }
  resultBox.innerHTML = `
    <p style="color: #4285F4;">
      <em>Analyzing your academic performance and creating your personalized study plan...</em>
    </p>
  `;
  try {
    const response = await fetch(
      "https://student-management-analytics-1.onrender.com/ai-study-plan",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          days: days
        })
      }
    );
    const data = await response.json();
    if (response.ok && data.studyPlan) {
      const formattedPlan = data.studyPlan
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
      resultBox.innerHTML = `
        <div style="color: #eee;">
          ${formattedPlan}
        </div>
      `;
    } else {
      console.error("Study Planner API Error:", data);
      resultBox.innerHTML = `
        <p style="color: #ff4d4d;">
          <strong>Error:</strong>
          ${data.error || "Unable to generate study plan."}
        </p>
      `;
    }
  } catch (error) {
    console.error("Study Planner Error:", error);
    resultBox.innerHTML = `
      <p style="color: #ff4d4d;">
        <strong>Network Error:</strong>
        ${error.message}
      </p>
    `;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("user-input");
  if (inputField) {
    inputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendToGemini();
      }
    });
  }
});