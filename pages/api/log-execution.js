import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  // CORS headers — allow n8n, Make, Zapier and any external tool to POST
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      user_id = "anonymous",
      workflow_name,
      platform = "n8n",
      metadata = null,
    } = req.body || {};

    if (!workflow_name || typeof workflow_name !== "string" || !workflow_name.trim()) {
      return res.status(400).json({ error: "workflow_name is required" });
    }

    await pool.query(
      `INSERT INTO executions (user_id, workflow_name, platform, metadata, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        String(user_id).trim(),
        workflow_name.trim(),
        String(platform).trim(),
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    return res.status(200).json({
      success: true,
      logged: {
        user_id: String(user_id).trim(),
        workflow_name: workflow_name.trim(),
        platform: String(platform).trim(),
      },
    });
  } catch (err) {
    console.error("log-execution error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
