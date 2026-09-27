/** Список админов из ADMIN_EMAILS (через запятую, без учёта регистра). */
export function parseAdminEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmails(process.env.ADMIN_EMAILS).has(email.toLowerCase());
}
