/* Deterministic freshness filter for official cinema showtimes. */
(function (root) {
  const MAX_AGE_MS = 24 * 60 * 60 * 1000;
  const MAX_FUTURE_SKEW_MS = 60 * 60 * 1000;

  function tokyoDate(now) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  }

  function snapshot(data, now = new Date()) {
    const generatedAt = Date.parse(data && data.generated_at);
    const age = now.getTime() - generatedAt;
    const fresh = Number.isFinite(generatedAt) && age >= -MAX_FUTURE_SKEW_MS && age <= MAX_AGE_MS;
    const today = tokyoDate(now);
    const schedules = data && Array.isArray(data.schedules) ? data.schedules : [];
    const rows = fresh
      ? schedules.filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date || "") && row.date >= today)
      : [];
    return { fresh, today, rows };
  }

  root.CinelvaTheaterSchedule = { snapshot };
  if (typeof module !== "undefined" && module.exports) module.exports = { snapshot };
})(globalThis);
