"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ──────────────────────────────────────────
   Tiny helper: format a number as $X,XXX.XX
   ────────────────────────────────────────── */
function fmt$(n) {
  const num = parseFloat(n) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(num);
}

/* ──────────────────────────────────────────
   Stat Card
   ────────────────────────────────────────── */
function MetricCard({ label, value, sub, accent }) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-5 flex flex-col gap-1">
      <p className="text-slate-400 text-xs uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${accent || "text-white"}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs">{sub}</p>}
    </div>
  );
}

/* ──────────────────────────────────────────
   Daily bar row
   ────────────────────────────────────────── */
function DailyRow({ date, count, maxCount }) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  const label = new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return (
    <div className="flex items-center gap-3">
      <p className="text-slate-400 text-xs w-24 shrink-0">{label}</p>
      <div className="flex-1 bg-[#0F172A] rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full bg-[#7C3AED]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-slate-300 text-xs w-6 text-right">{count}</p>
    </div>
  );
}

/* ══════════════════════════════════════════
   DEMO CLIENT PAGE
   ══════════════════════════════════════════ */
export default function DemoClientPage() {
  const router = useRouter();

  const [roi, setRoi] = useState(null);
  const [loadingRoi, setLoadingRoi] = useState(true);
  const [roiError, setRoiError] = useState("");

  const [userId, setUserId] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");

  /* ── fetch anonymous ROI data ── */
  useEffect(() => {
    fetch("/api/get-roi?user_id=anonymous&period=weekly")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRoi(data);
      })
      .catch((err) => setRoiError(err.message || "Could not load preview data."))
      .finally(() => setLoadingRoi(false));
  }, []);

  /* ── claim handler ── */
  async function handleClaim(e) {
    e.preventDefault();
    setClaimError("");
    const trimmed = userId.trim().toUpperCase();

    if (!trimmed) {
      setClaimError("Please enter your Reflexity User ID.");
      return;
    }

    setClaiming(true);
    try {
      // Step 1: claim the anonymous executions
      const claimRes = await fetch("/api/claim-executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: trimmed }),
      });
      const claimData = await claimRes.json();
      if (!claimData.success) throw new Error(claimData.error || "Claim failed.");

      // Step 2: look up the client's slug so we land on the correct dashboard URL
      const clientRes = await fetch(`/api/clients?code=${encodeURIComponent(trimmed)}`);
      if (clientRes.ok) {
        const clientData = await clientRes.json();
        const slug = clientData.client?.slug;
        if (slug) {
          router.push(`/dashboard/${slug}`);
          return;
        }
      }

      // Fallback: slug not found — send to home so they can log in normally
      setClaimError(
        `Your data has been claimed! Log in at the home page to access your dashboard.`
      );
      setClaiming(false);
    } catch (err) {
      setClaimError(err.message || "Something went wrong. Please try again.");
      setClaiming(false);
    }
  }

  /* ── derived metrics ── */
  const totalExecutions = roi?.total_executions ?? 0;
  const hoursSaved = parseFloat(roi?.total_hours_saved ?? 0);
  const dollarValue = parseFloat(roi?.dollar_value ?? 0);
  const roiPercent = parseFloat(roi?.roi_percent ?? 0);
  const topWorkflow = roi?.top_workflow ?? "—";
  const byCategory = roi?.by_category ?? [];
  const daily = roi?.daily_breakdown ?? [];
  const maxDaily = daily.length > 0 ? Math.max(...daily.map((d) => d.count)) : 0;

  return (
    <>
      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-40 bg-[#1E293B] border-b border-[#334155] px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <img
            src="/reflexity-logo.png"
            alt="Reflexity"
            className="h-[52px] md:h-[58px] w-auto shrink-0"
          />
        </Link>
        <span className="text-xs text-slate-400 border border-[#334155] rounded-full px-3 py-1 bg-[#0F172A]">
          Preview Dashboard
        </span>
      </header>

      {/* ── PREVIEW BANNER ── */}
      <div className="bg-amber-900/30 border-b border-amber-700/60 px-4 py-4 text-center">
        <p className="text-amber-300 font-semibold text-sm md:text-base">
          This is a preview dashboard.
        </p>
        <p className="text-amber-200/70 text-xs md:text-sm mt-1">
          Set your User ID to see your personal automation ROI.
        </p>
      </div>

      <main className="max-w-4xl mx-auto px-4 pb-20 space-y-8 mt-6">

        {/* ── CLAIM CARD ── */}
        <section className="bg-[#1E293B] border border-[#7C3AED]/40 rounded-2xl p-6 shadow-lg shadow-[#7C3AED]/5">
          <h2 className="text-white font-bold text-lg mb-1">Claim Your Automation Data</h2>
          <p className="text-slate-400 text-sm mb-5">
            Enter your Reflexity User ID to link all anonymous runs to your account
            and unlock your personal dashboard.
          </p>

          <form onSubmit={handleClaim} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Your User ID"
              disabled={claiming}
              className="flex-1 h-11 px-4 rounded-lg bg-[#0F172A] border border-[#334155] text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-[#7C3AED] transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={claiming || !userId.trim()}
              className="h-11 px-6 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shrink-0"
            >
              {claiming ? "Claiming…" : "Claim My Data"}
            </button>
          </form>

          {claimError && (
            <p className="text-red-400 text-sm mt-3">{claimError}</p>
          )}
        </section>

        {/* ── ROI METRICS ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">Preview Metrics</h2>
            <span className="text-slate-500 text-xs">Based on all anonymous runs</span>
          </div>

          {loadingRoi && (
            <p className="text-slate-400 text-sm animate-pulse">Loading metrics…</p>
          )}

          {roiError && (
            <p className="text-red-400 text-sm">{roiError}</p>
          )}

          {!loadingRoi && !roiError && (
            <>
              {/* ── HERO ── */}
              <div className="bg-[#1E293B] border border-[#334155] rounded-2xl py-8 text-center mb-4">
                <p className="text-emerald-400 text-5xl font-bold">
                  {fmt$(dollarValue)}
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  estimated value recovered this period
                </p>
              </div>

              {/* ── STAT GRID ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <MetricCard
                  label="Executions"
                  value={totalExecutions.toLocaleString()}
                  sub="workflow runs tracked"
                />
                <MetricCard
                  label="Hours Saved"
                  value={`${hoursSaved.toFixed(1)} hrs`}
                  sub="at default 5 min/run"
                />
                <MetricCard
                  label="ROI"
                  value={`${roiPercent >= 0 ? "+" : ""}${roiPercent.toFixed(0)}%`}
                  accent={roiPercent >= 0 ? "text-emerald-400" : "text-red-400"}
                  sub="vs. membership cost"
                />
                <MetricCard
                  label="Top Workflow"
                  value={topWorkflow === "—" ? "—" : topWorkflow}
                  sub="most executed"
                />
              </div>

              {/* ── BY CATEGORY ── */}
              {byCategory.length > 0 && (
                <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 mb-4">
                  <h3 className="text-white font-semibold text-sm mb-4">By Category</h3>
                  <div className="space-y-3">
                    {byCategory.map((cat) => {
                      const catMax = byCategory[0]?.count ?? 1;
                      const pct = catMax > 0 ? Math.round((cat.count / catMax) * 100) : 0;
                      return (
                        <div key={cat.category} className="flex items-center gap-3">
                          <p className="text-slate-300 text-xs w-28 shrink-0 truncate capitalize">
                            {cat.category || "Uncategorized"}
                          </p>
                          <div className="flex-1 bg-[#0F172A] rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-emerald-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-slate-400 text-xs w-8 text-right">{cat.count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── DAILY BREAKDOWN ── */}
              {daily.length > 0 && (
                <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
                  <h3 className="text-white font-semibold text-sm mb-4">Daily Activity</h3>
                  <div className="space-y-3">
                    {daily.map((d) => (
                      <DailyRow
                        key={d.date}
                        date={d.date}
                        count={d.count}
                        maxCount={maxDaily}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── EMPTY STATE ── */}
              {totalExecutions === 0 && (
                <div className="bg-[#1E293B] border border-[#334155] rounded-xl py-12 text-center">
                  <p className="text-slate-400 text-sm">
                    No anonymous executions yet.
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    Runs logged without a User ID will appear here.
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── FOOTER NOTE ── */}
        <p className="text-center text-slate-600 text-xs pb-4">
          Reflexity ROI Tracker · Preview Mode ·{" "}
          <Link href="/" className="hover:text-slate-400 transition-colors underline underline-offset-2">
            Return to Home
          </Link>
        </p>

      </main>
    </>
  );
}
