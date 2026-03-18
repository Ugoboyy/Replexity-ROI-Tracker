const { neon } = require("@neondatabase/serverless");
const { config } = require("dotenv");
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

(async () => {
  // Check existing clients table schema
  const cols = await sql`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_name = 'clients'
    ORDER BY ordinal_position
  `;
  console.log("clients columns:", JSON.stringify(cols, null, 2));

  // Check if weekly_logs or monthly_logs exist
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('weekly_logs', 'monthly_logs')
  `;
  console.log("\nExisting log tables:", tables.map(t => t.table_name));

  // Check existing rows in clients
  const rows = await sql`SELECT * FROM clients LIMIT 5`;
  console.log("\nExisting clients:", JSON.stringify(rows, null, 2));
})().catch((e) => console.error("Error:", e));
