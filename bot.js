require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

const ADMIN_ID = parseInt(process.env.ADMIN_ID || "0");
const CHANNEL_LINK = process.env.CHANNEL_LINK || "https://t.me/your_channel";
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME || "your_channel"; // без @

// ─────────────────────────────────────────
// ТОВАРЫ
// ─────────────────────────────────────────
const toys = [
  { id: 1, name: { ru: "Конструктор LEGO City", uz: "LEGO City konstruktori", en: "LEGO City Constructor" }, desc: { ru: "Развивает логику и фантазию. От 5 лет.", uz: "Mantiq va tasavvurni rivojlantiradi. 5 yoshdan.", en: "Develops logic and imagination. From 5 years." }, gender: "boy", minAge: 5, maxAge: 12, price: 250000, photo: "https://placehold.co/400x300.png?text=LEGO+City", emoji: "🧱" },
  { id: 2, name: { ru: "Кукла Барби Принцесса", uz: "Barbie Malika qo'g'irchoq", en: "Barbie Princess Doll" }, desc: { ru: "Красивая кукла с аксессуарами. От 3 лет.", uz: "Aksessuarlar bilan chiroyli qo'g'irchoq. 3 yoshdan.", en: "Beautiful doll with accessories. From 3 years." }, gender: "girl", minAge: 3, maxAge: 10, price: 180000, photo: "https://placehold.co/400x300.png?text=Barbie", emoji: "👑" },
  { id: 3, name: { ru: "Машинка Hot Wheels", uz: "Hot Wheels mashinasi", en: "Hot Wheels Car" }, desc: { ru: "Крутая гоночная машинка. От 3 лет.", uz: "Ajoyib poyga mashinasi. 3 yoshdan.", en: "Cool racing car. From 3 years." }, gender: "boy", minAge: 3, maxAge: 10, price: 95000, photo: "https://placehold.co/400x300.png?text=Hot+Wheels", emoji: "🏎️" },
  { id: 4, name: { ru: "Набор для рисования", uz: "Rasm chizish to'plami", en: "Drawing Set" }, desc: { ru: "Краски, карандаши и раскраски. От 4 лет.", uz: "Bo'yoqlar, qalam va rasm kitoblari. 4 yoshdan.", en: "Paints, pencils and coloring books. From 4 years." }, gender: "girl", minAge: 4, maxAge: 12, price: 120000, photo: "https://placehold.co/400x300.png?text=Drawing+Set", emoji: "🎨" },
  { id: 5, name: { ru: "Робот-трансформер", uz: "Robot-transformer", en: "Transformer Robot" }, desc: { ru: "Интерактивный робот со звуком и светом. От 6 лет.", uz: "Ovoz va yorug'lik bilan interaktiv robot. 6 yoshdan.", en: "Interactive robot with sound and light. From 6 years." }, gender: "boy", minAge: 6, maxAge: 14, price: 320000, photo: "https://placehold.co/400x300.png?text=Robot", emoji: "🤖" },
  { id: 6, name: { ru: "Кухня игрушечная", uz: "O'yinchoq oshxona", en: "Toy Kitchen" }, desc: { ru: "Мини-кухня с посудой и продуктами. От 3 лет.", uz: "Idish-tovoq va oziq-ovqat bilan mini oshxona. 3 yoshdan.", en: "Mini kitchen with dishes and food. From 3 years." }, gender: "girl", minAge: 3, maxAge: 8, price: 280000, photo: "https://placehold.co/400x300.png?text=Kitchen", emoji: "🍳" },
  { id: 7, name: { ru: "Мягкая игрушка Мишка", uz: "Yumshoq o'yinchoq Ayiqcha", en: "Soft Teddy Bear" }, desc: { ru: "Большой плюшевый медведь. От 1 года.", uz: "Katta yumshoq ayiq. 1 yoshdan.", en: "Big plush teddy bear. From 1 year." }, gender: "any", minAge: 1, maxAge: 10, price: 150000, photo: "https://placehold.co/400x300.png?text=Teddy+Bear", emoji: "🧸" },
  { id: 8, name: { ru: "Пазл 100 деталей", uz: "100 qismli pazl", en: "100-piece Puzzle" }, desc: { ru: "Красочный пазл с животными. От 5 лет.", uz: "Hayvonlar bilan rangli pazl. 5 yoshdan.", en: "Colorful animal puzzle. From 5 years." }, gender: "any", minAge: 5, maxAge: 12, price: 85000, photo: "https://placehold.co/400x300.png?text=Puzzle", emoji: "🧩" },
];

