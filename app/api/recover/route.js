import { query } from "@/lib/db";

/**
 * POST /api/recover
 * Body: { email: string }
 *
 * Looks up the client by email column.
 * Returns { code } on match, or { error } if not found.
 */
export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return Response.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const normalised = email.trim().toLowerCase();

    const { rows } = await query(
      "SELECT code, status FROM clients WHERE LOWER(email) = $1",
      [normalised]
    );

    if (!rows.length) {
      return Response.json(
        { error: "No account found for that email. Please contact Reflexity." },
        { status: 404 }
      );
    }

    // If multiple rows share the same email, return the first active one
    const active = rows.find((r) => r.status === "active") || rows[0];

    if (active.status === "revoked") {
      return Response.json(
        { error: "This account has been revoked. Contact Reflexity." },
        { status: 403 }
      );
    }

    return Response.json({ code: active.code });
  } catch (error) {
    console.error("Recovery error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
