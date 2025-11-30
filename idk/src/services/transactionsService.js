// src/services/transactionsService.js
import { accounts } from "../data/mockAccounts";

// вернуть счета (если вдруг нужно где-то показать)
export function getAllAccounts() {
  return accounts;
}

// объединить ВСЕ транзакции, добавить имя счёта и отсортировать по дате (новые сверху)
export function getAllTransactions() {
  const merged = [];

  accounts.forEach((acc) => {
    acc.transactions.forEach((tx) => {
      merged.push({
        ...tx,
        accountId: acc.id,
        accountName: acc.name,
      });
    });
  });

  merged.sort((a, b) => new Date(b.date) - new Date(a.date));
  return merged;
}

function monthKeyFromDate(dateStr) {
  // "2025-11-06T..." -> "2025-11"
  return dateStr.slice(0, 7);
}

export function getLatestMonthKey(transactions) {
  if (!transactions || !transactions.length) return null;
  const monthsSet = new Set(transactions.map((tx) => monthKeyFromDate(tx.date)));
  const months = Array.from(monthsSet).sort();
  return months[months.length - 1];
}

// сводка за один месяц (по умолчанию — последний в данных)
export function getMonthlySummary(transactions, monthKey) {
  if (!transactions || !transactions.length) return null;

  const key = monthKey || getLatestMonthKey(transactions);
  if (!key) return null;

  let income = 0;
  let expense = 0;

  transactions.forEach((tx) => {
    if (!tx.date.startsWith(key)) return;
    if (tx.amount >= 0) income += tx.amount;
    else expense += -tx.amount;
  });

  const net = income - expense;
  const label = formatMonthRu(key);

  return { monthKey: key, label, income, expense, net };
}

// сгруппировать расходы по категориям (для ИИ/аналитики)
export function groupExpensesByCategory(transactions, monthKey) {
  if (!transactions || !transactions.length) return [];
  const key = monthKey || getLatestMonthKey(transactions);
  if (!key) return [];

  const groups = {};

  transactions.forEach((tx) => {
    if (!tx.date.startsWith(key)) return;
    if (tx.amount >= 0) return; // только расходы
    const name = tx.category || "Другое";
    if (!groups[name]) groups[name] = 0;
    groups[name] += -tx.amount;
  });

  return Object.entries(groups)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}

function formatMonthRu(monthKey) {
  const [y, m] = monthKey.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("ru-RU", { month: "long", year: "numeric" });
}
