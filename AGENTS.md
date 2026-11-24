# KaloDeal

## Перед изменением

Откройте «Текущая задача» и журнал в [docs/QA.md](docs/QA.md). Сверьте их с `git status --short --branch`, `git diff` и новыми файлами. Перед действием запишите ID. После проверки укажите наблюдение в браузере, ответ сервера, состояние данных, команду, изменённые файлы и один следующий шаг. Общие решения интерфейса описаны в [DESIGN.md](DESIGN.md).

## Карта репозитория

- `src/app` — Next App Router. Группы `(localized)/[locale]`, `(public)`, `(auth)`, `(protected)` задают витрину, общие страницы, вход и кабинет. Внутри protected раздельные layouts для user, moderator и admin. `src/proxy.ts` отвечает за локаль и режим разработки сайта. Проверки прав выполняют серверные обработчики.
- `src/app/api` — Better Auth, создание объявлений, фото и просмотры, приватные и публичные аватары, иконки категорий, сообщения и счётчики, токен Ably, webhook Stripe. Остальные операции в основном используют server actions в `src/features`.
- `src/features` — формы, валидация, запросы и рабочие процессы отдельных функций. `src/entities` — категории, география, объявления, публичные продавцы и документы. `src/lib` — Prisma, роли, сессии, тарифы и лимиты, адаптеры сервисов. `src/components/ui`, `src/shared/ui`, `src/widgets` — примитивы, общие компоненты и секции.
- `prisma/models` и `prisma/migrations` — PostgreSQL. Prisma генерирует клиент в игнорируемый `src/generated/prisma`. `prisma/seeds` — справочник категорий и два юридических документа. `emails` — шаблоны Resend. `src/i18n` — маршрутизация, словари EN/EL, подписи атрибутов.
- На исходном коммите `4114798` нет отслеживаемых README, workflow CI, браузерного тест-раннера и общего seed пользователей/объявлений. Тесты рядом с модулями используют `node:test` и tsx.

## Локальная среда

В этой копии установлены Node 26.13.0 и pnpm 12.4.2. Версия pnpm закреплена в package.json. При свежей установке задайте URL тестовой БД **до** `pnpm install --frozen-lockfile` (postinstall вызывает Prisma). Используйте отдельную пустую PostgreSQL. Для примера ниже пользователь qa должен иметь доступ к своей базе kalodeal_qa.

```sh
export DATABASE_DIRECT_URL='postgresql://qa@localhost:5432/kalodeal_qa'
export DATABASE_POOL_URL="$DATABASE_DIRECT_URL"
pnpm exec prisma migrate deploy
pnpm exec prisma generate
node --import tsx prisma/seeds/category.seed.ts
node --import tsx prisma/seeds/legal.seed.ts
```

Seed категорий вызывает create для каждого slug и рассчитан на пустой справочник. Юридический seed использует upsert. Пользователей создавайте через /register, письма принимайте тестовым почтовым сервисом. Назначайте служебные роли только фикстурам в тестовой БД. Объявления создаются через /sell.

Для `pnpm dev` используйте `http://localhost:3000` (разрешённый host Better Auth), `SHOW_UNDER_DEVELOPMENT=false`, локальные DOMAIN_URL, BETTER_AUTH_URL и собственный BETTER_AUTH_SECRET. Prisma CLI читает DATABASE_DIRECT_URL через dotenv, приложение использует DATABASE_POOL_URL. Next также загружает .env.local. Переопределяйте **обе** строки подключения в окружении процесса.

