import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default sql;

export async function query(text, params) {
  try {
    const rows = await sql(text, params);
    return { rows, rowCount: rows.length };
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}
