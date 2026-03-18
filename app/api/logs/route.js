import sql from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("client_id");
  const type = searchParams.get("type") || "weekly";

  if (!clientId) {
    return Response.json({ logs: [] }, { status: 400 });
  }

  try {
    const table = type === "monthly" ? "monthly_logs" : "weekly_logs";
    const periodCol = type === "monthly" ? "log_month" : "log_week";
    const rows = await sql(
      `SELECT * FROM ${table} WHERE client_id = $1 ORDER BY ${periodCol} ASC`,
      [clientId]
    );

    // Enrich each row with a human-friendly period_label
    const enriched = rows.map((row) => {
      const n = row[periodCol];
      let period_label;
      if (type === "monthly" && row.log_date) {
        const d = new Date(row.log_date);
        const monthName = d.toLocaleString("en-US", { month: "long" });
        period_label = `Month ${n} — ${monthName} ${d.getFullYear()}`;
      } else {
        period_label = type === "monthly" ? `Month ${n}` : `Week ${n}`;
      }
      return { ...row, period_label };
    });

    return Response.json({ logs: enriched });
  } catch (error) {
    console.error("Logs fetch error:", error);
    return Response.json({ logs: [] }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      client_id,
      type,
      log_period,
      hours_saved,
      money_saved,
      errors_caught,
      issues_noted,
      satisfaction,
    } = body;

    const table = type === "monthly" ? "monthly_logs" : "weekly_logs";
    const periodCol = type === "monthly" ? "log_month" : "log_week";

    const rows = await sql(
      `INSERT INTO ${table} (client_id, ${periodCol}, log_date, hours_saved, money_saved, errors_caught, issues_noted, satisfaction)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [client_id, log_period, body.log_date || new Date().toISOString().slice(0, 10), hours_saved, money_saved, errors_caught || 0, issues_noted || "", satisfaction]
    );

    return Response.json({ log: rows[0] });
  } catch (error) {
    console.error("Log insert error:", error);
    return Response.json({ error: "Failed to save log" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, type, ai_insight } = await req.json();
    const table = type === "monthly" ? "monthly_logs" : "weekly_logs";
    const rows = await sql(
      `UPDATE ${table} SET ai_insight = $1 WHERE id = $2 RETURNING *`,
      [ai_insight, id]
    );
    return Response.json({ log: rows[0] });
  } catch (error) {
    console.error("Log update error:", error);
    return Response.json({ error: "Failed to update log" }, { status: 500 });
  }
}
