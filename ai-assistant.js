function toggleAIChat() {
  const modal = document.getElementById("ai-modal");
  if (modal) {
    modal.style.display = (modal.style.display === "none" || modal.style.display === "") ? "block" : "none";
  }
}

// async function sendToGemini() {
//   const inputField = document.getElementById("user-input");
//   const chatBox = document.getElementById("chat-box");
//   const userQuery = inputField.value.trim();

//   if (!userQuery) return;

//   chatBox.innerHTML += `<p><strong>You:</strong> ${userQuery}</p>`;
//   inputField.value = "";
//   chatBox.scrollTop = chatBox.scrollHeight;

//   const loadingId = "loading-" + Date.now();
//   chatBox.innerHTML += `<p id="${loadingId}" style="color: #4285F4;"><em>AI is thinking...</em></p>`;
//   chatBox.scrollTop = chatBox.scrollHeight;

//   try {
//     // Updated Endpoint URL using gemini-1.5-flash-latest
//     const response = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           contents: [
//             {
//               parts: [
//                 {
//                   text: `You are an AI Academic Assistant for a Student Management System built under UN SDG 4 (Quality Education).

//                   Your role:
//                 - Help students with study plans.
//                 - Help improve attendance.
//                 - Give exam preparation tips.
//                 - Explain academic concepts.
//                 - Provide career guidance.
//                 - Answer in a clear and student-friendly way.

//                 Question: ${userQuery}`
//                 }
//               ]
//             }
//           ]
//         })
//       }
//     );

//     const data = await response.json();
//     console.log(data);
//     const loadingEl = document.getElementById(loadingId);
//     if (loadingEl) loadingEl.remove();

//     if (data.candidates && data.candidates[0] && data.candidates[0].content) {
//       const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text ||
//                       "Sorry, I couldn't generate a response.";
//       chatBox.innerHTML += `<p style="color: #34A853;"><strong>AI Assistant:</strong> ${aiReply}</p>`;
//     } else if (data.error) {
//       console.error("Google API Error:", data.error);
//       chatBox.innerHTML += `<p style="color: #ff4d4d; font-size: 11px;"><strong>API Error (${data.error.code}):</strong> ${data.error.message}</p>`;
//     } else {
//       chatBox.innerHTML += `<p style="color: #ff4d4d;"><strong>Error:</strong> Unexpected response structure.</p>`;
//     }
//   } catch (error) {
//     const loadingEl = document.getElementById(loadingId);
//     if (loadingEl) loadingEl.remove();
//     console.error("Fetch Error:", error);
//     chatBox.innerHTML += `<p style="color: #ff4d4d;"><strong>Network Error:</strong> ${error.message}</p>`;
//   }

//   chatBox.scrollTop = chatBox.scrollHeight;
// }
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
      "https://student-management-analytics.onrender.com/ai-assistant",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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