// ─────────────────────────────────────────
// СОСТОЯНИЕ ПОЛЬЗОВАТЕЛЕЙ
// ─────────────────────────────────────────
const users = {};
let busyMode = false;

function getUser(id) {
  if (!users[id]) users[id] = { lang: "ru", cart: [], step: null, pendingOrder: null };
  return users[id];
}
function L(id) { return getUser(id).lang || "ru"; }
function sum(price, l) { return `${price.toLocaleString()} ${{ ru: "сум", uz: "so'm", en: "UZS" }[l]}`; }

// ─────────────────────────────────────────
// УВЕДОМЛЕНИЕ АДМИНУ В TELEGRAM
// ─────────────────────────────────────────
async function notify(ctx, text) {
  if (!ADMIN_ID) return;
  const u = ctx.from;
  const who = `👤 ${u.first_name}${u.last_name ? " " + u.last_name : ""}${u.username ? " (@" + u.username + ")" : ""} [ID: ${u.id}]`;
  await ctx.telegram.sendMessage(ADMIN_ID, `${who}\n\n${text}`, { parse_mode: "HTML" }).catch(() => {});
}

// ─────────────────────────────────────────
// КЛАВИАТУРА ГЛАВНОГО МЕНЮ
// ─────────────────────────────────────────
function menuKb(l) {
  const labels = {
    ru: ["🧸 Подобрать игрушку", "🛍 Корзина", "❓ Помощь", "📢 Наш канал", "🌐 Язык"],
    uz: ["🧸 O'yinchoq tanlash", "🛍 Savat", "❓ Yordam", "📢 Kanalimiz", "🌐 Til"],
    en: ["🧸 Find a toy", "🛍 Cart", "❓ Help", "📢 Our channel", "🌐 Language"],
  };
  const lb = labels[l];
  return Markup.keyboard([[lb[0]], [lb[1], lb[2]], [lb[3], lb[4]]]).resize();
}

// ─────────────────────────────────────────
// /start
// ─────────────────────────────────────────
bot.start(async (ctx) => {
  const id = ctx.from.id;
  users[id] = { lang: "ru", cart: [], step: null, pendingOrder: null };
  await notify(ctx, "🟢 Нажал <b>/start</b> — зашёл в бот");
  await ctx.reply("🌐 Выберите язык / Tilni tanlang / Choose language:", Markup.inlineKeyboard([
    [Markup.button.callback("🇷🇺 Русский", "lang_ru"), Markup.button.callback("🇺🇿 O'zbek", "lang_uz"), Markup.button.callback("🇬🇧 English", "lang_en")],
  ]));
});

// ─────────────────────────────────────────
// ВЫБОР ЯЗЫКА
// ─────────────────────────────────────────
bot.action(/^lang_(.+)$/, async (ctx) => {
  const id = ctx.from.id;
  const l = ctx.match[1];
  getUser(id).lang = l;
  await ctx.editMessageText({ ru: "✅ Русский язык выбран 🇷🇺", uz: "✅ O'zbek tili tanlandi 🇺🇿", en: "✅ English selected 🇬🇧" }[l]);
  await notify(ctx, `🌐 Выбрал язык: <b>${l}</b>`);

  const welcome = {
    ru: "🎉 Добро пожаловать в <b>ToyShop Uzbekistan</b>! 🧸\n\nМы поможем найти идеальную игрушку для вашего ребёнка 💝\n\nВыберите действие ниже 👇",
    uz: "🎉 <b>ToyShop Uzbekistan</b>ga xush kelibsiz! 🧸\n\nBiz farzandingiz uchun ideal o'yinchoqni topamiz 💝\n\nQuyidan tanlang 👇",
    en: "🎉 Welcome to <b>ToyShop Uzbekistan</b>! 🧸\n\nWe'll help find the perfect toy for your child 💝\n\nChoose below 👇",
  };
  await ctx.reply(welcome[l], { parse_mode: "HTML", ...menuKb(l) });

  // Мягкое приглашение в канал
  const inviteText = {
    ru: "💡 Кстати, в нашем канале ещё больше игрушек, скидки и новинки!\n🎁 Загляните — вам понравится 😊",
    uz: "💡 Kanalimizda yanada ko'proq o'yinchoqlar, chegirmalar va yangiliklar bor!\n🎁 Bir qarang — yoqadi 😊",
    en: "💡 Our channel has even more toys, discounts and new arrivals!\n🎁 Check it out — you'll love it 😊",
  };
  await ctx.reply(inviteText[l], Markup.inlineKeyboard([
    [Markup.button.url({ ru: "📢 Перейти в канал", uz: "📢 Kanalga o'tish", en: "📢 Go to channel" }[l], CHANNEL_LINK)],
    [Markup.button.callback({ ru: "➡️ Продолжить", uz: "➡️ Davom etish", en: "➡️ Continue" }[l], "skip_channel")],
  ]));
});

