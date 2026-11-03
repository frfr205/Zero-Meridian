# Zero Meridian

Семиэтапное детективное расследование на Next.js 16, React 19, Drizzle ORM и PostgreSQL.

## Почему на Vercel появлялась ошибка «The dossier server is not responding»

В исходной версии `/api/case` сразу обращался к PostgreSQL. Локальный `postgresql://…@127.0.0.1…` недоступен из serverless-функции Vercel. Если `DATABASE_URL` не задан, таблицы не созданы или база не принимает внешние соединения, запрос падал, а интерфейс блокировал всё досье.

В этой версии ошибка исправлена на уровне архитектуры:

- с PostgreSQL прогресс хранится на сервере в HTTP-only сессии;
- без доступной PostgreSQL автоматически включается **Browser dossier** — тот же игровой движок и та же проверка ответов, сохранение в `localStorage`;
- интерфейс прямо показывает активный режим и не выдаёт локальное сохранение за серверное;
- `/api/health` отдельно сообщает готовность приложения и состояние базы;
- экспорт Markdown/JSON, заметки, подсказки, сброс и все семь актов работают в обоих режимах.

Локальный и серверный прогресс намеренно разделены. При повторном подключении базы существующее браузерное досье не удаляется и не выдаётся за синхронизированное.

## Быстрый запуск на Vercel без базы

1. В настройках Vercel для исходного репозитория укажите **Root Directory**: `complex-multi-stage-web-challenge` (в исходном GitHub-репозитории приложение находится во вложенной папке).
2. Framework Preset: **Next.js**. Build Command: `next build` или стандартная `npm run build`.
3. Deploy. Сайт сразу откроется в режиме **Browser dossier**; дополнительный сервер не нужен.

## Включение PostgreSQL на Vercel

1. Создайте managed PostgreSQL: Neon, Vercel Postgres или другой провайдер с доступом из serverless-функций.
2. В **Vercel → Project → Settings → Environment Variables** добавьте `DATABASE_URL` для Production (и Preview, если нужно). Используйте полную pooled connection string провайдера, обычно с `sslmode=require`.
3. Один раз создайте таблицы. На своём компьютере в корне приложения:

   ```bash
   # Поместите ту же серверную строку подключения в локальный .env
   npm install
   npx drizzle-kit push
   ```

   Команда создаст `case_sessions`, `stage_progress` и `attempt_log`. Не запускайте её с localhost-строкой, если хотите подготовить удалённую базу.
4. Сделайте Redeploy в Vercel.
5. Откройте `https://ВАШ-ДОМЕН/api/health`. Ожидаемый ответ: `persistence: "server"` и `database.connected: true`.
6. В шапке сайта статус изменится на **PostgreSQL dossier**.

Если `database.configured` равно `false`, переменная не попала в среду выполнения. Если она `true`, но `connected` равно `false`, проверьте строку подключения, SSL и сетевой доступ провайдера. Если соединение есть, но `/api/case` всё ещё возвращает 503, чаще всего не выполнен `drizzle-kit push`.

## Локальная разработка

```bash
npm install
npm run dev
```

Без `DATABASE_URL` приложение работает локально в браузерном режиме. Для серверного режима создайте `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

Затем выполните `npx drizzle-kit push`.

## Состав расследования

- The Watch Protocol: причинная хронология шести событий.
- The Dead Catalogue: контрольный остаток modulo 17 для 12 карт.
- Palimpsest: настоящая обратная колоночная транспозиция.
- A Voice on 88.4: частота, фаза и синтезированный Morse через Web Audio.
- The Lunar Atlas: комбинируемые фильтры 12 наблюдений и азимутальный диск.
- Fifteen Legs: Hamiltonian path по 16 станциям, датчики, шлюзы и предохранители линий.
- The Zero Meridian Core: взвешенная сумма, XOR, автор и мотив.

Прогресс, попытки, подсказки и время участвуют в итоговом ранге. Экспорт формируется из текущего состояния и не добавляет готовые ответы.
