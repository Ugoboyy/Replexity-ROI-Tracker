const { neon } = require("@neondatabase/serverless");
const { config } = require("dotenv");
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

(async () => {
  // clients table already exists with uuid id — skip creation

  // Create log tables with UUID foreign key to match clients.id
  await sql`
    CREATE TABLE IF NOT EXISTS weekly_logs (
      id SERIAL PRIMARY KEY,
      client_id UUID REFERENCES clients(id),
      log_week INTEGER,
      log_date DATE,
      hours_saved NUMERIC(10,2) DEFAULT 0,
      money_saved NUMERIC(12,2) DEFAULT 0,
      errors_caught INTEGER DEFAULT 0,
      issues_noted TEXT,
      satisfaction INTEGER,
      ai_insight TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✓ weekly_logs table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS monthly_logs (
      id SERIAL PRIMARY KEY,
      client_id UUID REFERENCES clients(id),
      log_month INTEGER,
      log_date DATE,
      hours_saved NUMERIC(10,2) DEFAULT 0,
      money_saved NUMERIC(12,2) DEFAULT 0,
      errors_caught INTEGER DEFAULT 0,
      issues_noted TEXT,
      satisfaction INTEGER,
      ai_insight TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✓ monthly_logs table ready");

  // Insert test client
  const existing = await sql`SELECT code FROM clients WHERE code = 'RFX-TEST'`;
  if (existing.length === 0) {
    await sql`
      INSERT INTO clients (id, code, client_name, client_type, automation_type, deployment_date, project_cost, log_frequency, status)
      VALUES (gen_random_uuid(), 'RFX-TEST', 'Demo Client', 'DFY', 'AI Support Triage Agent', '2026-03-01', 3500, 'weekly', 'active')
    `;
    console.log("✓ Test client created: RFX-TEST");
  } else {
    console.log("✓ Test client already exists: RFX-TEST");
  }

  console.log("\nDone! Log in at http://localhost:3000 with code: RFX-TEST");
})().catch((e) => console.error("Error:", e));
