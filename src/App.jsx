import "./App.css";

function App() {
  return (
    <div className="app-root">
      <div className="phone-shell">
        {/* основной контент */}
        <main className="home-wrapper">
          <div className="home-stack">
            {/* Greeting Card */}
            <section className="card greeting-card">
              <div className="greeting-header">
                <div className="avatar-bg">
                  <img
                    src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/yoWSQTTkls/0z3cqpja_expires_30_days.png"
                    alt="Аватар"
                    className="avatar-img"
                  />
                </div>
                <span className="greeting-name">Здравствуйте, (Имя)</span>
              </div>

              <div className="balance-row">
                <span className="balance-amount">₼1,320.00</span>
                <span className="balance-change">+5.23%</span>
              </div>

              <span className="balance-sub">₼1220.00/мес</span>
            </section>

            {/* Pie Chart + Categories */}
            <section className="card pie-card">
              <img
                src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/yoWSQTTkls/oxj1ue56_expires_30_days.png"
                alt="Диаграмма расходов"
                className="pie-image"
              />

              <div className="categories-list">
                <div className="category-item">
                  <span className="category-dot products-dot" />
                  <span className="category-name products">Продукты</span>
                  <span className="category-value">320/500</span>
                </div>
                <div className="category-item">
                  <span className="category-dot transport-dot" />
                  <span className="category-name transport">Транспорт</span>
                  <span className="category-value">110/500</span>
                </div>
                <div className="category-item">
                  <span className="category-dot health-dot" />
                  <span className="category-name health">Здоровье</span>
                  <span className="category-value">50/500</span>
                </div>
                <div className="category-item">
                  <span className="category-dot other-dot" />
                  <span className="category-name other">Другое</span>
                  <span className="category-value">20/500</span>
                </div>
              </div>
            </section>

            {/* Chat Suggestion */}
            <section className="card chat-card">
              <div className="chat-left">
                <div className="chat-bubble-wrapper">
                  <div className="chat-bubble">
                    Я заметил изменения в ваших расходах. Хотите узнать подробнее?
                  </div>
                </div>
                <button className="chat-button">Начать чат</button>
              </div>

              <img
                src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/yoWSQTTkls/6yeyfht5_expires_30_days.png"
                alt="ИИ-бот"
                className="chat-bot-image"
              />
            </section>

            {/* Savings Card */}
            <section className="card savings-card">
              <span className="savings-amount">+23 AZN</span>
              <div className="savings-text">На этой неделе вы в плюсе</div>

              <div className="savings-goal">Велосипед</div>
              <div className="savings-progress-label">74/400 AZN</div>

              <div className="savings-progress-track">
                <div className="savings-progress-fill" />
              </div>
            </section>
          </div>
        </main>

        {/* нижняя навигация */}
        <nav className="bottom-nav">
          {/* Дом */}
          <button className="nav-item nav-home active" type="button">
            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M4 11L12 4l8 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 10.5V19a1 1 0 0 0 1 1h4v-5h2v5h4a1 1 0 0 0 1-1v-8.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Центр — ИИ */}
          <button className="nav-item nav-center" type="button">
            <div className="nav-center-glow">
              <div className="nav-center-circle">
                <svg
                  className="nav-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect
                    x="6"
                    y="9"
                    width="12"
                    height="10"
                    rx="3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="10"
                    cy="13"
                    r="1"
                    fill="currentColor"
                  />
                  <circle
                    cx="14"
                    cy="13"
                    r="1"
                    fill="currentColor"
                  />
                  <line
                    x1="9"
                    y1="17"
                    x2="15"
                    y2="17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="12"
                    y1="5"
                    x2="12"
                    y2="8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="12"
                    cy="4"
                    r="1"
                    fill="currentColor"
                  />
                  <line
                    x1="6"
                    y1="12"
                    x2="4"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="18"
                    y1="12"
                    x2="20"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </button>

          {/* Меню */}
          <button className="nav-item nav-menu" type="button">
            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <line
                x1="5"
                y1="8"
                x2="19"
                y2="8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="5"
                y1="16"
                x2="19"
                y2="16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default App;
