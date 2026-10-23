import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import SiteNav from '../components/SiteNav.jsx';
import '../styles/chat-page.css';

const greeting = "Hi, I'm Botanica. I can help you choose plants, plan your space, and solve everyday gardening questions. What are you working on?";
const MAX_CHAT_HISTORY_ENTRIES = 40;
const MAX_CHAT_HISTORY_TEXT_LENGTH = 24000;
const suggestedQuestions = [
  'What can I grow on a sunny balcony?',
  'How often should I water tomato plants?',
  'Help me plan a small terrace garden.',
];

function trimChatHistory(entries) {
  const retained = [];
  let textLength = 0;

  for (const entry of entries.slice(-MAX_CHAT_HISTORY_ENTRIES).reverse()) {
    const entryLength = entry.parts[0].text.length;
    if (textLength + entryLength > MAX_CHAT_HISTORY_TEXT_LENGTH) break;
    retained.push(entry);
    textLength += entryLength;
  }

  return retained.reverse();
}

export default function ChatPage() {
  const [messages, setMessages] = useState([{ sender: 'bot', content: greeting }]);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const chatBox = useRef(null);

  useEffect(() => {
    if (chatBox.current) chatBox.current.scrollTop = chatBox.current.scrollHeight;
  }, [messages, isWaiting]);

  async function sendMessage(event, suggestedMessage) {
    event?.preventDefault();
    const text = (suggestedMessage ?? message).trim();
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
        setHistory((current) => trimChatHistory([
          ...current,
          { role: 'user', parts: [{ text }] },
          { role: 'model', parts: [{ text: data.reply }] },
        ]));
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
    <div className="chat-page">
      <SiteNav builder homeOnly />
      <main className="chat-page-main">
        <aside className="chat-page-aside" aria-label="Gardening inspiration">
          <div className="chat-page-intro">
            <span className="chat-page-eyebrow">A LITTLE MORE GREEN</span>
            <h1>Good things grow with a little guidance.</h1>
            <p>Bring your questions, big plans, or just a single stubborn leaf. We’ll figure it out together.</p>
          </div>

          <div className="chat-aside-art" aria-hidden="true">
            <span className="chat-aside-orbit chat-aside-orbit-one" />
            <span className="chat-aside-orbit chat-aside-orbit-two" />
            <img className="chat-aside-plant" src="/icons/decorations/potted-plant.svg" alt="" />
            <span className="chat-aside-spark chat-aside-spark-one material-icons-outlined">flare</span>
            <span className="chat-aside-spark chat-aside-spark-two material-icons-outlined">flare</span>
          </div>

          <div className="chat-aside-note">
            <span className="material-icons-outlined" aria-hidden="true">lightbulb</span>
            <div>
              <span className="chat-aside-note-label">A good place to start</span>
              <p>Tell us how much sunlight your space gets.</p>
            </div>
          </div>

          <div className="chat-aside-footer">
            <span className="chat-aside-leaf material-icons-outlined" aria-hidden="true">eco</span>
            <span>Small steps. Happier plants.</span>
          </div>
        </aside>

        <section className="chatbot-container" aria-label="Chat with your garden advisor">
          <header className="chatbot-header">
            <div className="header-info">
              <div className="bot-avatar">
                <span className="material-icons-outlined" aria-hidden="true">local_florist</span>
              </div>
              <div className="bot-details">
                <h2>Botanica</h2>
                <span className="status"><span className="chat-online-dot" />Your garden advisor is here</span>
              </div>
            </div>
            <span className="chat-header-note">
              <span className="material-icons-outlined" aria-hidden="true">eco</span>
              Made for curious growers
            </span>
          </header>

          <div className="chat-box" id="chat-box" ref={chatBox} aria-live="polite" aria-busy={isWaiting}>
            {messages.map((entry, index) => (
              <div className={`message ${entry.sender === 'user' ? 'user-message' : 'bot-message'}`} key={`${index}-${entry.sender}`}>
                {entry.sender === 'bot' && (
                  <span className="message-avatar material-icons-outlined" aria-hidden="true">local_florist</span>
                )}
                {entry.markdown ? (
                  <div className="message-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(entry.content)) }} />
                ) : (
                  <div className="message-content">{entry.content}</div>
                )}
              </div>
            ))}
            {messages.length === 1 && !isWaiting && (
              <div className="chat-suggestions" role="group" aria-label="Suggested questions">
                <span className="chat-suggestions-label">Not sure where to start?</span>
                <div className="chat-suggestions-list">
                  {suggestedQuestions.map((question) => (
                    <button
                      type="button"
                      className="chat-suggestion"
                      key={question}
                      onClick={() => sendMessage(null, question)}
                    >
                      <span>{question}</span>
                      <span className="material-icons-outlined" aria-hidden="true">arrow_outward</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isWaiting && (
              <div className="typing-indicator message bot-message" aria-label="Botanica is typing">
                <span className="message-avatar material-icons-outlined" aria-hidden="true">local_florist</span>
                <div className="typing-bubble">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}
          </div>

          <footer className="chatbot-footer">
            <form id="chat-form" onSubmit={sendMessage}>
              <input
                type="text"
                id="user-input"
                placeholder="Ask about plants, soil, sunlight..."
                aria-label="Message Botanica"
                maxLength={4000}
                autoComplete="off"
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <button type="submit" id="send-btn" disabled={isWaiting || !message.trim()} aria-label="Send message">
                <span className="material-icons-outlined" aria-hidden="true">send</span>
              </button>
            </form>
            <p className="chat-input-hint">Garden advice, one question at a time.</p>
          </footer>
        </section>
      </main>
    </div>
  );
}
