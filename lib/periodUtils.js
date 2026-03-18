/**
 * Get the Monday of the current ISO week.
 * @returns {Date}
 */
function getMondayOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon …
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  return monday;
}

/**
 * Return the start-of-period Date for the current period.
 *
 * - "weekly"  → Monday of this week
 * - "monthly" → 1st of this month
 *
 * @param {"weekly"|"monthly"} logFrequency
 * @returns {Date}
 */
export function getCurrentPeriodDate(logFrequency) {
  if (logFrequency === "weekly") {
    return getMondayOfCurrentWeek();
  }
  // monthly
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Human-readable label for the period.
 *
 * - "weekly"  → "Week 1", "Week 7" …
 * - "monthly" → "Month 1 — January 2025"
 *
 * @param {"weekly"|"monthly"} logFrequency
 * @param {Date|string}        periodDate       Date (or ISO string) of the period
 * @param {number}             existingLogsCount Number of logs already recorded
 * @returns {string}
 */
export function getPeriodLabel(logFrequency, periodDate, existingLogsCount) {
  const n = existingLogsCount + 1;

  if (logFrequency === "weekly") {
    return `Week ${n}`;
  }

  // monthly
  const d = typeof periodDate === "string" ? new Date(periodDate) : periodDate;
  const monthName = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();
  return `Month ${n} — ${monthName} ${year}`;
}

/**
 * Find the most-recent log timestamp (ms since epoch) from the list.
 * Prefers `created_at`; falls back to `log_date`.
 *
 * @param {Array} logs
 * @returns {number} epoch ms, or 0 if none
 */
function mostRecentTimestamp(logs) {
  return logs.reduce((latest, log) => {
    const t = new Date(log.created_at || log.log_date).getTime();
    return Number.isFinite(t) && t > latest ? t : latest;
  }, 0);
}

/**
 * Check whether a log entry already exists for the current period.
 *
 * Precision-based: the period is locked for exactly 7 days (weekly) or
 * 1 calendar month (monthly) after the most-recent log's `created_at`.
 *
 * @param {Array} existingLogs  Array of log rows (must include `created_at`)
 * @param {"weekly"|"monthly"} logFrequency
 * @returns {boolean} true if the user cannot log yet
 */
export function hasAlreadyLoggedThisPeriod(existingLogs, logFrequency) {
  if (!existingLogs || existingLogs.length === 0) return false;

  const latest = mostRecentTimestamp(existingLogs);
  if (latest === 0) return false;

  const now = Date.now();

  if (logFrequency === "weekly") {
    return now - latest < 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  }

  // monthly: add 1 calendar month to the last log's timestamp
  const lastDate = new Date(latest);
  const nextDue = new Date(lastDate);
  nextDue.setMonth(nextDue.getMonth() + 1);
  return now < nextDue.getTime();
}

/**
 * Return the exact Date when the next log becomes available,
 * based on the most-recent log's `created_at`.
 *
 * @param {Array} existingLogs
 * @param {"weekly"|"monthly"} logFrequency
 * @returns {Date|null}  null if no logs exist yet (can log immediately)
 */
export function getNextLogDeadline(existingLogs, logFrequency) {
  if (!existingLogs || existingLogs.length === 0) return null;

  const latest = mostRecentTimestamp(existingLogs);
  if (latest === 0) return null;

  if (logFrequency === "weekly") {
    return new Date(latest + 7 * 24 * 60 * 60 * 1000);
  }

  // monthly: add 1 calendar month (handles leap years, month boundaries)
  const d = new Date(latest);
  d.setMonth(d.getMonth() + 1);
  return d;
}

/**
 * ISO date string (YYYY-MM-DD) for the current period, suitable for DB storage.
 *
 * - "weekly"  → Monday of this week  e.g. "2025-03-17"
 * - "monthly" → First of this month  e.g. "2025-03-01"
 *
 * @param {"weekly"|"monthly"} logFrequency
 * @returns {string} e.g. "2025-03-17"
 */
export function formatPeriodDateForDB(logFrequency) {
  const d = getCurrentPeriodDate(logFrequency);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
