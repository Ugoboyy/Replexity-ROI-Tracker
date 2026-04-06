import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { user_id, claim_from_date } = req.body || {};

    if (!user_id || typeof user_id !== "string" || !user_id.trim()) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const resolvedId = user_id.trim();

    if (resolvedId === "anonymous") {
      return res.status(400).json({ error: "user_id cannot be 'anonymous'" });
    }

    let result;

    if (claim_from_date) {
      const parsedDate = new Date(claim_from_date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "claim_from_date is not a valid date" });
      }

      result = await pool.query(
        `UPDATE executions
         SET user_id = $1
         WHERE user_id = 'anonymous'
           AND created_at >= $2`,
        [resolvedId, parsedDate.toISOString()]
      );
    } else {
      result = await pool.query(
        `UPDATE executions
         SET user_id = $1
         WHERE user_id = 'anonymous'`,
        [resolvedId]
      );
    }

    return res.status(200).json({
      success: true,
      claimed_count: result.rowCount,
      user_id: resolvedId,
      ...(claim_from_date ? { from: new Date(claim_from_date).toISOString() } : {}),
    });
  } catch (err) {
    console.error("claim-executions error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
