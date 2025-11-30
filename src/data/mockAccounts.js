const ACTIVE_SCENARIO = "saving";
// party rezki scenari
// saving kopit eliyir
// baseline normal adi xercler
const SCENARIO_CONFIGS = {
  baseline: {
    MAIN_SALARY_OCT: 1900,
    MAIN_SALARY_NOV: 1500,
    EXTRA_INCOME_OCT: 250,
    EXTRA_INCOME_NOV: 150,

    RENT: 600,

    GROCERIES_MAIN_BIG: 140,
    GROCERIES_MAIN_SMALL: 90,
    GROCERIES_DAILY_CARD: 35,

    TRANSPORT_MONTH_MAIN: 25,
    TRANSPORT_TAXI_MAIN: 30,
    TRANSPORT_TAXI_DAILY: 18,

    ENTERTAINMENT_MAIN: 80,
    ENTERTAINMENT_SMALL: 60,
    ENTERTAINMENT_DAILY: 45,

    SUBS_INTERNET: 25,
    SUBS_MUSIC: 25,

    SAVINGS_OCT: 200,
    SAVINGS_NOV: 250,

    DAILY_COFFEE: 9,
    DAILY_FASTFOOD: 24,
    DAILY_GIFT: 60,

    // множитель "насколько я жгу деньги" (на развлечения/фастфуд/бар)
    FUN_MULTIPLIER: 1,
  },

  // более экономный режим
  saving: {
    MAIN_SALARY_OCT: 1800,
    MAIN_SALARY_NOV: 1800,
    EXTRA_INCOME_OCT: 200,
    EXTRA_INCOME_NOV: 100,

    RENT: 600,

    GROCERIES_MAIN_BIG: 120,
    GROCERIES_MAIN_SMALL: 80,
    GROCERIES_DAILY_CARD: 30,

    TRANSPORT_MONTH_MAIN: 25,
    TRANSPORT_TAXI_MAIN: 20,
    TRANSPORT_TAXI_DAILY: 12,

    ENTERTAINMENT_MAIN: 50,
    ENTERTAINMENT_SMALL: 30,
    ENTERTAINMENT_DAILY: 20,

    SUBS_INTERNET: 25,
    SUBS_MUSIC: 20,

    SAVINGS_OCT: 250,
    SAVINGS_NOV: 300,

    DAILY_COFFEE: 6,
    DAILY_FASTFOOD: 18,
    DAILY_GIFT: 40,

    FUN_MULTIPLIER: 0.6,
  },

  // режим "тратим много"
  party: {
    MAIN_SALARY_OCT: 1800,
    MAIN_SALARY_NOV: 1800,
    EXTRA_INCOME_OCT: 300,
    EXTRA_INCOME_NOV: 200,

    RENT: 600,

    GROCERIES_MAIN_BIG: 160,
    GROCERIES_MAIN_SMALL: 110,
    GROCERIES_DAILY_CARD: 45,

    TRANSPORT_MONTH_MAIN: 30,
    TRANSPORT_TAXI_MAIN: 40,
    TRANSPORT_TAXI_DAILY: 25,

    ENTERTAINMENT_MAIN: 120,
    ENTERTAINMENT_SMALL: 90,
    ENTERTAINMENT_DAILY: 70,

    SUBS_INTERNET: 30,
    SUBS_MUSIC: 30,

    SAVINGS_OCT: 150,
    SAVINGS_NOV: 180,

    DAILY_COFFEE: 12,
    DAILY_FASTFOOD: 30,
    DAILY_GIFT: 80,

    FUN_MULTIPLIER: 1.5,
  },
};

const C = SCENARIO_CONFIGS[ACTIVE_SCENARIO];

// удобный helper: умножить на FUN_MULTIPLIER и округлить
function fun(amount) {
  return Math.round(amount * (C.FUN_MULTIPLIER ?? 1));
}

// =============================
//   Транзакции по счетам
// =============================

