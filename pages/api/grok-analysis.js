const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const GROK_MODEL   = "grok-3-latest";

const SYSTEM_PROMPT = `You are a senior AI automation strategist and ROI analyst for Reflexity, \
a premium AI automation community. You analyse client automation performance data and deliver \
sharp, specific, actionable insights in a professional but warm tone. You are data-driven, \
precise, and genuinely helpful. Never be generic. Reference specific numbers. Address them by name.`;

/* ── derive internal base URL from request ── */
function baseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host  = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  return `${proto}://${host}`;
}

/* ── build the user message sent to Grok ── */
function buildUserMessage(data) {
  const {
    user_id,
    display_name,
    period,
    total_executions,
    total_hours_saved,
    dollar_value,
    roi_ratio,
    roi_percent,
    membership_cost,
    top_workflow,
    by_category = [],
    daily_breakdown = [],
  } = data;

  const name = display_name || user_id;
  const roiSign = Number(roi_percent) >= 0 ? "positive" : "negative";

  // Summarise by_category for the prompt
  const categoryLines = by_category
    .slice(0, 6)
    .map((c) => `    • ${c.category}: ${c.count} run${c.count !== 1 ? "s" : ""} (${c.minutes} min saved)`)
    .join("\n");

  // Summarise daily trend
  const dailyLines = daily_breakdown
    .slice(-7)
    .map((d) => `    • ${d.date}: ${d.count} run${d.count !== 1 ? "s" : ""}`)
    .join("\n");

  // Simple trend direction from daily data
  const counts = daily_breakdown.map((d) => d.count);
  let rawTrend = "stable";
  if (counts.length >= 3) {
    const first  = counts.slice(0, Math.floor(counts.length / 2)).reduce((a, b) => a + b, 0);
    const second = counts.slice(Math.floor(counts.length / 2)).reduce((a, b) => a + b, 0);
    if (second > first * 1.2) rawTrend = "growing";
    else if (second < first * 0.8) rawTrend = "declining";
  }

  return `Analyse this Reflexity client's automation performance for the ${period} period and \
return ONLY a valid JSON object — no markdown, no code block, no extra text.

CLIENT DATA:
  User ID:            ${user_id}
  Name:               ${name}
  Period:             ${period}
  Total executions:   ${total_executions}
  Total hours saved:  ${total_hours_saved} hrs
  Dollar value:       $${dollar_value}
  ROI ratio:          ${roi_ratio}x
  ROI percent:        ${roi_percent}% (${roiSign})
  Membership cost:    $${membership_cost}/month
  Top workflow:       ${top_workflow || "N/A"}

By category:
${categoryLines || "    • No category data available"}

Daily activity (last 7 days):
${dailyLines || "    • No daily data available"}

Observed trend direction: ${rawTrend}

Return ONLY this JSON shape with no other text:
{
  "headline":          "<one punchy sentence summarising their ${period}, max 12 words>",
  "performance_score": <integer 1-100 based on ROI, consistency, and automation breadth>,
  "top_insight":       "<most important observation, max 2 sentences, reference exact numbers>",
  "whats_working":     "<which automation is delivering most value and why>",
  "opportunity":       "<one specific workflow they should add next with clear reasoning>",
  "roi_verdict":       "<is membership paying off? compare dollar_value to membership_cost explicitly>",
  "trend":             "<exactly one of: growing | stable | declining>",
  "next_action":       "<one concrete step they can take this week>",
  "encouragement":     "<one genuine, specific motivational sentence using their name and real numbers>"
}`;
}

/* ── call Grok ── */
async function callGrok(userMessage) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY environment variable is not set");

  const response = await fetch(GROK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
      temperature:      0.4,
      max_tokens:       800,
      response_format:  { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Grok API error ${response.status}: ${errText}`);
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content ?? null;
}

/* ── safe JSON parse ── */
function safeParseGrok(raw) {
  if (!raw) return null;
  try {
    // Strip accidental markdown fences if model ignores response_format
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════
   HANDLER
   ══════════════════════════════════════════ */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET")    return res.status(405).json({ error: "Method not allowed" });

  const { user_id, period = "weekly" } = req.query;

  if (!user_id || !String(user_id).trim()) {
    return res.status(400).json({ error: "user_id is required" });
  }
  if (!["weekly", "monthly"].includes(period)) {
    return res.status(400).json({ error: "period must be 'weekly' or 'monthly'" });
  }

  const uid = String(user_id).trim();

  try {
    /* ── Step 1: fetch ROI data internally ── */
    const roiRes = await fetch(
      `${baseUrl(req)}/api/get-roi?user_id=${encodeURIComponent(uid)}&period=${period}`
    );
    if (!roiRes.ok) {
      const errData = await roiRes.json().catch(() => ({}));
      return res.status(502).json({
        error: "Failed to fetch ROI data",
        detail: errData.error || roiRes.statusText,
      });
    }
    const roi = await roiRes.json();

    /* ── Step 2: build prompt ── */
    const promptData = {
      ...roi,
      display_name: uid,          // use user_id as display name; extend here if you add a names table
      membership_cost: 37,        // default; get-roi already uses user_settings, this is prompt-only display
    };

    /* ── Step 3 + 4: call Grok ── */
    const rawGrok = await callGrok(buildUserMessage(promptData));

    /* ── Step 5: parse safely ── */
    const analysis = safeParseGrok(rawGrok);

    /* ── Step 6: cache for 1 hour ── */
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=300");

    if (!analysis) {
      // Graceful fallback — return raw stats even if Grok parse fails
      return res.status(200).json({
        user_id: uid,
        period,
        analysis: null,
        fallback: true,
        raw_stats: {
          total_executions:    roi.total_executions,
          total_hours_saved:   roi.total_hours_saved,
          dollar_value:        roi.dollar_value,
          roi_ratio:           roi.roi_ratio,
          roi_percent:         roi.roi_percent,
          top_workflow:        roi.top_workflow,
          by_category:         roi.by_category,
          daily_breakdown:     roi.daily_breakdown,
        },
        grok_raw: rawGrok ?? null,
      });
    }

    return res.status(200).json({
      user_id:   uid,
      period,
      analysis,
      fallback:  false,
      raw_stats: {
        total_executions:    roi.total_executions,
        total_hours_saved:   roi.total_hours_saved,
        dollar_value:        roi.dollar_value,
        roi_ratio:           roi.roi_ratio,
        roi_percent:         roi.roi_percent,
        top_workflow:        roi.top_workflow,
        by_category:         roi.by_category,
        daily_breakdown:     roi.daily_breakdown,
      },
    });
  } catch (err) {
    console.error("grok-analysis error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