bot.action("skip_channel", async (ctx) => {
  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  await ctx.answerCbQuery("👍");
});

// ─────────────────────────────────────────
// СМЕНА ЯЗЫКА
// ─────────────────────────────────────────
bot.hears(/🌐/, async (ctx) => {
  await ctx.reply("🌐 Выберите язык / Tilni tanlang / Choose language:", Markup.inlineKeyboard([
    [Markup.button.callback("🇷🇺 Русский", "lang_ru"), Markup.button.callback("🇺🇿 O'zbek", "lang_uz"), Markup.button.callback("🇬🇧 English", "lang_en")],
  ]));
});

// ─────────────────────────────────────────
// ПОДОБРАТЬ ИГРУШКУ
// ─────────────────────────────────────────
bot.hears(/🧸/, async (ctx) => {
  const id = ctx.from.id;
  const l = L(id);
  getUser(id).step = "gender";
  await notify(ctx, "🧸 Нажал <b>Подобрать игрушку</b>");
  await ctx.reply({ ru: "👶 Для кого ищем игрушку?", uz: "👶 Kim uchun o'yinchoq?", en: "👶 Who are we shopping for?" }[l], Markup.inlineKeyboard([
    [Markup.button.callback({ ru: "👦 Мальчик", uz: "👦 O'g'il bola", en: "👦 Boy" }[l], "g_boy"), Markup.button.callback({ ru: "👧 Девочка", uz: "👧 Qiz bola", en: "👧 Girl" }[l], "g_girl")],
  ]));
});

bot.action(/^g_(boy|girl)$/, async (ctx) => {
  const id = ctx.from.id;
  const l = L(id);
  const gender = ctx.match[1];
  getUser(id).gender = gender;
  getUser(id).step = "age";
  const emoji = gender === "boy" ? "👦" : "👧";
  await ctx.editMessageText(`${emoji} ${{ ru: { boy: "Мальчик", girl: "Девочка" }, uz: { boy: "O'g'il bola", girl: "Qiz bola" }, en: { boy: "Boy", girl: "Girl" } }[l][gender]}`);
  await notify(ctx, `${emoji} Выбрал пол: <b>${gender}</b>`);
  await ctx.reply({ ru: "✏️ Введите возраст ребёнка (например: <b>1-16</b>)", uz: "✏️ Bolaning yoshini kiriting ( <b>1-16</b>)", en: "✏️ Enter the child's age ( <b>1-16</b>)" }[l], { parse_mode: "HTML" });
});

// ─────────────────────────────────────────
// КОРЗИНА — ПОКАЗАТЬ
// ─────────────────────────────────────────
bot.hears(/🛍/, async (ctx) => {
  const id = ctx.from.id;
  const l = L(id);
  const cart = getUser(id).cart;
  await notify(ctx, "🛍 Открыл <b>Корзину</b>");

  if (!cart || cart.length === 0) {
    return ctx.reply({ ru: "🛒 Ваша корзина пуста.", uz: "🛒 Savatingiz bo'sh.", en: "🛒 Your cart is empty." }[l]);
  }

  let text = { ru: "🛍 <b>Ваша корзина:</b>\n\n", uz: "🛍 <b>Sizning savatingiz:</b>\n\n", en: "🛍 <b>Your cart:</b>\n\n" }[l];
  let total = 0;
  cart.forEach((toy, i) => {
    text += `${i + 1}. ${toy.emoji} ${toy.name[l]} — <b>${sum(toy.price, l)}</b>\n`;
    total += toy.price;
  });
  text += `\n💰 ${{ ru: "Итого", uz: "Jami", en: "Total" }[l]}: <b>${sum(total, l)}</b>`;

  await ctx.reply(text, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      [Markup.button.callback({ ru: "✅ Оформить заказ", uz: "✅ Buyurtma berish", en: "✅ Checkout" }[l], "checkout")],
      [Markup.button.callback({ ru: "🗑 Очистить", uz: "🗑 Tozalash", en: "🗑 Clear" }[l], "clear_cart")],
    ]),
  });
});