export const accounts = [
  {
    id: "main",
    name: "Основной счёт",
    currency: "AZN",
    transactions: [
      // Октябрь
      {
        id: "main-2025-10-01-salary",
        date: "2025-10-01T09:15:00",
        amount: C.MAIN_SALARY_OCT,
        category: "Зарплата",
        description: "Зарплата за сентябрь",
      },
      {
        id: "main-2025-10-05-freelance",
        date: "2025-10-05T18:20:00",
        amount: C.EXTRA_INCOME_OCT,
        category: "Фриланс",
        description: "Проект по разработке сайта",
      },
      {
        id: "main-2025-10-07-rent",
        date: "2025-10-07T10:00:00",
        amount: -C.RENT,
        category: "Аренда жилья",
        description: "Оплата квартиры",
      },
      {
        id: "main-2025-10-08-groceries",
        date: "2025-10-08T19:12:00",
        amount: -C.GROCERIES_MAIN_SMALL,
        category: "Продукты",
        description: "Супермаркет",
      },
      {
        id: "main-2025-10-10-groceries",
        date: "2025-10-10T20:05:00",
        amount: -C.GROCERIES_MAIN_BIG,
        category: "Продукты",
        description: "Продукты на неделю",
      },
      {
        id: "main-2025-10-12-transport",
        date: "2025-10-12T08:30:00",
        amount: -C.TRANSPORT_MONTH_MAIN,
        category: "Транспорт",
        description: "Проездной",
      },
      {
        id: "main-2025-10-15-internet",
        date: "2025-10-15T13:15:00",
        amount: -C.SUBS_INTERNET,
        category: "Подписки",
        description: "Интернет + мобильная связь",
      },
      {
        id: "main-2025-10-18-ent",
        date: "2025-10-18T21:10:00",
        amount: -fun(C.ENTERTAINMENT_SMALL),
        category: "Развлечения",
        description: "Боулинг с друзьями",
      },
      {
        id: "main-2025-10-25-savings",
        date: "2025-10-25T09:45:00",
        amount: -C.SAVINGS_OCT,
        category: "Накопления",
        description: "Перевод на накопительный счёт",
      },

      // Ноябрь
      {
        id: "main-2025-11-01-salary",
        date: "2025-11-01T09:10:00",
        amount: C.MAIN_SALARY_NOV,
        category: "Зарплата",
        description: "Зарплата за октябрь",
      },
      {
        id: "main-2025-11-03-scholarship",
        date: "2025-11-03T12:00:00",
        amount: C.EXTRA_INCOME_NOV,
        category: "Стипендия",
        description: "Стипендия за учёбу",
      },
      {
        id: "main-2025-11-04-rent",
        date: "2025-11-04T10:05:00",
        amount: -C.RENT,
        category: "Аренда жилья",
        description: "Оплата квартиры",
      },
      {
        id: "main-2025-11-06-groceries",
        date: "2025-11-06T18:23:00",
        amount: -C.GROCERIES_MAIN_BIG,
        category: "Продукты",
        description: "Супермаркет Bravo",
      },
      {
        id: "main-2025-11-09-groceries",
        date: "2025-11-09T19:40:00",
        amount: -C.GROCERIES_MAIN_SMALL,
        category: "Продукты",
        description: "Продукты к выходным",
      },
      {
        id: "main-2025-11-10-transport",
        date: "2025-11-10T08:35:00",
        amount: -C.TRANSPORT_TAXI_MAIN,
        category: "Транспорт",
        description: "Такси до университета",
      },
      {
        id: "main-2025-11-13-health",
        date: "2025-11-13T16:20:00",
        amount: -70, // разовая штука, можно при желании тоже вынести в конфиг
        category: "Здоровье",
        description: "Аптека и витамины",
      },
      {
        id: "main-2025-11-17-ent",
        date: "2025-11-17T20:45:00",
        amount: -fun(C.ENTERTAINMENT_MAIN),
        category: "Развлечения",
        description: "Кино и попкорн",
      },
      {
        id: "main-2025-11-20-subscription",
        date: "2025-11-20T09:00:00",
        amount: -C.SUBS_MUSIC,
        category: "Подписки",
        description: "Музыкальный сервис",
      },
      {
        id: "main-2025-11-22-cash",
        date: "2025-11-22T14:30:00",
        amount: -100,
        category: "Наличные",
        description: "Снятие наличных",
      },
      {
        id: "main-2025-11-26-savings",
        date: "2025-11-26T10:00:00",
        amount: -C.SAVINGS_NOV,
        category: "Накопления",
        description: "Пополнение накопительного счёта",
      },
    ],
  },
  {
    id: "daily",
    name: "Повседневная карта",
    currency: "AZN",
    transactions: [
      // Октябрь
      {
        id: "daily-2025-10-02-coffee",
        date: "2025-10-02T09:05:00",
        amount: -C.DAILY_COFFEE,
        category: "Кофе и перекусы",
        description: "Кофе по пути на учёбу",
      },
      {
        id: "daily-2025-10-03-taxi",
        date: "2025-10-03T22:10:00",
        amount: -C.TRANSPORT_TAXI_DAILY,
        category: "Транспорт",
        description: "Такси вечером",
      },
      {
        id: "daily-2025-10-06-cafe",
        date: "2025-10-06T19:30:00",
        amount: -fun(C.ENTERTAINMENT_DAILY),
        category: "Кафе",
        description: "Ужин в кафе",
      },
      {
        id: "daily-2025-10-09-supermarket",
        date: "2025-10-09T17:45:00",
        amount: -C.GROCERIES_DAILY_CARD,
        category: "Продукты",
        description: "Маленький супермаркет",
      },
      {
        id: "daily-2025-10-20-fastfood",
        date: "2025-10-20T20:15:00",
        amount: -fun(C.DAILY_FASTFOOD),
        category: "Фастфуд",
        description: "Бургерная",
      },
      {
        id: "daily-2025-10-29-cinema",
        date: "2025-10-29T21:00:00",
        amount: -fun(C.ENTERTAINMENT_SMALL),
        category: "Развлечения",
        description: "Попкорн в кино",
      },

      // Ноябрь
      {
        id: "daily-2025-11-02-coffee",
        date: "2025-11-02T10:00:00",
        amount: -C.DAILY_COFFEE,
        category: "Кофе и перекусы",
        description: "Кофе с круассаном",
      },
      {
        id: "daily-2025-11-05-taxi",
        date: "2025-11-05T23:05:00",
        amount: -C.TRANSPORT_TAXI_DAILY,
        category: "Транспорт",
        description: "Такси домой",
      },
      {
        id: "daily-2025-11-08-fastfood",
        date: "2025-11-08T19:50:00",
        amount: -fun(C.DAILY_FASTFOOD),
        category: "Фастфуд",
        description: "Пицца с друзьями",
      },
      {
        id: "daily-2025-11-11-supermarket",
        date: "2025-11-11T18:10:00",
        amount: -C.GROCERIES_DAILY_CARD,
        category: "Продукты",
        description: "Супермаркет",
      },
      {
        id: "daily-2025-11-15-gifts",
        date: "2025-11-15T15:30:00",
        amount: -C.DAILY_GIFT,
        category: "Подарки",
        description: "Подарок другу",
      },
      {
        id: "daily-2025-11-19-coffee",
        date: "2025-11-19T09:40:00",
        amount: -C.DAILY_COFFEE,
        category: "Кофе и перекусы",
        description: "Кофе",
      },
      {
        id: "daily-2025-11-24-taxi",
        date: "2025-11-24T21:20:00",
        amount: -C.TRANSPORT_TAXI_DAILY,
        category: "Транспорт",
        description: "Такси после мероприятия",
      },
      {
        id: "daily-2025-11-28-bar",
        date: "2025-11-28T22:45:00",
        amount: -fun(C.ENTERTAINMENT_DAILY),
        category: "Развлечения",
        description: "Вечер в баре",
      },
    ],
  },
];

export default accounts;