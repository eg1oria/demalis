"use client";

/**
 * Ошибка в самом корневом layout — без стилей и переводов сайта,
 * поэтому на двух языках сразу и с простыми стилями.
 */
export default function GlobalError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="ru">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          padding: "64px 20px",
          color: "#1a1a1a",
        }}
      >
        <title>Ошибка</title>
        <h1 style={{ fontSize: 24, fontWeight: 500 }}>
          Что-то пошло не так · Бір нәрсе дұрыс болмады
        </h1>
        <p style={{ color: "#666", maxWidth: 480 }}>
          Мы уже знаем об ошибке. Попробуйте ещё раз через минуту.
          <br />
          Қате туралы білеміз. Бір минуттан кейін қайталап көріңіз.
        </p>
        <button
          type="button"
          onClick={retry}
          style={{
            height: 48,
            padding: "0 20px",
            borderRadius: 10,
            border: 0,
            background: "#1a1a1a",
            color: "#fff",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Попробовать ещё раз · Қайталау
        </button>
      </body>
    </html>
  );
}
