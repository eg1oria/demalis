// Проверка перед `npm run dev` (скрипт predev): после `git pull` чаще всего
// ломается одно из трёх — не установлены новые библиотеки, нет настроек в
// .env.local или не запущен бэкенд. Скрипт говорит, что сделать.
// Миграции базы применяет бэкенд: cd backend && npm run db:migrate.
// Без зависимостей: только встроенные модули Node.

// Пропустить проверку: SKIP_SETUP_CHECK=1 npm run dev
if (process.env.SKIP_SETUP_CHECK) process.exit(0);
import { existsSync, readFileSync } from "node:fs";

const problems = [];
const notes = [];
const read = (path) => JSON.parse(readFileSync(path, "utf8"));

// ── 1. Библиотеки совпадают с package-lock.json ─────────────────────────
const pkg = read("package.json");
const lock = existsSync("package-lock.json") ? read("package-lock.json") : null;
const direct = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
const outdated = direct.filter((name) => {
  const installed = `node_modules/${name}/package.json`;
  if (!existsSync(installed)) return true;
  const wanted = lock?.packages?.[`node_modules/${name}`]?.version;
  return wanted !== undefined && read(installed).version !== wanted;
});
if (outdated.length > 0) {
  problems.push(
    `Не установлены или устарели библиотеки: ${outdated.slice(0, 5).join(", ")}${outdated.length > 5 ? " и др." : ""}.\n   Выполни: npm install`,
  );
}

// ── 2. Ключи в .env.local ────────────────────────────────────────────────
const env = {};
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}
const required = ["API_URL", "NEXT_PUBLIC_API_URL", "INTERNAL_API_SECRET"];
const missing = required.filter((key) => !env[key] && !process.env[key]);
if (!existsSync(".env.local") && missing.length > 0) {
  problems.push(
    "Нет файла .env.local.\n   Выполни: cp .env.example .env.local — и впиши значения (README, «Запуск локально»).",
  );
} else if (missing.length > 0) {
  problems.push(
    `В .env.local не заполнены: ${missing.join(", ")}.\n   См. .env.example и README, «Запуск локально».`,
  );
}

// ── 3. Бэкенд запущен и видит базу ──────────────────────────────────────
const apiUrl = (env.API_URL || process.env.API_URL || "").replace(/\/$/, "");
if (apiUrl && outdated.length === 0) {
  try {
    const response = await fetch(`${apiUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch {
    problems.push(
      `Бэкенд не отвечает (${apiUrl}/health).\n   Запусти базу и бэкенд: docker compose up -d (в корне), затем cd backend && npm run start:dev`,
    );
  }
}

// ── 4. Реквизиты для подвала и юридических страниц (не мешает запуску) ──
if (existsSync("src/config/legal.ts")) {
  const unfilled = readFileSync("src/config/legal.ts", "utf8").match(
    /^\s*(\w+):\s*\n?\s*"\[ЗАПОЛНИТЬ/gm,
  );
  if (unfilled)
    console.log(
      `ℹ️  В src/config/legal.ts не заполнено полей: ${unfilled.length}. Перед запуском рекламы впиши реквизиты (docs/SEO.md, раздел 6).`,
    );
}

for (const note of notes) console.log(`✓ ${note}`);
if (problems.length > 0) {
  console.error("\n⚠️  Проект не готов к запуску:\n");
  for (const p of problems) console.error(` • ${p}\n`);
  console.error(
    "   (Запустить без проверки: SKIP_SETUP_CHECK=1 npm run dev)\n",
  );
  process.exit(1);
}
