# Образ сайта Демалыс. На сервере собирается через docker-compose.prod.yml
# (deploy/deploy.sh): сборке нужен уже работающий бэкенд — главная, подборки
# и sitemap.xml заполняются данными при сборке.

FROM node:24-slim AS base
# jemalloc: sharp (оптимизация фото в next/image) с ним не раздувает память
# на glibc — см. node_modules/next/dist/docs/01-app/02-guides/self-hosting.md.
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends libjemalloc2 \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/lib/*-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so.2

# ── Сборка ─────────────────────────────────────────────────
FROM base AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# frontend/.env с сервера — секретом сборки: NEXT_PUBLIC_* вшиваются в сайт,
# а в слоях образа файла нет.
RUN --mount=type=secret,id=frontend_env,target=/app/.env.production.local \
    npm run build

# ── Запуск: только standalone-сервер ───────────────────────
FROM base
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    LD_PRELOAD=/usr/local/lib/libjemalloc.so.2
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Сюда монтируется volume next-cache: пустой volume берёт владельца из образа.
RUN mkdir -p .next/cache && chown node:node .next/cache
USER node
EXPOSE 3000
CMD ["node", "server.js"]
