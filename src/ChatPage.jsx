import "./App.css";

export default function ChatPage() {
  return (
    <div className="home-stack llm-chat-page">
      {/* верхняя карточка с описанием и токеном */}
      <section className="card llm-chat-header-card">
        <h2 className="llm-chat-title">ИИ-помощник расходов</h2>
        <p className="llm-chat-subtitle">
          Задайте вопрос об анализе расходов, целях или бюджете.
        </p>

        <label className="llm-chat-token-label">
          Токен OpenAI
          <input
            type="password"
            className="llm-chat-token-input"
            placeholder="sk-................................"
          />
          <span className="llm-chat-token-hint">
            Для демо токен можно оставить пустым — логика будет добавлена позже.
          </span>
        </label>
      </section>

      {/* основное окно чата */}
      <section className="card llm-chat-window-card">
        <div className="llm-chat-messages">
          <div className="llm-chat-message llm-chat-message-bot">
            <div className="llm-chat-avatar llm-chat-avatar-bot">🤖</div>
            <div className="llm-chat-bubble">
              Привет! Я помогу проанализировать твои доходы и расходы.
            </div>
          </div>

          <div className="llm-chat-message llm-chat-message-user">
            <div className="llm-chat-avatar llm-chat-avatar-user">👤</div>
            <div className="llm-chat-bubble">
              Покажи, в каких категориях я трачу больше всего за месяц.
            </div>
          </div>

          {/* сюда потом будут добавляться реальные сообщения */}
        </div>

        <form
          className="llm-chat-input-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            className="llm-chat-input"
            placeholder="Напишите запрос, например: “Сводка по тратам за неделю”"
          />
          <button className="llm-chat-send-button" type="submit">
            <svg viewBox="0 0 24 24" className="llm-chat-send-icon">
              <path
                d="M5 12L19 5l-3.5 7L19 19 5 12z"
                fill="currentColor"
              />
            </svg>
          </button>
        </form>
      </section>
    </div>
  );
}
