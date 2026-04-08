const chatForm = document.getElementById('chat-form');
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

// Keep track of the chat history to pass context
let chatHistory = [];

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    // Append user message to the UI
    appendMessage('user', message);
    userInput.value = '';

    // Show typing indicator
    const typingIndicator = showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history: chatHistory })
        });

        const data = await response.json();

        // Remove typing indicator
        chatBox.removeChild(typingIndicator);

        if (response.ok) {
            // Render basic markdown with marked.js
            const renderedResponse = typeof marked !== 'undefined' ? marked.parse(data.reply) : data.reply;
            appendMessage('bot', renderedResponse, true);

            // Save context
            chatHistory.push({ role: 'user', parts: [{ text: message }] });
            chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });
        } else {
            console.error('Error from server:', data);
            appendMessage('bot', 'Sorry, I am having trouble connecting to the garden network right now. 🌱');
        }

    } catch (error) {
        console.error('Fetch error:', error);
        chatBox.removeChild(typingIndicator);
        appendMessage('bot', 'Oops! The roots got tangled. Please check your connection and try again.');
    }
});

function appendMessage(sender, content, isHtml = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    if (isHtml) {
        contentDiv.innerHTML = content;
    } else {
        contentDiv.textContent = content;
    }

    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);

    scrollToBottom();
}

function showTypingIndicator() {
    const indicatorDiv = document.createElement('div');
    indicatorDiv.classList.add('typing-indicator', 'message', 'bot-message');
    indicatorDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    chatBox.appendChild(indicatorDiv);
    scrollToBottom();
    return indicatorDiv;
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}