// ─────────────────────────────────────────
// ОФОРМИТЬ ЗАКАЗ ИЗ КОРЗИНЫ
// ─────────────────────────────────────────
bot.action("checkout", async (ctx) => {
  const id = ctx.from.id;
  const l = L(id);
  const cart = getUser(id).cart;
  if (!cart || cart.length === 0) return ctx.answerCbQuery("Корзина пуста");

  getUser(id).step = "delivery_type";
  getUser(id).orderSource = "cart";
  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

  await ctx.reply({ ru: "🚚 Как хотите получить заказ?", uz: "🚚 Buyurtmani qanday olmoqchisiz?", en: "🚚 How would you like to receive your order?" }[l], Markup.inlineKeyboard([
    [Markup.button.callback({ ru: "🚚 Доставка", uz: "🚚 Yetkazib berish", en: "🚚 Delivery" }[l], "delivery_yes")],
    [Markup.button.callback({ ru: "🏪 Самовывоз", uz: "🏪 O'zi olib ketish", en: "🏪 Pickup" }[l], "delivery_no")],
  ]));
});

// ─────────────────────────────────────────
// ЗАКАЗАТЬ ОДНУ ИГРУШКУ (кнопка на карточке)
// ─────────────────────────────────────────
bot.action(/^order_(\d+)$/, async (ctx) => {
  const id = ctx.from.id;
  const l = L(id);
  const toyId = parseInt(ctx.match[1]);
  const toy = toys.find(t => t.id === toyId);
  if (!toy) return ctx.answerCbQuery("Товар не найден");

  getUser(id).step = "delivery_type";
  getUser(id).orderSource = "single";
  getUser(id).pendingOrder = toy;
  await ctx.answerCbQuery();

  await ctx.reply({ ru: "🚚 Как хотите получить заказ?", uz: "🚚 Buyurtmani qanday olmoqchisiz?", en: "🚚 How would you like to receive your order?" }[l], Markup.inlineKeyboard([
    [Markup.button.callback({ ru: "🚚 Доставка", uz: "🚚 Yetkazib berish", en: "🚚 Delivery" }[l], "delivery_yes")],
    [Markup.button.callback({ ru: "🏪 Самовывоз", uz: "🏪 O'zi olib ketish", en: "🏪 Pickup" }[l], "delivery_no")],
  ]));
});

// ─────────────────────────────────────────
// САМОВЫВОЗ
// ─────────────────────────────────────────
bot.action("delivery_no", async (ctx) => {
  const id = ctx.from.id;
  const l = L(id);
  const user = getUser(id);
  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

  const addressText = {
    ru: "🏪 <b>Самовывоз</b>\n\n📍 Адрес: <b>г. Ташкент, рынок Ecobozor ул. Тимура малика</b>\n🕐 Режим работы: 09:00 – 22:00\n\n✅ Ваш заказ подтверждён! Ждём вас 😊",
    uz: "🏪 <b>O'zi olib ketish</b>\n\n📍 Manzil: <b>Toshkent sh., Ecobozor  Temur Malik ko'ch. 1</b>\n🕐 Ish vaqti: 09:00 – 22:00\n\n✅ Buyurtmangiz tasdiqlandi! Sizni kutamiz 😊",
    en: "🏪 <b>Pickup</b>\n\n📍 Address: <b>Tashkent, Ecobozor  St. Temur Malik</b>\n🕐 Working hours: 09:00 – 22:00\n\n✅ Your order is confirmed! We're waiting for you 😊",
  };
  await ctx.reply(addressText[l], { parse_mode: "HTML" });

  // Уведомление админу
  const items = user.orderSource === "cart" ? user.cart : [user.pendingOrder];
  let orderInfo = buildOrderText(ctx.from, items, l, "pickup", null);
  await notify(ctx, orderInfo);

  if (user.orderSource === "cart") user.cart = [];
  user.step = null;
  user.pendingOrder = null;
});

// ─────────────────────────────────────────
// ДОСТАВКА — ВЫБОР СПОСОБА ОПЛАТЫ
// ─────────────────────────────────────────
bot.action("delivery_yes", async (ctx) => {
  const id = ctx.from.id;
  const l = L(id);
  getUser(id).step = "payment";
  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

  await ctx.reply({ ru: "💳 Выберите способ оплаты:", uz: "💳 To'lov usulini tanlang:", en: "💳 Choose payment method:" }[l], Markup.inlineKeyboard([
    [Markup.button.callback("💳 Payme", "pay_payme"), Markup.button.callback("💳 Click", "pay_click")],
    [Markup.button.callback({ ru: "💸 Перевод на карту", uz: "💸 Kartaga o'tkazma", en: "💸 Card transfer" }[l], "pay_card")],
  ]));
});

