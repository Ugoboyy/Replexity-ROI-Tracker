export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Derive base URL from the incoming request so it works on both
  // Vercel (https) and local dev (http://localhost:PORT)
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host  = req.headers["x-forwarded-host"] || req.headers.host;
  const base  = `${proto}://${host}`;

  // Accept a user_id query param for targeted tests; falls back to anonymous
  const testUserId = req.query.user_id || "anonymous";

  const timestamp = new Date().toISOString();
  let webhookResult = null;
  let roiResult     = null;
  let testPassed    = false;

  try {
    // 1. POST to /api/log-execution
    const logRes = await fetch(`${base}/api/log-execution`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:       testUserId,
        workflow_name: "Test Workflow",
        platform:      "internal-test",
      }),
    });
    webhookResult = await logRes.json();

    // 2. GET /api/get-roi
    const roiRes = await fetch(
      `${base}/api/get-roi?user_id=${encodeURIComponent(testUserId)}&period=weekly`
    );
    roiResult = await roiRes.json();

    testPassed =
      webhookResult?.success === true &&
      typeof roiResult?.total_executions === "number";
  } catch (err) {
    return res.status(500).json({
      error:          err.message || "Internal server error",
      webhook_result: webhookResult,
      roi_result:     roiResult,
      test_passed:    false,
      timestamp,
    });
  }

  return res.status(200).json({
    webhook_result: webhookResult,
    roi_result:     roiResult,
    test_passed:    testPassed,
    timestamp,
  });
}
