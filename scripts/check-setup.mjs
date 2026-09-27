// Проверка перед `npm run dev` (скрипт predev): после `git pull` чаще всего
// ломается одно из трёх — не установлены новые библиотеки, нет ключей в
// .env.local или в локальной базе нет новых таблиц. Скрипт говорит, что
// сделать, а новые миграции в локальную базу применяет сам.
// Без зависимостей: только встроенные модули Node.
import { spawnSync } from "node:child_process";

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
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
];
const missing = required.filter((key) => !env[key] && !process.env[key]);
if (!existsSync(".env.local") && missing.length > 0) {
  problems.push(
    "Нет файла .env.local.\n   Выполни: cp .env.example .env.local — и впиши ключи (README, «Запуск локально»).",
  );
} else if (missing.length > 0) {
  problems.push(
    `В .env.local не заполнены: ${missing.join(", ")}.\n   Ключи печатает npm run db:start (README, «Запуск локально»).`,
  );
}

// ── 3. Локальная база: запущена ли и есть ли новые миграции ─────────────
const url =
  env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const isLocal = url && /\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url);
if (isLocal && outdated.length === 0 && missing.length === 0) {
  let running = false;
  try {
    await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
      signal: AbortSignal.timeout(3000),
    });
    running = true;
  } catch {
    problems.push(
      `Локальная база не отвечает (${url}).\n   Запусти Docker Desktop, затем: npm run db:start`,
    );
  }
  if (running) {
    const result = spawnSync(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["supabase", "migration", "up", "--local"],
      {
        encoding: "utf8",
        timeout: 60_000,
        shell: process.platform === "win32",
      },
    );
    if (result.status === 0) {
      // Новые версии CLI печатают JSON {"applied":[...]}, старые — строки «Applying migration …».
      let applied = [];
      try {
        applied = JSON.parse(result.stdout).applied ?? [];
      } catch {
        applied =
          `${result.stdout}\n${result.stderr}`.match(
            /Applying migration \S+/g,
          ) ?? [];
      }
      if (applied.length > 0)
        notes.push(
          `Применены новые миграции базы: ${applied
            .map((a) =>
              a
                .replace("Applying migration ", "")
                .split(/[\\/]/)
                .pop()
                .replace(/\.{3}$/, ""),
            )
            .join(", ")}`,
        );
    } else {
      const error = `${result.stderr || result.error?.message || ""}`
        .trim()
        .split("\n")
        .slice(-2)
        .join(" ");
      problems.push(
        `Не удалось применить новые миграции к локальной базе.\n   Выполни вручную: npm run db:migrate (или npm run db:reset — он пересоздаст базу, тестовые данные потом: npm run seed)${error ? `\n   Ошибка: ${error}` : ""}`,
      );
    }
  }
}

for (const note of notes) console.log(`✓ ${note}`);
if (problems.length > 0) {
  console.error("\n⚠️  Проект не готов к запуску:\n");
  for (const p of problems) console.error(` • ${p}\n`);
  console.error("   (Запустить без проверки: SKIP_SETUP_CHECK=1 npm run dev)\n");
  process.exit(1);
}
