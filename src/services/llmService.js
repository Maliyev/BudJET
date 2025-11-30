// src/services/llmService.js
import {
  getLatestMonthKey,
  groupExpensesByCategory,
} from "./transactionsService";

// Строим prompt, который потом можно отправить в backend с OpenAI
export function buildTransactionsPrompt(transactions) {
  if (!transactions || !transactions.length) {
    return "Нет транзакций для анализа.";
  }

  const monthKey = getLatestMonthKey(transactions);
  const [y, m] = monthKey.split("-");
  const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  const header = `Транзакции пользователя за ${label}. Формат: дата-время | счёт | категория | сумма AZN | описание`;

  const lines = transactions
    .filter((tx) => tx.date.startsWith(monthKey))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((tx) => {
      const sign = tx.amount < 0 ? "-" : "+";
      const amount = Math.abs(tx.amount).toFixed(2);
      const dt = new Date(tx.date).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${dt} | ${tx.accountName} | ${tx.category} | ${sign}${amount} AZN | ${tx.description}`;
    });

  return `
Ты — персональный финансовый ассистент.

${header}

${lines.join("\n")}

Задача:
1) Найди основные категории расходов и сколько в AZN/месяц уходит на каждую.
2) Укажи регулярные платежи (подписки, аренда, проезд и т.п.).
3) Предложи 3–5 конкретных идей, где можно сократить траты без серьёзного дискомфорта.
4) Отметь любые потенциально опасные паттерны (перерасход, частое снятие наличных, импульсивные покупки ночью и т.п.).

Отвечай по-русски, короткими абзацами, без таблиц.
`;
}

// Пока без реального OpenAI: делаем простой "анализ" на фронте + логируем prompt.
export async function mockAnalyzeTransactions(transactions) {
  if (!transactions || !transactions.length) {
    return { prompt: "", text: "Пока нет данных по транзакциям." };
  }

  const prompt = buildTransactionsPrompt(transactions);

  const monthKey = getLatestMonthKey(transactions);
  const groups = groupExpensesByCategory(transactions, monthKey);
  const totalExpenses = groups.reduce((sum, g) => sum + g.total, 0);

  const top3 = groups.slice(0, 3).map((g) => {
    const pct = totalExpenses ? Math.round((g.total / totalExpenses) * 100) : 0;
    return { ...g, pct };
  });

  const lines = top3
    .map(
      (g) => `• ${g.name}: ${g.total.toFixed(0)} AZN (${g.pct}% всех расходов)`
    )
    .join("\n");

  const text =
    `Сейчас основная часть расходов уходит в категории:\n${lines}\n\n` +
    `Если сократить траты хотя бы на 10–15% в этих категориях, итоговый баланс за месяц заметно улучшится. ` +
    `Сюда позже можно будет подставить живой ответ от LLM на основе этого же списка транзакций.`;

  console.log("=== Prompt для LLM ===\n", prompt);

  return { prompt, text };
}
