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

export async function analyzeTransactionsWithLLM(
  transactions,
  userMessage,
  apiKey
) {
  if (!apiKey) {
    return {
      text: "Пожалуйста, введите OpenAI API ключ для использования этой функции.",
    };
  }

  if (!transactions || !transactions.length) {
    return { text: "Пока нет данных по транзакциям для анализа." };
  }

  const systemPrompt = buildTransactionsPrompt(transactions);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Можно выбрать другую модель, если необходимо
        messages: messages,
        temperature: 0.7, // Настройте по желанию
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return {
        text: `Ошибка при обращении к OpenAI API: ${
          errorData.error.message || response.statusText
        }`,
      };
    }

    const data = await response.json();
    const assistantReply = data.choices[0].message.content;

    return { text: assistantReply };
  } catch (error) {
    console.error("Error analyzing transactions with LLM:", error);
    return {
      text: "Произошла ошибка при анализе транзакций с помощью ИИ. Попробуйте снова.",
    };
  }
}