// ─────────────────────────────────────────
// СПОСОБ ОПЛАТЫ ВЫБРАН
// ─────────────────────────────────────────
bot.action(/^pay_(payme|click|card)$/, async (ctx) => {
  const id = ctx.from.id;
  const l = L(id);
  const method = ctx.match[1];
  const user = getUser(id);
  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

  const payDetails = {
    payme: {
      ru: "💳 <b>Оплата через Payme</b>\n\n🔗 Ссылка: <a href='https://payme.uz'>payme.uz</a>\n📱 Номер карты: <b>8600 XXXX XXXX XXXX</b>\n💰 Переведите сумму заказа и отправьте скриншот",
      uz: "💳 <b>Payme orqali to'lov</b>\n\n🔗 Havola: <a href='https://payme.uz'>payme.uz</a>\n📱 Karta raqami: <b>8600 XXXX XXXX XXXX</b>\n💰 Buyurtma summasini o'tkazing va screenshot yuboring",
      en: "💳 <b>Payment via Payme</b>\n\n🔗 Link: <a href='https://payme.uz'>payme.uz</a>\n📱 Card: <b>8600 XXXX XXXX XXXX</b>\n💰 Transfer the order amount and send a screenshot",
    },
    click: {
      ru: "💳 <b>Оплата через Click</b>\n\n🔗 Ссылка: <a href='https://click.uz'>click.uz</a>\n📱 Номер карты: <b>9860 XXXX XXXX XXXX</b>\n💰 Переведите сумму заказа и отправьте скриншот",
      uz: "💳 <b>Click orqali to'lov</b>\n\n🔗 Havola: <a href='https://click.uz'>click.uz</a>\n📱 Karta raqami: <b>9860 XXXX XXXX XXXX</b>\n💰 Buyurtma summasini o'tkazing va screenshot yuboring",
      en: "💳 <b>Payment via Click</b>\n\n🔗 Link: <a href='https://click.uz'>click.uz</a>\n📱 Card: <b>9860 XXXX XXXX XXXX</b>\n💰 Transfer the order amount and send a screenshot",
    },
    card: {
      ru: "💸 <b>Перевод на карту</b>\n\n📱 Номер карты: <b>8600 XXXX XXXX XXXX</b>\n👤 Получатель: <b>Имя Фамилия</b>\n💰 Переведите сумму заказа и отправьте скриншот",
      uz: "💸 <b>Kartaga o'tkazma</b>\n\n📱 Karta raqami: <b>8600 XXXX XXXX XXXX</b>\n👤 Egasi: <b>Ism Familiya</b>\n💰 Buyurtma summasini o'tkazing va screenshot yuboring",
      en: "💸 <b>Card transfer</b>\n\n📱 Card number: <b>8600 XXXX XXXX XXXX</b>\n👤 Holder: <b>First Last Name</b>\n💰 Transfer the order amount and send a screenshot",
    },
  };

  await ctx.reply(payDetails[method][l], { parse_mode: "HTML" });

  const confirmText = {
    ru: "📸 После оплаты отправьте скриншот в этот чат для подтверждения.\n\n✅ Ваш заказ принят! Ждём оплату 😊",
    uz: "📸 To'lovdan keyin ushbu chatga screenshot yuboring.\n\n✅ Buyurtmangiz qabul qilindi! To'lovni kutamiz 😊",
    en: "📸 After payment, send a screenshot in this chat for confirmation.\n\n✅ Your order is accepted! Awaiting payment 😊",
  };
  await ctx.reply(confirmText[l], { parse_mode: "HTML" });

  // Уведомление админу
  const items = user.orderSource === "cart" ? user.cart : [user.pendingOrder];
  const methodNames = { payme: "Payme", click: "Click", card: { ru: "Перевод на карту", uz: "Kartaga o'tkazma", en: "Card transfer" }[l] };
  let orderInfo = buildOrderText(ctx.from, items, l, "delivery", methodNames[method]);
  await notify(ctx, orderInfo);

  if (user.orderSource === "cart") user.cart = [];
  user.step = null;
  user.pendingOrder = null;
  user.step = "await_screenshot";
});

