# Образ бэкенда Демалыс. Собирается из папки backend/:
#   docker build -t demalis-backend backend
# На сервере — через docker-compose.prod.yml в корне репозитория.

# Prisma (движок миграций) нужен OpenSSL. jemalloc — чтобы sharp (сжатие фото)
# не раздувал память на glibc.
FROM node:24-slim AS base
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl libjemalloc2 \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/lib/*-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so.2

# ── Сборка: все зависимости, клиент Prisma, nest build ─────
FROM base AS build
WORKDIR /app
# tsconfig.json — до npm ci: по нему Prisma выбирает расширение импортов (.js).
COPY package.json package-lock.json prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
# postinstall сам запускает prisma generate → src/generated/prisma
RUN npm ci
COPY . .
RUN npm run build

# ── Только рабочие зависимости (без TypeScript, Jest и т. п.) ─
# Скрипты установки нужны: @prisma/engines скачивает движок миграций.
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --omit=dev

# ── Запуск ─────────────────────────────────────────────────
FROM base
# Без production бэкенд разрешает «Войти без письма» (src/auth/auth.service.ts).
ENV NODE_ENV=production \
    PORT=4000 \
    UPLOADS_DIR=/app/uploads \
    LD_PRELOAD=/usr/local/lib/libjemalloc.so.2
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json prisma.config.ts ./
COPY prisma ./prisma
COPY scripts/set-webhook.ts ./scripts/
RUN mkdir -p uploads && chown node:node uploads
USER node
EXPOSE 4000
# Перед стартом — миграции базы (уже применённые пропускаются).
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/main"]
