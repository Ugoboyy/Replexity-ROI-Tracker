import { query } from "@/lib/db";

/* ── helpers ── */
function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "RFX-";
  for (let i = 0; i < 4; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isAdmin(req) {
  const key = (process.env.ADMIN_KEY || "").trim();
  return req.headers.get("X-Admin-Key")?.trim() === key;
}

/* ══════════════ GET ══════════════ */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const slug = searchParams.get("slug");

  if (slug) {
    try {
      const { rows } = await query("SELECT * FROM clients WHERE slug = $1", [
        slug.toLowerCase(),
      ]);
      if (!rows.length) {
        return Response.json({ error: "Client not found" }, { status: 404 });
      }
      const client = rows[0];
      if (client.status === "revoked") {
        return Response.json({ error: "Access has been removed." }, { status: 403 });
      }
      return Response.json({ client });
    } catch (error) {
      console.error("Client lookup error:", error);
      return Response.json({ error: "Server error" }, { status: 500 });
    }
  }

  if (code) {
    try {
      const { rows } = await query("SELECT * FROM clients WHERE code = $1", [
        code.toUpperCase(),
      ]);
      if (!rows.length) {
        return Response.json({ error: "Client not found" }, { status: 404 });
      }
      const client = rows[0];
      if (client.status === "revoked") {
        return Response.json({ error: "Access has been removed." }, { status: 403 });
      }
      return Response.json({ client });
    } catch (error) {
      console.error("Client lookup error:", error);
      return Response.json({ error: "Server error" }, { status: 500 });
    }
  }

  // No code/slug param and no admin key → reject
  return Response.json({ error: "Code parameter required" }, { status: 400 });
}

/* ══════════════ POST ══════════════ */
export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    /* ── create ── */
    if (action === "create") {
      if (!isAdmin(req)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const {
        client_name,
        client_type,
        automation_type,
        deployment_date,
        project_cost,
        log_frequency,
        notes,
        email,
      } = body;

      // Generate unique code
      let code = generateCode();
      let attempts = 0;
      while (attempts < 10) {
        const { rows: existing } = await query(
          "SELECT id FROM clients WHERE code = $1",
          [code]
        );
        if (!existing.length) break;
        code = generateCode();
        attempts++;
      }

      // Generate unique slug from client name
      const baseSlug = toSlug(client_name);
      let slug = baseSlug;
      let slugAttempts = 0;
      while (slugAttempts < 20) {
        const { rows: existing } = await query(
          "SELECT id FROM clients WHERE slug = $1",
          [slug]
        );
        if (!existing.length) break;
        slugAttempts++;
        slug = `${baseSlug}-${slugAttempts}`;
      }

      const { rows } = await query(
        `INSERT INTO clients
           (id, code, slug, client_name, client_type, automation_type, deployment_date,
            project_cost, log_frequency, notes, email, status)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
         RETURNING id, code, slug`,
        [code, slug, client_name, client_type || null, automation_type, deployment_date, project_cost, log_frequency || "weekly", notes || null, email ? email.trim().toLowerCase() : null]
      );

      return Response.json({ code: rows[0].code, slug: rows[0].slug, client_id: rows[0].id });
    }

    /* ── freeze ── */
    if (action === "freeze") {
      if (!isAdmin(req)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      await query("UPDATE clients SET status = 'frozen' WHERE code = $1", [body.code]);
      return Response.json({ ok: true });
    }

    /* ── activate ── */
    if (action === "activate") {
      if (!isAdmin(req)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      await query("UPDATE clients SET status = 'active' WHERE code = $1", [body.code]);
      return Response.json({ ok: true });
    }

    /* ── revoke ── */
    if (action === "revoke") {
      if (!isAdmin(req)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      await query("UPDATE clients SET status = 'revoked' WHERE code = $1", [body.code]);
      return Response.json({ ok: true });
    }

    /* ── update_subscription ── */
    if (action === "update_subscription") {
      if (!isAdmin(req)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const { code: subCode, subscription_active } = body;
      const newStatus = subscription_active ? "active" : "frozen";
      await query(
        "UPDATE clients SET subscription_active = $1, status = $2 WHERE code = $3",
        [subscription_active, newStatus, subCode]
      );
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Client POST error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
