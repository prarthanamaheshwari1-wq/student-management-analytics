function toggleAIChat() {
  const modal = document.getElementById("ai-modal");
  if (modal) {
    modal.style.display = (modal.style.display === "none" || modal.style.display === "") ? "block" : "none";
  }
}

async function sendToGemini() {
  const inputField = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const userQuery = inputField.value.trim();

  if (!userQuery) return;

  chatBox.innerHTML += `<p><strong>You:</strong> ${userQuery}</p>`;
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
    const response = await fetch(
      "https://student-management-analytics-1.onrender.com/ai-assistant",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: userQuery , 
          studentId: localStorage.getItem("studentId")
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
          <strong>Error:</strong> ${data.error || "Unable to get AI response."}
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
        <strong>Network Error:</strong> ${error.message}
      </p>
    `;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
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