import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';

const greeting = "Hello! I'm Botanica 🌿 — your Garden Advisor. I can help you design, plan, and maintain beautiful garden spaces, from balconies to terraces. What would you like to grow or design today?";

export default function ChatPage() {
  const [messages, setMessages] = useState([{ sender: 'bot', content: greeting }]);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const chatBox = useRef(null);

  useEffect(() => {
    if (chatBox.current) chatBox.current.scrollTop = chatBox.current.scrollHeight;
  }, [messages, isWaiting]);

  async function sendMessage(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || isWaiting) return;

    setMessage('');
    setMessages((current) => [...current, { sender: 'user', content: text }]);
    setIsWaiting(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessages((current) => [...current, { sender: 'bot', content: data.reply, markdown: true }]);
        setHistory((current) => [
          ...current,
          { role: 'user', parts: [{ text }] },
          { role: 'model', parts: [{ text: data.reply }] },
        ]);
      } else {
        console.error('Error from server:', data);
        setMessages((current) => [...current, {
          sender: 'bot',
          content: data.error || 'Sorry, I am having trouble connecting to the garden network right now. 🌱',
        }]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setMessages((current) => [...current, { sender: 'bot', content: 'Oops! The roots got tangled. Please check your connection and try again.' }]);
    } finally {
      setIsWaiting(false);
    }
  }

  return (
    <div className="chatbot-container">
      <header className="chatbot-header">
        <div className="header-info">
          <div className="bot-avatar">
            <span className="material-icons-outlined">local_florist</span>
          </div>
          <div className="bot-details">
            <h1>Botanica</h1>
            <span className="status">● Online</span>
          </div>
        </div>
        <p className="subtitle">Your Personal Garden Advisor</p>
      </header>

      <main className="chat-box" id="chat-box" ref={chatBox} aria-live="polite">
        {messages.map((entry, index) => (
          <div className={`message ${entry.sender === 'user' ? 'user-message' : 'bot-message'}`} key={`${index}-${entry.sender}`}>
            {entry.markdown ? (
              <div className="message-content" dangerouslySetInnerHTML={{ __html: marked.parse(entry.content) }} />
            ) : (
              <div className="message-content">{entry.content}</div>
            )}
          </div>
        ))}
        {isWaiting && (
          <div className="typing-indicator message bot-message" aria-label="Botanica is typing">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}
      </main>

      <footer className="chatbot-footer">
        <form id="chat-form" onSubmit={sendMessage}>
          <input
            type="text"
            id="user-input"
            placeholder="Ask about your plants..."
            autoComplete="off"
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <button type="submit" id="send-btn" disabled={isWaiting} aria-label="Send message">
            <span className="material-icons-outlined">send</span>
          </button>
        </form>
      </footer>
    </div>
  );
}
