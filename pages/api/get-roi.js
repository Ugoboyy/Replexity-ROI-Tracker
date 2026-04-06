import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=60");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { user_id, period = "weekly" } = req.query;

  if (!user_id || !String(user_id).trim()) {
    return res.status(400).json({ error: "user_id is required" });
  }
  if (!["weekly", "monthly"].includes(period)) {
    return res.status(400).json({ error: "period must be 'weekly' or 'monthly'" });
  }

  try {
    const days = period === "monthly" ? 30 : 7;

    // Helper: run query with benchmark JOIN; on 'relation does not exist', retry without JOIN
    async function fetchExecutions(whereClause, params) {
      const withJoin = `
        SELECT e.id, e.user_id, e.workflow_name, e.created_at,
               COALESCE(wb.minutes_saved,
                        (e.metadata->>'minutes_saved')::int,
                        5)                               AS minutes_saved,
               COALESCE(wb.category, 'Uncategorised')   AS category
        FROM   executions e
        LEFT JOIN workflow_benchmarks wb
               ON LOWER(TRIM(e.workflow_name)) = LOWER(TRIM(wb.workflow_name))
        WHERE  ${whereClause}`;
      try {
        const r = await pool.query(withJoin, params);
        return r.rows;
      } catch (err) {
        // workflow_benchmarks does not exist yet — fall back to plain query with defaults
        if (err.message && err.message.includes("workflow_benchmarks")) {
          const noJoin = `
            SELECT e.id, e.user_id, e.workflow_name, e.created_at,
                   COALESCE((e.metadata->>'minutes_saved')::int, 5) AS minutes_saved,
                   'Uncategorised' AS category
            FROM   executions e
            WHERE  ${whereClause}`;
          const r2 = await pool.query(noJoin, params);
          return r2.rows;
        }
        throw err;
      }
    }

    // Fetch this user's executions for the period
    const executions = await fetchExecutions(
      "e.user_id = $1 AND e.created_at >= NOW() - ($2 * INTERVAL '1 day')",
      [String(user_id).trim(), days]
    );

    // User settings (hourly_rate, membership_cost) — silently fall back if table absent
    let hourlyRate = 50;
    let membershipCost = 37;
    try {
      const settingsResult = await pool.query(
        `SELECT hourly_rate, membership_cost
         FROM   user_settings
         WHERE  user_id = $1
         LIMIT  1`,
        [String(user_id).trim()]
      );
      if (settingsResult.rows.length > 0) {
        const s = settingsResult.rows[0];
        hourlyRate     = Number(s.hourly_rate)     || 50;
        membershipCost = Number(s.membership_cost) || 37;
      }
    } catch {
      // user_settings table may not exist yet — use defaults
    }

    // ── Calculated metrics ──────────────────────────────────────────
    const totalExecutions   = executions.length;
    const totalMinutesSaved = executions.reduce((sum, e) => sum + Number(e.minutes_saved), 0);
    const totalHoursSaved   = parseFloat((totalMinutesSaved / 60).toFixed(2));
    const dollarValue       = parseFloat((totalHoursSaved * hourlyRate).toFixed(2));
    const roiRatio          = parseFloat((dollarValue / membershipCost).toFixed(1));
    const roiPercent        = (((dollarValue - membershipCost) / membershipCost) * 100).toFixed(0);

    // Top workflow by execution count
    const workflowCounts = {};
    executions.forEach((e) => {
      workflowCounts[e.workflow_name] = (workflowCounts[e.workflow_name] || 0) + 1;
    });
    const topWorkflow =
      Object.entries(workflowCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // By category: { category, count, minutes }
    const categoryMap = {};
    executions.forEach((e) => {
      const cat = e.category || "Uncategorised";
      if (!categoryMap[cat]) categoryMap[cat] = { category: cat, count: 0, minutes: 0 };
      categoryMap[cat].count   += 1;
      categoryMap[cat].minutes += Number(e.minutes_saved);
    });
    const byCategory = Object.values(categoryMap).sort((a, b) => b.count - a.count);

    // Daily breakdown: { date, count, minutes }
    const dailyMap = {};
    executions.forEach((e) => {
      const date = new Date(e.created_at).toISOString().slice(0, 10);
      if (!dailyMap[date]) dailyMap[date] = { date, count: 0, minutes: 0 };
      dailyMap[date].count   += 1;
      dailyMap[date].minutes += Number(e.minutes_saved);
    });
    const dailyBreakdown = Object.values(dailyMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return res.status(200).json({
      user_id,
      period,
      total_executions:   totalExecutions,
      total_minutes_saved: totalMinutesSaved,
      total_hours_saved:  totalHoursSaved,
      dollar_value:       dollarValue,
      roi_ratio:          roiRatio,
      roi_percent:        roiPercent,
      top_workflow:       topWorkflow,
      by_category:        byCategory,
      daily_breakdown:    dailyBreakdown,
    });
  } catch (err) {
    console.error("get-roi error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
