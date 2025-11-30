import { useEffect, useState } from "react";
import "./App.css";
import Chart from "chart.js/auto";
import Chat from "./components/Chat/Chat";
import {
  getAllTransactions,
  getMonthlySummary,
} from "./services/transactionsService";
import { mockAnalyzeTransactions } from "./services/llmService.js";

const DEMO_ANALYTICS = {
  income: 1320,               // суммарный доход за месяц
  expense: 789,               // суммарный расход за месяц
  weekSpending: [320, 180, 450, 600, 200, 380, 520], // траты по дням (Пн...Вс)
  trendValues: [1200, 1180, 1170, 1155, 1140, 1120, 1105], // баланс по дням
};

function App() {
  const [page, setPage] = useState("home"); // "home" | "analytics" | потом будет "chat"
  const [transactions, setTransactions] = useState([]);
  const [monthSummary, setMonthSummary] = useState(null);
  const [aiText, setAiText] = useState("");
  const [loadingTransactions, setLoadingTransactions] = useState(true);


  // круговая диаграмма для главной страницы
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const all = await getAllTransactions();   // работает и если sync, и если async
        if (cancelled) return;

        const safeAll = Array.isArray(all) ? all : [];
        setTransactions(safeAll);

        const summary = await getMonthlySummary(safeAll); // тоже на случай async
        if (!cancelled) setMonthSummary(summary || null);
      } catch (e) {
        console.error("transactions load error", e);
        if (!cancelled) {
          setTransactions([]);
          setMonthSummary(null);
        }
      } finally {
        if (!cancelled) setLoadingTransactions(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = document.getElementById("expensesChart");
    if (!canvas) return; // если мы не на home, просто выходим

    const chart = new Chart(canvas, {
      type: "pie",
      data: {
        labels: ["Продукты", "Транспорт", "Здоровье", "Другое"],
        datasets: [
          {
            data: [320, 110, 50, 20],
            backgroundColor: ["#F6CD60", "#5BE389", "#66A7FF", "#9B55E2"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
      },
    });
    return () => {
      chart.destroy();
    };
  }, [page]); // пересоздаём диаграмму, когда вернулись на home

  const [initialChatMessage, setInitialChatMessage] = useState("");

  async function handleRunAI() {
    setInitialChatMessage("Проанализируй мои транзакции, ответь кратко и по существу."); // Устанавливаем начальное сообщение
    setPage("chat"); // Переходим на страницу чата
  }


  const renderPage = () => {
    const ensureDate = (value) =>
    value instanceof Date ? value : new Date(value);
    if (page === "analytics") {
      // если по какой-то причине транзакции ещё не подгрузились
      if (!transactions.length) {
        return (
          <div className="home-stack analytics-stack">
            <section className="card">
              <h2 className="analytics-title">Аналитика расходов</h2>
              <p className="analytics-sub">
                Данные ещё не загружены. Попробуйте обновить страницу.
              </p>
            </section>
          </div>
        );
      }

      // 1) берём все "YYYY-MM" из дат (работает и для Date, и для строк)
      const monthKeys = Array.from(
        new Set(
          transactions.map((tx) => {
            const d = ensureDate(tx.date);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const mm = month < 10 ? `0${month}` : `${month}`;
            return `${year}-${mm}`;
          })
        )
      ).sort();

      const monthKey = monthKeys[monthKeys.length - 1]; // последний месяц

      // 2) транзакции только этого месяца
      const monthTx = transactions.filter((tx) => {
        const d = ensureDate(tx.date);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const mm = month < 10 ? `0${month}` : `${month}`;
        const key = `${year}-${mm}`;
        return key === monthKey;
      });

      // 3) считаем доход/расход
      let income = 0;
      let spent = 0;

      monthTx.forEach((tx) => {
        if (tx.amount >= 0) income += tx.amount;
        else spent += -tx.amount;
      });

      const net = income - spent;
      const positive = net >= 0;

      // 4) недельный и дневной лимит
      const WEEK_LIMIT = income > 0 ? income / 4 : 1;
      const DAY_LIMIT = WEEK_LIMIT / 7;

      // 5) проценты для полосы доходы/расходы
      const spentPercent =
        income > 0 ? Math.min(100, (spent / income) * 100) : 0;
      const remainingPercent = Math.max(0, 100 - spentPercent);

      // 6) бар-граф по дням недели
      const weekLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
      const DAY_SPENDING = new Array(7).fill(0);

      monthTx.forEach((tx) => {
        if (tx.amount >= 0) return; // только расходы
        const d = ensureDate(tx.date);
        const jsDay = d.getDay(); // 0-вс,1-пн,...
        const idx = (jsDay + 6) % 7; // 0-пн,...,6-вс
        DAY_SPENDING[idx] += -tx.amount;
      });

      // 7) линейный график баланса — по последним 7 датам месяца
      let trendValues = [];
      if (monthTx.length) {
        const sortedTx = [...monthTx].sort(
          (a, b) => ensureDate(a.date) - ensureDate(b.date)
        );

        const dateToBalance = new Map();
        let balance = 0;

        sortedTx.forEach((tx) => {
          balance += tx.amount; // +доход, -расход
          const d = ensureDate(tx.date);
          const year = d.getFullYear();
          const month = d.getMonth() + 1;
          const day = d.getDate();
          const mm = month < 10 ? `0${month}` : `${month}`;
          const dd = day < 10 ? `0${day}` : `${day}`;
          const key = `${year}-${mm}-${dd}`;
          dateToBalance.set(key, balance); // баланс на конец дня
        });

        const uniqueDates = Array.from(dateToBalance.keys());
        const last7Dates = uniqueDates.slice(-7);
        trendValues = last7Dates.map((d) => dateToBalance.get(d));
      } else {
        trendValues = [0, 0, 0, 0, 0, 0, 0];
      }

      const trendMin = Math.min(...trendValues);
      const trendMax = Math.max(...trendValues);
      const trendRange = trendMax - trendMin || 1;
      const trendWidth = 280;
      const trendHeight = 80;

      const trendPoints = trendValues
        .map((value, index) => {
          const x =
            trendValues.length === 1
              ? trendWidth / 2
              : (index / (trendValues.length - 1)) * trendWidth;
          const norm = (value - trendMin) / trendRange;
          const y = trendHeight - norm * 60 - 10;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");

      return (
        <div className="home-stack analytics-stack">
          {/* 1. БАННЕР ВВЕРХУ НА ПОЛНУЮ ШИРИНУ */}
          <section
            className={
              "analytics-summary-banner " + (positive ? "positive" : "negative")
            }
          >
            <div className="analytics-summary-top">
              <div className="analytics-summary-label">Баланс за месяц</div>
              <button className="analytics-period-pill" type="button">
                monthly <span className="analytics-period-arrow">▲</span>
              </button>
            </div>

            <div className="analytics-summary-main">
              <span className="analytics-summary-currency">₼</span>
              <span className="analytics-summary-amount">
                {income.toLocaleString("ru-RU", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="analytics-summary-sign">
                {positive ? "+" : "-"}
              </span>
            </div>

            <div className="analytics-summary-bottom">
              {positive ? (
                <span className="analytics-summary-sub">
                  Вы в плюсе на {net.toFixed(0)} AZN за этот месяц
                </span>
              ) : (
                <span className="analytics-summary-sub">
                  Вы в минусе на {Math.abs(net).toFixed(0)} AZN за этот месяц
                </span>
              )}
            </div>
          </section>

          {/* 2. Полоса доходы / расходы */}
          <section className="card analytics-balance-card">
            <div className="analytics-balance-top">
              <div className="analytics-balance-side">
                <div className="analytics-balance-label">Доходы</div>
                <div className="analytics-balance-value">
                  {income.toLocaleString("ru-RU")}₼
                </div>
              </div>
              <div className="analytics-balance-side analytics-balance-side-expenses">
                <div className="analytics-balance-label">Расходы</div>
                <div className="analytics-balance-value">
                  {spent.toLocaleString("ru-RU")}₼
                </div>
              </div>
            </div>

            <div className="analytics-balance-bar-wrapper">
              <div className="analytics-balance-bar">
                <div
                  className="analytics-balance-remaining"
                  style={{ width: `${remainingPercent}%` }}
                />
                <div
                  className="analytics-balance-spent"
                  style={{ width: `${spentPercent}%` }}
                />
              </div>
              <div className="analytics-balance-center-line" />
            </div>

            <div className="analytics-balance-bottom">
              <span className="analytics-balance-percent">
                {remainingPercent.toFixed(1)}% бюджета осталось
              </span>
              <span className="analytics-balance-percent negative">
                -{spentPercent.toFixed(1)}% потрачено
              </span>
            </div>
          </section>

          {/* 3. Бар-граф по дням */}
          <section className="card analytics-weekly-card">
            <div className="analytics-weekly-header">
              <h3 className="analytics-title">Траты по дням</h3>
              <p className="analytics-sub">
                Дневной лимит ≈ {DAY_LIMIT.toFixed(0)} AZN (1/7 недельного
                бюджета)
              </p>
            </div>

            <div className="analytics-weekly-chart">
              {weekLabels.map((label, index) => {
                const spentDay = DAY_SPENDING[index];
                const ratio = DAY_LIMIT > 0 ? spentDay / DAY_LIMIT : 0;
                const baseSpentRatio = Math.min(ratio, 1);
                const overRatio = ratio > 1 ? ratio - 1 : 0;
                const remainingRatio = ratio < 1 ? 1 - ratio : 0;
                const isOver = ratio > 1;

                return (
                  <div className="analytics-weekly-bar" key={label}>
                    <div className="analytics-weekly-bar-track">
                      <div
                        className="analytics-weekly-bar-spent"
                        style={{ flexGrow: baseSpentRatio }}
                      />
                      {isOver ? (
                        <div
                          className="analytics-weekly-bar-over"
                          style={{ flexGrow: overRatio }}
                        />
                      ) : (
                        <div
                          className="analytics-weekly-bar-remaining"
                          style={{ flexGrow: remainingRatio }}
                        />
                      )}
                    </div>

                    <div className="analytics-weekly-bar-amount">
                      {spentDay.toFixed(0)}₼
                    </div>
                    <div className="analytics-weekly-bar-label">{label}</div>

                    {isOver && (
                      <div className="analytics-weekly-bar-warning">
                        +{(ratio * 100 - 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="analytics-weekly-legend">
              <div className="analytics-legend-item">
                <span className="analytics-legend-dot spent" /> Потрачено (до
                лимита)
              </div>
              <div className="analytics-legend-item">
                <span className="analytics-legend-dot remaining" /> Остаток
                лимита
              </div>
              <div className="analytics-legend-item">
                <span className="analytics-legend-dot over" /> Перерасход
              </div>
            </div>
          </section>

          {/* 4. Линейный график баланса */}
          <section className="card analytics-trend-card">
            <div className="analytics-trend-header">
              <h3 className="analytics-title">Динамика баланса</h3>
              <p className="analytics-sub">
                Как менялся доступный баланс внутри последних 7 дней месяца
              </p>
            </div>

            <div className="analytics-trend-chart">
              <svg
                viewBox="0 0 280 80"
                preserveAspectRatio="none"
                className="analytics-trend-svg"
              >
                <polyline
                  className="analytics-trend-line"
                  points={trendPoints}
                />
                {trendValues.map((v, index) => {
                  const x =
                    trendValues.length === 1
                      ? trendWidth / 2
                      : (index / (trendValues.length - 1)) * trendWidth;
                  const norm = (v - trendMin) / trendRange;
                  const y = trendHeight - norm * 60 - 10;
                  return (
                    <circle
                      key={index}
                      className="analytics-trend-dot"
                      cx={x}
                      cy={y}
                      r="3"
                    />
                  );
                })}
              </svg>
            </div>

            <div className="analytics-trend-footer">
              <span className="analytics-trend-caption">
                Левая точка — более ранний день, правая — самый свежий.
              </span>
            </div>
          </section>

          {/* 5. Карточка с ИИ-анализом */}
          <section className="card analytics-ai-card">
            <h3 className="analytics-title">ИИ-анализ расходов</h3>
            <p className="analytics-sub">
              Ассистент смотрит на последние операции и подсказывает, где можно
              сократить траты.
            </p>
            <button
              type="button"
              className="chat-button analytics-ai-button"
              onClick={handleRunAI}
              disabled={!transactions.length}
            >
              Проанализировать операции
            </button>

            {aiText && <p className="analytics-ai-result">{aiText}</p>}
          </section>
        </div>
      );
    }



        // НОВЫЙ БЛОК: История

    if (page === "history") {
      return (
        <div className="home-stack">
          <section className="card">
            <h2 className="analytics-title">История транзакций</h2>
            <p className="analytics-sub">
              Два счёта, объединённые в общий список операций.
            </p>

            <div className="tx-list">
              {transactions.map((tx) => (
                <div key={tx.id} className="tx-row">
                  <div className="tx-main">
                    <div className="tx-title">{tx.description}</div>
                    <div className="tx-meta">
                      {tx.accountName} · {tx.category} ·{" "}
                      {new Date(tx.date).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div
                    className={
                      "tx-amount " +
                      (tx.amount < 0 ? "tx-negative" : "tx-positive")
                    }
                  >
                    {tx.amount < 0 ? "-" : "+"}
                    {Math.abs(tx.amount).toFixed(2)} AZN
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      );
    }
      if (page === "chat") {
        return (
          <div className="home-stack chat-home-wrapper">
            <section className="card chat-card-full-height">
              <Chat
                transactions={transactions}
                loading={loadingTransactions}
                initialMessage={initialChatMessage} // Передаем начальное сообщение
              />
            </section>
          </div>
    );
  } ////////////////////////////////////////////////
    // по умолчанию — главная (home)
    return (
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
          <div className="pie-canvas-wrapper">
            <canvas id="expensesChart"></canvas>
          </div>

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
            <button
  className="chat-button"
  onClick={() => setPage("chat")}
>
  Начать чат
</button>
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
    );
  };

  return (
    <div className="app-root">
      <div className="phone-shell">
        {/* контент */}
        <main className="home-wrapper">{renderPage()}</main>

        {/* нижняя навигация */}
        <nav className="bottom-nav">
          {/* Дом */}
          <button
            className={"nav-item nav-home" + (page === "home" ? " active" : "")}
            type="button"
            onClick={() => setPage("home")}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
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

          {/* Аналитика */}
          <button
            className={
              "nav-item nav-analytics" + (page === "analytics" ? " active" : "")
            }
            type="button"
            onClick={() => setPage("analytics")}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <line
                x1="7"
                y1="17"
                x2="7"
                y2="9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="17"
                x2="12"
                y2="6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="17"
                y1="17"
                x2="17"
                y2="11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect
                x="4"
                y="4"
                width="16"
                height="14"
                rx="3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>

          {/* Центр — ИИ (остаётся в центре) */}
            <button
              className={"nav-item nav-center" + (page === "chat" ? " active" : "")}
              type="button"
              onClick={() => setPage("chat")}
            >
            <div className="nav-center-glow">
              <div className="nav-center-circle">
                <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
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
                  <circle cx="10" cy="13" r="1" fill="currentColor" />
                  <circle cx="14" cy="13" r="1" fill="currentColor" />
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
                  <circle cx="12" cy="4" r="1" fill="currentColor" />
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

          {/* История (линия с двумя стрелками) */}
          <button
            className={
              "nav-item nav-history" + (page === "history" ? " active" : "")
            }
            type="button"
            onClick={() => setPage("history")}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
              <line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <polyline
                points="9 8 5 12 9 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="15 8 19 12 15 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Меню */}
          <button className="nav-item nav-menu" type="button">
            <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
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