// ─────────────────────────────────────────
// В КОРЗИНУ (кнопка на карточке)
// ─────────────────────────────────────────
bot.action(/^cart_(\d+)$/, async (ctx) => {
  const id = ctx.from.id;
  const l = L(id);
  const toyId = parseInt(ctx.match[1]);
  const toy = toys.find(t => t.id === toyId);
  if (!toy) return ctx.answerCbQuery("Товар не найден");
  const user = getUser(id);
  if (!user.cart) user.cart = [];
  user.cart.push(toy);
  await ctx.answerCbQuery({ ru: `✅ ${toy.name.ru} добавлен в корзину!`, uz: `✅ ${toy.name.uz} savatga qo'shildi!`, en: `✅ ${toy.name.en} added to cart!` }[l]);
  await notify(ctx, `🛍 Добавил в корзину: <b>${toy.name.ru}</b> — ${sum(toy.price, "ru")}`);
});

// ─────────────────────────────────────────
// ОЧИСТИТЬ КОРЗИНУ
// ─────────────────────────────────────────
bot.action("clear_cart", async (ctx) => {
  const id = ctx.from.id;
  const l = L(id);
  getUser(id).cart = [];
  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  await ctx.reply({ ru: "🗑 Корзина очищена.", uz: "🗑 Savat tozalandi.", en: "🗑 Cart cleared." }[l]);
});

// ─────────────────────────────────────────
// ПОМОЩЬ
// ─────────────────────────────────────────
bot.hears(/❓/, async (ctx) => {
  const l = L(ctx.from.id);
  const help = {
    ru: `❓ <b>Помощь</b>\n\n🧸 <b>Как заказать:</b>\n1. Нажмите «Подобрать игрушку»\n2. Выберите пол и введите возраст\n3. Выберите игрушку и нажмите «Заказать»\n4. Выберите: доставка или самовывоз\n5. Если доставка — выберите способ оплаты\n\n📞 <b>Контакт:</b> @@Kadirov_k_h\n📢 <b>Канал:</b> @Номер телефона: +998977735225\n🕐 <b>Работаем:</b> 09:00 – 22:00`,
    uz: `❓ <b>Yordam</b>\n\n🧸 <b>Buyurtma berish:</b>\n1. «O'yinchoq tanlash» tugmasini bosing\n2. Jins va yoshni kiriting\n3. O'yinchoqni tanlang va «Buyurtma berish» tugmasini bosing\n4. Yetkazib berish yoki o'zi olib ketishni tanlang\n5. Yetkazib berish bo'lsa — to'lov usulini tanlang\n\n📞 <b>Aloqa:</b> @@Kadirov_k_h\n📢 <b>Aloqa uchun: +998977735225\n🕐 <b>Ish vaqti:</b> 09:00 – 22:00`,
    en: `❓ <b>Help</b>\n\n🧸 <b>How to order:</b>\n1. Press «Find a toy»\n2. Choose gender and enter age\n3. Pick a toy and press «Order»\n4. Choose: delivery or pickup\n5. If delivery — choose payment method\n\n📞 <b>Contact:</b> @@Kadirov_k_h\n📢 <>Phone number: +998977735225\n🕐 <b>Hours:</b> 09:00 – 22:00`,
  };
  await ctx.reply(help[l], { parse_mode: "HTML" });
});

// ─────────────────────────────────────────
// НАШ КАНАЛ
// ─────────────────────────────────────────
bot.hears(/📢/, async (ctx) => {
  const l = L(ctx.from.id);
  const text = { ru: "📢 Наш канал — скидки, новинки и акции!", uz: "📢 Kanalimiz — chegirmalar, yangiliklar!", en: "📢 Our channel — discounts and new arrivals!" }[l];
  await ctx.reply(text, Markup.inlineKeyboard([[Markup.button.url({ ru: "Перейти в канал", uz: "Kanalga o'tish", en: "Go to channel" }[l], CHANNEL_LINK)]]));
});

