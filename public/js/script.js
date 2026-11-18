
// Generate AI response
async function generateAI(type) {

    // Get the input field
    const inputElement = document.getElementById(
        type === "notes" ? "notesInput" :
        type === "summary" ? "summaryInput" :
        type === "mcq" ? "mcqInput" :
        type === "chat" ? "chatInput" :
        "tipsInput"
    );

    const input = inputElement.value.trim();

    // Check empty input
    if (!input) {
        alert("Please enter some text or a topic!");
        inputElement.focus();
        return;
    }

    // Get result section
    const resultElement = document.getElementById(
        type + "Result"
    );

    // Get the clicked button
    const button = inputElement.parentElement.querySelector(
        "button"
    );

    // Show loading message
    resultElement.classList.add("visible");
    resultElement.textContent = "✨ AI is thinking... Please wait.";

    button.disabled = true;
    button.textContent = "Generating...";

    try {

        // Send request to backend
        const response = await fetch("/api/generate", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                type: type,
                input: input
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        // Display AI generated result
        resultElement.textContent = data.result;

    } catch (error) {

        resultElement.textContent =
            "❌ Error: " + error.message;

    } finally {

        // Restore button
        button.disabled = false;

        const buttonNames = {
            notes: "Generate Notes ✨",
            summary: "Summarize Text ✨",
            mcq: "Generate MCQs ✨",
            chat: "Ask AI ✨",
            tips: "Generate Study Tips ✨"
        };

        button.textContent = buttonNames[type];
    }
}
