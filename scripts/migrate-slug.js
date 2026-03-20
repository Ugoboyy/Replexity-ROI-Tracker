/**
 * migrate-slug.js
 * Add slug column, create unique index, backfill existing clients.
 */
require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

(async () => {
  // 1. Add slug column if missing
  await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS slug TEXT`;
  console.log("✔ slug column ensured");

  // 2. Create unique index
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_slug ON clients (slug)`;
  console.log("✔ unique index on slug");

  // 3. Backfill existing clients
  const rows = await sql`SELECT id, client_name FROM clients WHERE slug IS NULL`;
  console.log(`  ${rows.length} client(s) to backfill`);

  for (const row of rows) {
    const base = toSlug(row.client_name);
    let slug = base;
    let suffix = 1;

    // Collision check
    while (true) {
      const existing = await sql`SELECT id FROM clients WHERE slug = ${slug} AND id != ${row.id}`;
      if (existing.length === 0) break;
      slug = `${base}-${suffix}`;
      suffix++;
    }

    await sql`UPDATE clients SET slug = ${slug} WHERE id = ${row.id}`;
    console.log(`  → ${row.client_name} → /${slug}`);
  }

  console.log("Done!");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
