import { query } from "@/lib/db";

function isAdmin(req) {
  return req.headers.get("X-Admin-Key") === process.env.ADMIN_KEY;
}

export async function GET(req) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await query(
      "SELECT * FROM clients ORDER BY created_at DESC"
    );
    return Response.json({ clients: rows });
  } catch (error) {
    console.error("Admin clients list error:", error);
    return Response.json({ clients: [] }, { status: 500 });
  }
}
