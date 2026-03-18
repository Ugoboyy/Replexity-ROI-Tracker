const { neon } = require("@neondatabase/serverless");
const { config } = require("dotenv");
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    const cols = await sql("SELECT column_name FROM information_schema.columns WHERE table_name = 'clients'");
    console.log("Columns:", cols.map((c) => c.column_name).join(", "));

    // Set test email on RFX-TEST for testing recovery
    await sql("UPDATE clients SET email = 'test@reflexity.co' WHERE code = 'RFX-TEST'");
    console.log("Set test email on RFX-TEST");

    // Verify
    const check = await sql("SELECT code, email FROM clients WHERE code = 'RFX-TEST'");
    console.log("Verify:", JSON.stringify(check));
  } catch (e) {
    console.error(e);
  }
})();
