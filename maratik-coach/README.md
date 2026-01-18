# Maratik Coach

Production-ready MVP Telegram Bot + Mini App для фитнес-тренировок.

## Стек технологий

- **Monorepo**: npm workspaces
- **Frontend**: React + TypeScript + Vite + @telegram-apps/sdk
- **Backend**: Node.js + TypeScript + Fastify + Prisma + SQLite/PostgreSQL
- **Bot**: grammY (Telegram Bot API)
- **Deploy**: Vercel (web + api), Railway/Fly.io (bot)

## Структура проекта

```
maratik-coach/
├── apps/
│   ├── web/          # Telegram Mini App (React)
│   ├── api/          # Backend API (Fastify)
│   └── bot/          # Telegram Bot (grammY)
├── packages/
│   └── shared/       # Общие типы и схемы (Zod)
└── package.json      # Root workspace
```

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните:

```bash
cp .env.example .env
```

Переменные для локальной разработки:
- `DATABASE_URL="file:./dev.db"`
- `BOT_TOKEN="your_telegram_bot_token"`
- `VITE_API_BASE_URL="http://localhost:3001"`

### 3. Инициализация базы данных

```bash
npm run db:generate
npm run db:push
```

### 4. Запуск в режиме разработки

```bash
npm run dev
```

Это запустит:
- Web app: http://localhost:3000
- API: http://localhost:3001
- Bot: polling mode

## Деплой на Vercel

### Создание проектов

1. **Создайте два проекта на Vercel из одного репозитория:**

#### Project A: Web App
- **Name**: `maratik-coach-web`
- **Framework Preset**: Vite
- **Root Directory**: `apps/web`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

#### Project B: API
- **Name**: `maratik-coach-api`  
- **Framework Preset**: Other
- **Root Directory**: `apps/api`
- **Build Command**: `npm run build`

### 2. Настройка переменных окружения

#### Web App (Project A)
```
VITE_API_BASE_URL=https://maratik-coach-api.vercel.app
```

#### API (Project B)
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### 3. Связывание проектов (Related Projects)

В настройках Project A (web):
1. Перейдите в Settings → General
2. В разделе "Related Projects" добавьте Project B (api)
3. Это позволит preview-деплоям автоматически использовать preview API

### 4. Настройка базы данных для продакшена

Для продакшена рекомендуется PostgreSQL. Варианты:
- **Vercel Postgres** (встроенное решение)
- **Supabase** (бесплатный tier)
- **Railway** (PostgreSQL + деплой бота)

Обновите `DATABASE_URL` в настройках API проекта.

## Деплой бота

Бот не деплоится на Vercel. Рекомендуемые платформы:

### Railway
1. Создайте новый проект на Railway
2. Подключите GitHub репозиторий
3. Установите Root Directory: `apps/bot`
4. Добавьте переменные окружения:
   ```
   BOT_TOKEN=your_telegram_bot_token
   API_BASE_URL=https://maratik-coach-api.vercel.app
   PUBLIC_WEBAPP_URL=https://maratik-coach-web.vercel.app
   ```

### Fly.io
```bash
# В директории apps/bot
flyctl launch
flyctl secrets set BOT_TOKEN=your_token
flyctl secrets set API_BASE_URL=https://maratik-coach-api.vercel.app
flyctl secrets set PUBLIC_WEBAPP_URL=https://maratik-coach-web.vercel.app
flyctl deploy
```

## Настройка Telegram Bot

1. Создайте бота через @BotFather
2. Получите токен и добавьте в переменные окружения
3. Настройте Menu Button:
   ```
   /setmenubutton
   @your_bot_name
   text: 🏋️ Открыть приложение
   url: https://maratik-coach-web.vercel.app
   ```

## Функционал MVP

### Mini App
- ✅ Недельный план тренировок
- ✅ Редактор дня (выбор группы мышц)
- ✅ Workout лог (вес + повторы + таймер отдыха)
- ✅ История тренировок с фильтрами
- ✅ Статистика и стрики
- ✅ Управление упражнениями
- ✅ Маскот "Маратик" (уникальная SVG птица-тренер)

### Telegram Bot
- ✅ /start - приветствие + кнопка Mini App
- ✅ /plan - опрос для генерации плана (заглушка)
- ✅ Обработка web_app_data
- ✅ Уведомления о завершении тренировок

### API
- ✅ CRUD пользователей
- ✅ Управление упражнениями
- ✅ Планы тренировок
- ✅ Логирование workout'ов
- ✅ Статистика и стрики
- ✅ Serverless-ready для Vercel

## Архитектура

### Telegram Integration
- Mini App открывается через `web_app` кнопку
- Данные передаются через `Telegram.WebApp.sendData()`
- Бот обрабатывает `web_app_data` и отвечает в чат

### Theme Integration
- Автоматическое применение Telegram theme через `bindCssVars()`
- Поддержка светлой/тёмной темы
- Нативный вид в Telegram

### Database
- Локально: SQLite через Prisma
- Продакшен: PostgreSQL (автоматическое переключение по DATABASE_URL)

## Команды разработки

```bash
# Разработка
npm run dev              # Запуск всех сервисов
npm run dev:web          # Только web app
npm run dev:api          # Только API
npm run dev:bot          # Только bot

# Сборка
npm run build            # Сборка всех приложений
npm run build:web        # Сборка web app
npm run build:api        # Сборка API
npm run build:bot        # Сборка bot

# База данных
npm run db:generate      # Генерация Prisma client
npm run db:push          # Применение схемы к БД
```

## Troubleshooting

### Проблемы с деплоем API на Vercel
- Убедитесь, что `vercel.json` настроен правильно
- Проверьте, что все зависимости указаны в `package.json`
- Fastify должен экспортировать serverless handler

### Проблемы с Telegram Mini App
- Проверьте HTTPS (обязательно для Telegram)
- Убедитесь, что `telegram-web-app.js` загружается
- Проверьте CORS настройки API

### Проблемы с ботом
- Проверьте правильность BOT_TOKEN
- Убедитесь, что webhook не установлен (для polling)
- Проверьте доступность API_BASE_URL

## Лицензия

MIT