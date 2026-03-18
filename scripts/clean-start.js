/**
 * clean-start.js
 * ──────────────
 * Removes the .next cache before starting the dev server.
 * This prevents recurring corruption from OneDrive sync
 * and stale webpack hot-update files.
 *
 * Also kills any process already holding the target port
 * so we never get EADDRINUSE errors.
 *
 * Usage:  node scripts/clean-start.js [port]
 * Default port: 3000
 */

const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");

const PORT = process.argv[2] || "3000";
const ROOT = path.resolve(__dirname, "..");
const NEXT_DIR = path.join(ROOT, ".next");

/* ── 1. Remove .next cache ── */
if (fs.existsSync(NEXT_DIR)) {
  console.log("🧹  Clearing .next cache …");
  fs.rmSync(NEXT_DIR, { recursive: true, force: true });
  console.log("   ✔ .next removed");
} else {
  console.log("   ✔ No .next cache to clear");
}

/* ── 2. Kill anything on the target port (Windows) ── */
if (process.platform === "win32") {
  try {
    const netstat = execSync(
      `netstat -ano | findstr :${PORT} | findstr LISTENING`,
      { encoding: "utf8" }
    );
    const pids = [
      ...new Set(
        netstat
          .trim()
          .split("\n")
          .map((l) => l.trim().split(/\s+/).pop())
          .filter((p) => p && p !== "0")
      ),
    ];
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`   ✔ Killed PID ${pid} on port ${PORT}`);
      } catch {
        /* process may have already exited */
      }
    }
  } catch {
    /* nothing listening — that's fine */
  }
} else {
  // macOS / Linux
  try {
    const pids = execSync(`lsof -ti :${PORT}`, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
        console.log(`   ✔ Killed PID ${pid} on port ${PORT}`);
      } catch {}
    }
  } catch {
    /* nothing listening */
  }
}

/* ── 3. Start next dev ── */
console.log(`\n🚀  Starting Next.js dev server on port ${PORT} …\n`);

const child = spawn("npx", ["next", "dev", "-p", PORT], {
  cwd: ROOT,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
