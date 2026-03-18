/**
 * Format a number as a dollar string: "$1,234"
 * @param {number} n
 * @returns {string}
 */
export function fmt$(n) {
  return (
    "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0 })
  );
}

/**
 * Pluralize a unit word based on count.
 *   pluralize(1, "week")  → "week"
 *   pluralize(0, "week")  → "weeks"
 *   pluralize(3, "month") → "months"
 *
 * @param {number} count
 * @param {string} singular  e.g. "week", "month"
 * @returns {string}
 */
export function pluralize(count, singular) {
  return count === 1 ? singular : `${singular}s`;
}