// ─────────────────────────────────────────
// ТЕКСТОВЫЕ СООБЩЕНИЯ (возраст + скриншот)
// ─────────────────────────────────────────
bot.on("text", async (ctx) => {
  const id = ctx.from.id;
  const user = getUser(id);
  const l = user.lang || "ru";
  const text = ctx.message.text.trim();

  // Пропускаем кнопки меню и команды
  if (["🧸","🛍","❓","📢","🌐","/"].some(p => text.startsWith(p))) return;

  // ── Ввод возраста ──
  if (user.step === "age") {
    const age = parseInt(text);
    if (isNaN(age) || age < 1 || age > 16) {
      return ctx.reply({ ru: "⚠️ Введите число от 1 до 16.", uz: "⚠️ 1 dan 16 gacha raqam kiriting.", en: "⚠️ Please enter a number from 1 to 16." }[l]);
    }
    user.age = age;
    user.step = null;
    await notify(ctx, `📅 Ввёл возраст: <b>${age}</b>`);

    const searching = await ctx.reply({ ru: "🔍 Ищу подходящие игрушки...", uz: "🔍 Mos o'yinchoqlarni qidiryapman...", en: "🔍 Searching for suitable toys..." }[l]);
    const found = toys.filter(t => (t.gender === "any" || t.gender === user.gender) && age >= t.minAge && age <= t.maxAge);
    await ctx.telegram.deleteMessage(ctx.chat.id, searching.message_id).catch(() => {});

    if (!found.length) {
      return ctx.reply({ ru: "😔 По вашему запросу ничего не найдено. Попробуйте другие параметры.", uz: "😔 So'rovingiz bo'yicha hech narsa topilmadi.", en: "😔 Nothing found. Try different parameters." }[l], Markup.inlineKeyboard([
        [Markup.button.callback({ ru: "🔄 Искать снова", uz: "🔄 Qayta qidirish", en: "🔄 Search again" }[l], "search_again")],
      ]));
    }

    await ctx.reply({ ru: `✅ Нашёл ${found.length} игрушек для вас:`, uz: `✅ Siz uchun ${found.length} ta o'yinchoq topildi:`, en: `✅ Found ${found.length} toys for you:` }[l]);
    for (const toy of found) {
      const caption = `${toy.emoji} <b>${toy.name[l]}</b>\n\n📝 ${toy.desc[l]}\n\n💰 <b>${sum(toy.price, l)}</b>`;
      try {
        await ctx.replyWithPhoto(toy.photo, {
          caption, parse_mode: "HTML",
          ...Markup.inlineKeyboard([[
            Markup.button.callback({ ru: "🛒 Заказать", uz: "🛒 Buyurtma berish", en: "🛒 Order" }[l], `order_${toy.id}`),
            Markup.button.callback({ ru: "🛍 В корзину", uz: "🛍 Savatga", en: "🛍 Add to cart" }[l], `cart_${toy.id}`),
          ]]),
        });
      } catch (error) {
        console.error('Failed to send photo:', toy.photo, error);
        await ctx.reply(`${caption}\n\n⚠️ ${ { ru: 'Не удалось загрузить изображение.', uz: "Rasmni yuklab bo'lmadi.", en: 'Failed to load image.' }[l] }`, {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([[
            Markup.button.callback({ ru: "🛒 Заказать", uz: "🛒 Buyurtma berish", en: "🛒 Order" }[l], `order_${toy.id}`),
            Markup.button.callback({ ru: "🛍 В корзину", uz: "🛍 Savatga", en: "🛍 Add to cart" }[l], `cart_${toy.id}`),
          ]]),
        });
      }
    }
    await ctx.reply("──────────────", Markup.inlineKeyboard([
      [Markup.button.callback({ ru: "🔄 Искать снова", uz: "🔄 Qayta qidirish", en: "🔄 Search again" }[l], "search_again")],
    ]));
    return;
  }

  // ── Ожидаем скриншот оплаты (текст вместо фото) ──
  if (user.step === "await_screenshot") {
    return ctx.reply({ ru: "📸 Пожалуйста, отправьте скриншот оплаты (фото).", uz: "📸 Iltimos, to'lov screenshotini (rasm) yuboring.", en: "📸 Please send a payment screenshot (photo)." }[l]);
  }

  // ── Режим «Занят» ──
  if (busyMode && id !== ADMIN_ID) {
    await notify(ctx, `💬 Написал сообщение: «${text}»`);
    await ctx.reply({ ru: "😊 Владелец сейчас занят. Ваше сообщение получено — скоро свяжемся!", uz: "😊 Egasi hozir band. Xabaringiz qabul qilindi!", en: "😊 Owner is busy. Your message received — we'll be in touch!" }[l]);
  }
});

