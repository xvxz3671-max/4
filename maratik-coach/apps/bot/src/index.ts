import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import { TelegramWebAppDataSchema, MUSCLE_GROUP_LABELS } from '@maratik/shared';

const BOT_TOKEN = process.env.BOT_TOKEN;
const PUBLIC_WEBAPP_URL = process.env.PUBLIC_WEBAPP_URL || 'https://your-web-app.vercel.app';
const API_BASE_URL = process.env.API_BASE_URL || 'https://your-api.vercel.app';

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is required');
}

const bot = new Bot(BOT_TOKEN);

// Start command
bot.command('start', async (ctx) => {
  const user = ctx.from;
  if (!user) return;

  // Create user in database
  try {
    await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: user.id.toString(),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
      }),
    });
  } catch (error) {
    console.error('Failed to create user:', error);
  }

  const keyboard = new InlineKeyboard()
    .webApp('🏋️ Открыть Maratik Coach', PUBLIC_WEBAPP_URL);

  await ctx.reply(
    `🔥 Привет, ${user.first_name}! Я Маратик — твой персональный тренер!

💪 Что я умею:
• Составлять планы тренировок
• Отслеживать прогресс
• Вести статистику
• Мотивировать на результат

Нажми кнопку ниже, чтобы начать тренировки!`,
    { reply_markup: keyboard }
  );
});

// Plan command - AI workout plan generation (placeholder)
bot.command('plan', async (ctx) => {
  await ctx.reply(
    `🤖 Генерация персонального плана тренировок

Ответь на несколько вопросов, и я составлю для тебя идеальный план:

1️⃣ Сколько дней в неделю готов тренироваться? (3-6)
2️⃣ Какая у тебя цель? (похудение/набор массы/поддержание формы)
3️⃣ Есть ли опыт тренировок? (новичок/средний/продвинутый)
4️⃣ Сколько времени на тренировку? (30-90 минут)

Пока что эта функция в разработке. Используй Mini App для создания плана вручную!`,
    {
      reply_markup: new InlineKeyboard()
        .webApp('📱 Открыть приложение', PUBLIC_WEBAPP_URL)
    }
  );
});

// Handle web app data
bot.on('message:web_app_data', async (ctx) => {
  try {
    const webAppData = JSON.parse(ctx.message.web_app_data.data);
    const validatedData = TelegramWebAppDataSchema.parse(webAppData);

    switch (validatedData.type) {
      case 'workout_completed':
        const { muscleGroup, sets, duration, date } = validatedData.payload;
        
        await ctx.reply(
          `🎉 Отличная тренировка!

💪 Группа мышц: ${muscleGroup}
📊 Подходов выполнено: ${sets}
⏱️ Время тренировки: ${duration} мин
📅 Дата: ${new Date(date).toLocaleDateString('ru-RU')}

Так держать! Твой прогресс впечатляет! 🔥`,
          {
            reply_markup: new InlineKeyboard()
              .webApp('📊 Посмотреть статистику', PUBLIC_WEBAPP_URL + '/history')
          }
        );
        break;

      case 'stats_update':
        const { currentStreak, bestStreak } = validatedData.payload;
        
        let message = `📈 Обновление статистики!\n\n`;
        message += `🔥 Текущий стрик: ${currentStreak} дней\n`;
        message += `🏆 Лучший стрик: ${bestStreak} дней\n\n`;
        
        if (currentStreak >= 7) {
          message += `🎖️ Поздравляю! Ты тренируешься уже неделю подряд!`;
        } else if (currentStreak >= 30) {
          message += `🏅 Невероятно! Месяц регулярных тренировок!`;
        } else {
          message += `Продолжай в том же духе! 💪`;
        }

        await ctx.reply(message);
        break;
    }
  } catch (error) {
    console.error('Failed to process web app data:', error);
    await ctx.reply('Произошла ошибка при обработке данных. Попробуй ещё раз.');
  }
});

// Help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    `🤖 Команды Maratik Coach:

/start - Начать работу с ботом
/plan - Генерация плана тренировок (скоро)
/help - Показать эту справку

💡 Основная работа происходит в Mini App - нажми кнопку ниже!`,
    {
      reply_markup: new InlineKeyboard()
        .webApp('🏋️ Открыть приложение', PUBLIC_WEBAPP_URL)
    }
  );
});

// Handle unknown commands
bot.on('message', async (ctx) => {
  if (ctx.message.text?.startsWith('/')) {
    await ctx.reply(
      'Неизвестная команда. Используй /help для списка доступных команд.',
      {
        reply_markup: new InlineKeyboard()
          .webApp('🏋️ Открыть приложение', PUBLIC_WEBAPP_URL)
      }
    );
  }
});

// Error handling
bot.catch((err) => {
  console.error('Bot error:', err);
});

// For serverless deployment (Railway, Fly.io, etc.)
export const webhookHandler = webhookCallback(bot, 'std/http');

// For local development
if (process.env.NODE_ENV !== 'production') {
  bot.start({
    onStart: (botInfo) => {
      console.log(`Bot @${botInfo.username} started!`);
      console.log(`WebApp URL: ${PUBLIC_WEBAPP_URL}`);
    },
  });
}

export default bot;