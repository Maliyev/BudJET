import { useEffect, useState, useRef } from "react";
import "./Chat.css";

// ===== ЛОКАЛЬНЫЙ messageStore (вместо ../../services/messageStore) =====

const STORAGE_KEY = "milli_chat_messages";

function getAllMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return Promise.resolve([]);
    const parsed = JSON.parse(raw);
    return Promise.resolve(Array.isArray(parsed) ? parsed : []);
  } catch {
    return Promise.resolve([]);
  }
}

function saveMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // игнорируем ошибки localStorage
  }
}

function addMessage(msg) {
  return getAllMessages().then((msgs) => {
    const next = [...msgs, msg];
    saveMessages(next);
    return next;
  });
}

function clearMessagesStore() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return Promise.resolve();
}

// ===== ЗАГЛУШКА вместо ../../services/chatService =====

function sendMessageToAssistant(text, apiKey) {
  const base = apiKey
    ? "Это будет реальный ответ с бэкенда (режим LIVE)."
    : "Демо-ответ без обращения к API (режим MOCK).";

  const replyText = `${base}\n\nВы написали: “${text}”`;

  return Promise.resolve({
    role: "assistant",
    text: replyText,
    createdAt: Date.now(),
  });
}

// ===== КОМПОНЕНТ ЧАТА =====

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("openai_api_key") || ""
  );
  const listRef = useRef(null);

  // загрузка истории из localStorage
  useEffect(() => {
    let mounted = true;
    getAllMessages().then((msgs) => {
      if (mounted) setMessages(msgs);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // автоскролл вниз при новых сообщениях
  useEffect(() => {
    if (listRef.current) {
      setTimeout(() => {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 0);
    }
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    try {
      const userMsg = {
        role: "user",
        text,
        createdAt: Date.now(),
      };
      const msgsAfterUser = await addMessage(userMsg);
      setMessages(msgsAfterUser);

      const assistantMsg = await sendMessageToAssistant(text, apiKey);
      const msgsAfterAssistant = await addMessage(assistantMsg);
      setMessages(msgsAfterAssistant);
    } catch (err) {
      console.error("Chat send error", err);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function saveApiKey() {
    if (apiKey) localStorage.setItem("openai_api_key", apiKey);
    else localStorage.removeItem("openai_api_key");
  }

  async function handleClear() {
    await clearMessagesStore();
    setMessages([]);
  }

  return (
    <section className="chat-component">
      <div
        className="chat-body"
        ref={listRef}
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="chat-empty">
            Начните чат. Напишите сообщение внизу.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              "chat-message " + (m.role === "user" ? "user" : "assistant")
            }
          >
            <div className="message-text">{m.text}</div>
            {m.createdAt && (
              <div className="message-time">
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="chat-footer">
        <textarea
          className="chat-input"
          placeholder="Сообщение..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          aria-label="Сообщение для ассистента"
        />
        <button
          className="chat-send"
          onClick={handleSend}
          disabled={loading}
          aria-label="Отправить"
        >
          {loading ? "⏳" : "▶"}
        </button>
      </div>

      <div className="chat-config">
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <input
            type="password"
            className="chat-api-key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="OpenAI API key (опционально)"
            style={{ flex: 1 }}
          />
          <button
            onClick={saveApiKey}
            className="chat-save-key"
            title="Сохранить API ключ"
          >
            ✓
          </button>
          <button
            onClick={handleClear}
            className="chat-clear"
            title="Очистить чат"
          >
            🗑
          </button>
        </div>
        <div className="chat-mode">
          Режим: {apiKey ? "🟢 Live" : "🔵 Mock"}
        </div>
      </div>
    </section>
  );
}

export default Chat;