// ─────────────────────────────────────────
// СКРИНШОТ ОПЛАТЫ (фото)
// ─────────────────────────────────────────
bot.on("photo", async (ctx) => {
  const id = ctx.from.id;
  const user = getUser(id);
  const l = user.lang || "ru";

  if (user.step === "await_screenshot") {
    user.step = null;
    await ctx.reply({ ru: "✅ Скриншот получен! Проверяем оплату и свяжемся с вами 📞", uz: "✅ Screenshot qabul qilindi! To'lovni tekshirib, siz bilan bog'lanamiz 📞", en: "✅ Screenshot received! We'll verify payment and contact you 📞" }[l]);
    // Переслать скриншот админу
    if (ADMIN_ID) {
      const u = ctx.from;
      await ctx.telegram.sendMessage(ADMIN_ID, `📸 <b>Скриншот оплаты от</b> ${u.first_name}${u.username ? " (@" + u.username + ")" : ""} [ID: ${u.id}]`, { parse_mode: "HTML" }).catch(() => {});
      await ctx.telegram.forwardMessage(ADMIN_ID, ctx.chat.id, ctx.message.message_id).catch(() => {});
    }
  }
});

// ─────────────────────────────────────────
// ИСКАТЬ СНОВА
// ─────────────────────────────────────────
bot.action("search_again", async (ctx) => {
  const id = ctx.from.id;
  const l = L(id);
  getUser(id).step = "gender";
  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  await ctx.reply({ ru: "👶 Для кого ищем игрушку?", uz: "👶 Kim uchun o'yinchoq?", en: "👶 Who are we shopping for?" }[l], Markup.inlineKeyboard([
    [Markup.button.callback({ ru: "👦 Мальчик", uz: "👦 O'g'il bola", en: "👦 Boy" }[l], "g_boy"), Markup.button.callback({ ru: "👧 Девочка", uz: "👧 Qiz bola", en: "👧 Girl" }[l], "g_girl")],
  ]));
});

// ─────────────────────────────────────────
// ФОРМИРОВАНИЕ ТЕКСТА ЗАКАЗА ДЛЯ АДМИНА
// ─────────────────────────────────────────
function buildOrderText(from, items, l, type, payMethod) {
  const u = from;
  let text = `🛒 <b>НОВЫЙ ЗАКАЗ!</b>\n\n`;
  text += `👤 ${u.first_name}${u.last_name ? " " + u.last_name : ""}${u.username ? " (@" + u.username + ")" : ""}\n`;
  text += `🆔 ID: <code>${u.id}</code>\n\n`;
  text += `📦 <b>Товары:</b>\n`;
  let total = 0;
  (items || []).filter(Boolean).forEach((toy, i) => {
    text += `${i + 1}. ${toy.emoji} ${toy.name.ru} — ${sum(toy.price, "ru")}\n`;
    total += toy.price;
  });
  text += `\n💰 Итого: <b>${sum(total, "ru")}</b>\n`;
  text += `\n🚚 Тип: <b>${type === "delivery" ? "Доставка" : "Самовывоз"}</b>`;
  if (payMethod) text += `\n💳 Оплата: <b>${payMethod}</b>`;
  return text;
}

// ─────────────────────────────────────────
// /admin — ПАНЕЛЬ УПРАВЛЕНИЯ
// ─────────────────────────────────────────
bot.command("admin", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  await ctx.reply(`⚙️ <b>Админ-панель</b>\n\n👥 Пользователей: <b>${Object.keys(users).length}</b>\n🔴 Режим «Занят»: <b>${busyMode ? "ВКЛ ✅" : "ВЫКЛ ❌"}</b>`, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      [Markup.button.callback(busyMode ? "✅ Занят — ВЫКЛ" : "❌ Занят — ВКЛ", "toggle_busy")],
      [Markup.button.callback("📊 Статистика", "admin_stats")],
    ]),
  });
});

bot.action("toggle_busy", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  busyMode = !busyMode;
  await ctx.editMessageText(`⚙️ <b>Режим «Занят»: ${busyMode ? "ВКЛ ✅" : "ВЫКЛ ❌"}</b>`, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([[Markup.button.callback(busyMode ? "✅ Занят — ВЫКЛ" : "❌ Занят — ВКЛ", "toggle_busy")]]),
  });
});

bot.action("admin_stats", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  await ctx.answerCbQuery(`👥 Пользователей: ${Object.keys(users).length}`);
});

// ─────────────────────────────────────────
// ЗАПУСК
// ─────────────────────────────────────────
bot.launch().then(() => {
  console.log("🤖 ToyShop Bot запущен!");
  console.log("📦 Товаров:", toys.length);
  if (!ADMIN_ID) console.warn("⚠️  ADMIN_ID не задан — уведомления не будут приходить!");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));