| Путь | Что настроить на стенде |
| --- | --- |
| Регистрация / восстановление | RESEND_API_KEY, RESEND_FROM_EMAIL. У установленного SDK RESEND_BASE_URL может указывать на локальный приёмник POST /emails, возвращающий JSON с id. Ссылка находится в HTML письма. |
| Поиск и мутации с лимитами | UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN. При отказе запросы с лимитером могут вернуть 503. |
| Фотографии и иконки | R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL. Для аватаров также AVATAR_ENCRYPTION_SECRET. Модуль R2 проверяет конфигурацию при импорте. |
| Подписки | Тестовый STRIPE_SECRET_KEY, STRIPE_{PLUS,PRO,BUSINESS}_PRICE_ID, STRIPE_WEBHOOK_SECRET для обработчика /api/webhook/stripe, совместимая конфигурация портала. Проверка цены включает валюту, сумму и месячный интервал. |
| Чат и наблюдаемость | ABLY_CHAT_API_KEY для realtime. Отдельно настраиваются аналитика и Sentry. Для локального прогона можно отключить GA/отправку Sentry, оставив идентификаторы пустыми. |

### Подготовка AUTH-04

В оболочке с переменными QA-базы и приложения создайте почтовый файл для стенда и запустите локальный приёмник Resend:

```sh
export QA_MAIL_FILE="$(mktemp "${TMPDIR:-/tmp}/kalodeal-auth-mail.XXXXXXXX")"
printf 'QA_MAIL_FILE=%s\n' "$QA_MAIL_FILE"
export RESEND_BASE_URL=http://127.0.0.1:53961
export RESEND_API_KEY=re_local_qa RESEND_FROM_EMAIL=qa@example.test
node --input-type=module <<'JS' &
import { createServer } from 'node:http'
import { appendFileSync } from 'node:fs'
createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/emails') return res.writeHead(404).end()
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const message = JSON.parse(Buffer.concat(chunks).toString())
  appendFileSync(process.env.QA_MAIL_FILE, JSON.stringify(message) + '\n')
  res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ id: crypto.randomUUID() }))
}).listen(53961, '127.0.0.1')
JS
pnpm dev --hostname localhost
```

Заранее сохраните путь из `QA_MAIL_FILE` для терминала с Playwright. Зарегистрируйте отдельный адрес вида `auth04@qa.example.test` на `http://localhost:3000/register`. В записи этого адресата в JSONL откройте ссылку подтверждения из поля `html`. В терминале с тестами экспортируйте тот же `QA_MAIL_FILE` и адрес как `QA_RESET_EMAIL`. Оба прогона используют один аккаунт и файл, каждый раз получают свежее письмо и меняют пароль.

## Команды

| Команда | Назначение |
| --- | --- |
| `pnpm dev` | Next dev, порт 3000. |
| `pnpm lint` | ESLint по проекту. |
| `pnpm exec next typegen` и `pnpm exec tsc --noEmit --incremental false` | Генерация типов маршрутов на чистой копии и строгая проверка TS. |
| `pnpm test` | Запускает `src/**/*.test.ts` через node:test. Корневой `tsconfig.test.json` задаёт alias для `server-only`. |
| `pnpm test:e2e --list` | Показывает сценарии из `tests/browser/` по корневому `playwright.config.ts`. |
| `pnpm test:e2e --grep AUTH-04` | Запустите из корня после старта `pnpm dev` с QA-переменными на localhost:3000 и локального приёмника Resend. Задайте `QA_RESET_EMAIL` подтверждённой фикстуры, пароль которой тест сменит, и `QA_MAIL_FILE` — путь к JSONL-файлу приёмника с полями `to`, `subject`, `html`. Для установленного Chrome задайте `PLAYWRIGHT_CHANNEL=chrome`. |
| `pnpm build` | Последовательно применяет миграции, генерирует Prisma и собирает Next. Запускайте на тестовом подключении, включая DATABASE_DIRECT_URL. Для Geist требуется доступ к Google Fonts при холодной сборке. |
| `pnpm start` | Обслуживание готовой production-сборки. |
| `pnpm email:dev` | Просмотр шаблонов писем, порт 3001. |

Статус фактических запусков и ограничения среды собраны в журнале QA. После правки запустите тест дефекта, смежные тесты, lint и TypeScript. Для изменений маршрутов, RSC или конфигурации проверьте сборку и соответствующий путь в браузере.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
