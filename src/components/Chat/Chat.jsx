import { useEffect, useState, useRef } from "react";
import "./Chat.css";
import { analyzeTransactionsWithLLM } from "../../services/llmService";

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



// ===== КОМПОНЕНТ ЧАТА =====

function Chat({ transactions, loading, initialMessage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("openai_api_key") || ""
  );
  const listRef = useRef(null);
  const initialMessageSent = useRef(false);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });
  };

  // загрузка истории из localStorage
  useEffect(() => {
    let mounted = true;
    getAllMessages().then((msgs) => {
      if (mounted) setMessages(msgs);
      scrollToBottom(); // Scroll to bottom after initial messages load
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Обработка initialMessage для запуска AI анализа
  useEffect(() => {
    if (initialMessage && !initialMessageSent.current) {
      initialMessageSent.current = true; // Отмечаем, что сообщение обработано
      (async () => {
        setIsSendingMessage(true);
        try {
          const userMsg = {
            role: "user",
            text: initialMessage,
            createdAt: Date.now(),
          };
          const msgsAfterUser = await addMessage(userMsg);
          setMessages(msgsAfterUser);

          const assistantResponse = await analyzeTransactionsWithLLM(
            transactions,
            initialMessage,
            apiKey
          );
          const assistantMsg = {
            role: "assistant",
            text: assistantResponse.text,
            createdAt: Date.now(),
          };
          const msgsAfterAssistant = await addMessage(assistantMsg);
          setMessages(msgsAfterAssistant);
        } catch (err) {
          console.error("Initial AI analysis error", err);
        } finally {
          setIsSendingMessage(false);
          scrollToBottom(); // Scroll to bottom after initial AI response
        }
      })();
    }
  }, [initialMessage, transactions, apiKey]); // Зависимости для useEffect

  async function handleSend() {
    const text = input.trim();
    if (!text || isSendingMessage) return;

    setInput("");
    setIsSendingMessage(true);

    try {
      const userMsg = {
        role: "user",
        text,
        createdAt: Date.now(),
      };
      const msgsAfterUser = await addMessage(userMsg);
      setMessages(msgsAfterUser);

      const assistantResponse = await analyzeTransactionsWithLLM(
        transactions,
        text,
        apiKey
      );
      const assistantMsg = {
        role: "assistant",
        text: assistantResponse.text,
        createdAt: Date.now(),
      };
      const msgsAfterAssistant = await addMessage(assistantMsg);
      setMessages(msgsAfterAssistant);
    } catch (err) {
      console.error("Chat send error", err);
    } finally {
      setIsSendingMessage(false);
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
        {messages.length === 0 && loading && (
          <div className="chat-empty">
            Загрузка транзакций...
          </div>
        )}
        {messages.length === 0 && !loading && transactions.length === 0 && (
          <div className="chat-empty">
            Нет транзакций для анализа.
          </div>
        )}
        {messages.length === 0 && !loading && transactions.length > 0 && (
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
