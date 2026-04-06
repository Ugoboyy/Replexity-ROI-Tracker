require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  // 1. Check if executions table exists
  const check = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'executions'`
  );

  if (check.rows.length === 0) {
    console.log("⚠  'executions' table not found — creating it now...");
    await pool.query(`
      CREATE TABLE executions (
        id         SERIAL PRIMARY KEY,
        user_id    TEXT,
        workflow_name TEXT NOT NULL,
        platform   TEXT,
        metadata   JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✔  executions table created");
  } else {
    console.log("✔  executions table already exists");
  }

  // 2. Insert a test row directly via pg
  await pool.query(
    `INSERT INTO executions (user_id, workflow_name, platform, metadata, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    ["test-user", "Health Check Workflow", "script", JSON.stringify({ test: true })]
  );
  console.log("✔  test row inserted");

  // 3. Read it back
  const result = await pool.query(
    `SELECT id, user_id, workflow_name, platform, created_at
     FROM executions ORDER BY created_at DESC LIMIT 3`
  );
  console.log("Latest rows:");
  result.rows.forEach(r =>
    console.log(` id=${r.id}  user=${r.user_id}  workflow=${r.workflow_name}  platform=${r.platform}  at=${r.created_at}`)
  );

  await pool.end();
}

run().catch(e => { console.error("Error:", e.message); process.exit(1); });
