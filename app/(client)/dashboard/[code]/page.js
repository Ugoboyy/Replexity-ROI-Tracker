"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

import StatCard from "@/components/StatCard";
import FrequencyBadge from "@/components/FrequencyBadge";
import StatusBadge from "@/components/StatusBadge";
import TestimonialModal from "@/components/TestimonialModal";
import MobileNav from "@/components/MobileNav";
import { fmt$ } from "@/lib/format";

/* ══════════════════════════════════════════
   DASHBOARD PAGE
   ══════════════════════════════════════════ */
export default function DashboardPage() {
  const { code } = useParams();
  const router = useRouter();

  const [client, setClient] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showModal, setShowModal] = useState(false);

  /* ── period toggle ── */
  const [period, setPeriod] = useState("weekly");
  const [periodReady, setPeriodReady] = useState(false);

  /* ── automation ROI + Grok ── */
  const [roiData, setRoiData] = useState(null);
  const [grokData, setGrokData] = useState(null);
  const [grokLoading, setGrokLoading] = useState(false);

  function handlePeriodChange(newPeriod) {
    setPeriod(newPeriod);
    if (typeof window !== "undefined") {
      localStorage.setItem("reflexity_period", newPeriod);
    }
  }

  /* ── fetch data ── */
  useEffect(() => {
    async function load() {
      try {
        const cRes = await fetch(`/api/clients?slug=${code}`);
        if (cRes.status === 404) {
          setErrorMsg("Client not found. Please check your code.");
          setLoading(false);
          return;
        }
        if (cRes.status === 403) {
          setErrorMsg("Access has been removed. Contact Reflexity.");
          setLoading(false);
          return;
        }
        const cData = await cRes.json();
        if (cData.error || !cData.client) {
          setErrorMsg(cData.error || "Client not found.");
          setLoading(false);
          return;
        }
        setClient(cData.client);

        const freq = cData.client.log_frequency || cData.client.tracking_frequency || "weekly";
        const logType = freq === "monthly" ? "monthly" : "weekly";
        const lRes = await fetch(`/api/logs?client_id=${cData.client.id}&type=${logType}`);
        const lData = await lRes.json();
        setLogs(lData.logs || []);
      } catch (err) {
        console.error(err);
        setErrorMsg("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code]);

  /* ── restore period from localStorage ── */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("reflexity_period");
      if (saved === "monthly" || saved === "weekly") setPeriod(saved);
    }
    setPeriodReady(true);
  }, []);

  /* ── fetch automation ROI + Grok when client or period changes ── */
  useEffect(() => {
    if (!client || !periodReady) return;
    const userId = client.code || client.user_id || code;

    fetch(`/api/get-roi?user_id=${encodeURIComponent(userId)}&period=${period}`)
      .then((r) => r.json())
      .then((data) => setRoiData(data.error ? null : data))
      .catch(() => setRoiData(null));

    setGrokLoading(true);
    setGrokData(null);
    fetch(`/api/grok-analysis?user_id=${encodeURIComponent(userId)}&period=${period}`)
      .then((r) => r.json())
      .then((data) => setGrokData(data.error ? null : data))
      .catch(() => setGrokData(null))
      .finally(() => setGrokLoading(false));
  }, [client, period, periodReady, code]);

  /* ── dynamic page title ── */
  useEffect(() => {
    if (client) {
      const name = client.client_name || "Dashboard";
      const label = period === "monthly" ? "Monthly ROI" : "Weekly ROI";
      document.title = `${label} — ${name}`;
    }
  }, [client, period]);

  /* ── derived values ── */
  const logFrequency = client?.log_frequency || client?.tracking_frequency || "weekly";
  const isFrozen = client?.status === "frozen";

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    if (h >= 17 && h < 22) return "Good evening";
    return "Welcome";
  }, []);

  const { totalHours, totalMoney, totalPeriods, roi, avgSat } = useMemo(() => {
    let hours = 0;
    let money = 0;
    let satSum = 0;
    let satCount = 0;

    logs.forEach((log) => {
      hours += Number(log.hours_saved || 0);
      money += Number(log.money_saved || 0);
      if (log.satisfaction) {
        satSum += Number(log.satisfaction);
        satCount++;
      }
    });

    const cost = Math.max(Number(client?.project_cost || 0), 1);
    const roiVal = ((money - cost) / cost) * 100;

    return {
      totalHours: Math.round(hours * 10) / 10,
      totalMoney: money,
      totalPeriods: logs.length,
      roi: roiVal,
      avgSat: satCount > 0 ? satSum / satCount : 0,
    };
  }, [logs, client]);

  /* ══════════════ LOADING ══════════════ */
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-base animate-pulse">Loading dashboard…</p>
      </main>
    );
  }

  /* ══════════════ ERROR ══════════════ */
  if (errorMsg) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-300 text-lg">{errorMsg}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-[#7C3AED] text-white font-medium"
        >
          Return to Home
        </Link>
      </main>
    );
  }

  /* ══════════════ DASHBOARD ══════════════ */
  return (
    <>
      {/* ── STICKY HEADER (single row) ── */}
      <header className="sticky top-0 z-40 bg-[#1E293B] border-b border-[#334155] px-4 py-3 flex items-center justify-between">
        <img
          src="/reflexity-logo.png"
          alt="Reflexity"
          className="h-[58px] md:h-[60px] w-auto shrink-0"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <FrequencyBadge frequency={logFrequency} />
          <StatusBadge status={client.status} />
          <button
            onClick={() => router.push("/")}
            className="hidden md:flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-lg text-xs text-slate-300 border border-slate-600 hover:bg-slate-700 transition-colors"
            title="Sign out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── FROZEN BANNER ── */}
      {isFrozen && (
        <div className="bg-amber-900/30 border-b border-amber-700 px-4 py-3 text-center">
          <p className="text-amber-400 text-sm">
            Your access is currently paused. Contact Reflexity to reactivate.
          </p>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 pb-28 md:pb-20 space-y-6 mt-4">

        {/* ── DYNAMIC GREETING + DATE ── */}
        <div className="flex items-start justify-between pr-1 mb-[25px]">
          {/* Period toggle — left side, compact on mobile, full labels on desktop */}
          <div className="flex items-center bg-[#0F172A] border border-[#334155] rounded-full p-[3px]">
            {["weekly", "monthly"].map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1 rounded-full text-[11px] md:px-4 md:py-1.5 md:text-xs font-semibold transition-colors ${
                  period === p
                    ? "bg-[#6C63FF] text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="md:hidden">{p === "weekly" ? "Week" : "Month"}</span>
                <span className="hidden md:inline">{p === "weekly" ? "This Week" : "This Month"}</span>
              </button>
            ))}
          </div>
          <div className="text-right space-y-1">
            <p className="text-white font-semibold text-[14px] lg:text-[20px] leading-[1.2] whitespace-nowrap overflow-hidden text-ellipsis tracking-[-0.01em]">
              {greeting}, {client.client_name}
            </p>
            <p className="text-slate-400 lg:text-slate-400/80 font-normal text-[12px] lg:text-[18px] leading-[1.2]">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* ── HERO STAT ── */}
        <section className="text-center py-6">
          <p className="text-emerald-400 text-4xl sm:text-5xl font-bold">
            {fmt$(roiData?.dollar_value ?? totalMoney)}
          </p>
          <p className="text-slate-400 text-sm mt-2">
            {roiData
              ? `estimated value recovered ${period === "monthly" ? "this month" : "this week"}`
              : "total recovered since deployment"}
          </p>
        </section>

        {/* ── STAT CARDS ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Hours Recovered"
            value={`${roiData?.total_hours_saved ?? totalHours} hrs`}
            highlight={parseFloat(roiData?.total_hours_saved ?? totalHours) > 0 ? "green" : undefined}
          />
          <StatCard
            label="ROI"
            value={`${roiData?.roi_percent ?? roi.toFixed(0)}%`}
            highlight={parseFloat(roiData?.roi_percent ?? roi) >= 0 ? "green" : "red"}
          />
          <StatCard
            label="Executions"
            value={String(roiData?.total_executions ?? 0)}
            subtext="workflow runs tracked"
          />
          <StatCard
            label="Top Workflow"
            value={roiData?.top_workflow || "—"}
            subtext="most executed"
          />
        </section>

        {/* ── GROK ANALYSIS CARD ── */}
        <section id="ai-analysis" className="bg-[#1E293B] border border-[#6C63FF]/30 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#334155] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#6C63FF] text-lg">✦</span>
              <h2 className="text-white font-semibold text-sm">
                AI Analysis — {period === "monthly" ? "This Month" : "This Week"}
              </h2>
            </div>
            {roiData && (
              <span className="text-slate-500 text-xs">
                {roiData.total_executions ?? 0} automation run{roiData.total_executions !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {grokLoading && (
            <div className="flex items-center justify-center gap-3 py-12">
              <svg className="animate-spin h-5 w-5 text-[#6C63FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-slate-400 text-sm">Analysing your automations…</p>
            </div>
          )}

          {!grokLoading && !grokData && (
            <div className="px-5 py-8 text-center">
              <p className="text-slate-500 text-sm">No analysis available yet.</p>
              <p className="text-slate-600 text-xs mt-1">Log workflow executions via your automation platform (n8n, Make, Zapier etc.) to see your AI insights.</p>
            </div>
          )}

          {!grokLoading && grokData?.analysis && (
            <div className="px-5 py-5 space-y-5">
              {/* Headline + score */}
              <div className="flex items-start justify-between gap-4">
                <p className="text-white font-semibold text-base leading-snug flex-1">
                  {grokData.analysis.headline}
                </p>
                <div className="shrink-0 text-center">
                  <p className={`text-2xl font-bold ${
                    grokData.analysis.performance_score >= 70 ? "text-emerald-400"
                    : grokData.analysis.performance_score >= 40 ? "text-amber-400"
                    : "text-red-400"
                  }`}>{grokData.analysis.performance_score}</p>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wide">Score</p>
                </div>
              </div>

              {/* Trend badge */}
              {grokData.analysis.trend && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  grokData.analysis.trend === "growing"   ? "bg-emerald-900/40 text-emerald-400 border border-emerald-700/40"
                  : grokData.analysis.trend === "declining" ? "bg-red-900/40 text-red-400 border border-red-700/40"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  {grokData.analysis.trend === "growing" ? "↑" : grokData.analysis.trend === "declining" ? "↓" : "→"}
                  {" "}{grokData.analysis.trend.charAt(0).toUpperCase() + grokData.analysis.trend.slice(1)}
                </span>
              )}

              {/* Insight rows */}
              {[
                { label: "Top Insight",    value: grokData.analysis.top_insight },
                { label: "What's Working", value: grokData.analysis.whats_working },
                { label: "ROI Verdict",    value: grokData.analysis.roi_verdict },
                { label: "Opportunity",    value: grokData.analysis.opportunity },
                { label: "Next Action",    value: grokData.analysis.next_action },
              ].filter((r) => r.value).map((row) => (
                <div key={row.label} className="border-t border-[#334155] pt-4">
                  <p className="text-[#6C63FF] text-xs font-semibold uppercase tracking-wider mb-1.5">{row.label}</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{row.value}</p>
                </div>
              ))}

              {/* Encouragement */}
              {grokData.analysis.encouragement && (
                <div className="bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-xl px-4 py-3">
                  <p className="text-[#a5a0ff] text-sm italic leading-relaxed">
                    &ldquo;{grokData.analysis.encouragement}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Fallback: raw stats when Grok parse failed */}
          {!grokLoading && grokData?.fallback === true && roiData && (
            <div className="px-5 py-5">
              <p className="text-amber-400 text-xs mb-3">AI analysis unavailable — showing raw stats:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Executions",  value: roiData.total_executions },
                  { label: "Hours Saved", value: `${roiData.total_hours_saved} hrs` },
                  { label: "Value",       value: `$${roiData.dollar_value}` },
                  { label: "ROI",         value: `${roiData.roi_percent}%` },
                ].map((s) => (
                  <div key={s.label} className="bg-[#0F172A] rounded-xl px-3 py-3 text-center">
                    <p className="text-white font-bold text-lg">{s.value}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── DAILY ACTIVITY CHART ── */}
        {roiData?.daily_breakdown?.length > 0 ? (
          <section className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">
              Daily Executions — {period === "monthly" ? "Last 30 Days" : "Last 7 Days"}
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={roiData.daily_breakdown} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(d) => {
                    const dt = new Date(d);
                    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                  labelFormatter={(d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  formatter={(v) => [`${v} run${v !== 1 ? "s" : ""}`, "Executions"]}
                  cursor={{ fill: "rgba(108,99,255,0.08)" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {roiData.daily_breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.count > 0 ? "#6C63FF" : "#1E293B"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>
        ) : (
          <section className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 text-center">
            <p className="text-slate-500 text-sm">No executions yet this {period === "monthly" ? "month" : "week"}.</p>
            <p className="text-slate-600 text-xs mt-1">
              Connect your automation platform (n8n, Make, Zapier etc.) to start tracking.
            </p>
          </section>
        )}

        {/* ── EXECUTION BREAKDOWN TABLE ── */}
        {roiData?.by_category?.length > 0 && (
          <section className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Runs by Category</h3>
            <div className="space-y-3">
              {roiData.by_category.map((cat) => {
                const max = roiData.by_category[0]?.count ?? 1;
                const pct = max > 0 ? Math.round((cat.count / max) * 100) : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <p className="text-slate-300 text-xs w-28 shrink-0 truncate capitalize">
                      {cat.category || "Uncategorised"}
                    </p>
                    <div className="flex-1 bg-[#0F172A] rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-[#6C63FF]" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-slate-400 text-xs w-14 text-right shrink-0">
                      {cat.count} run{cat.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── ACTION BUTTONS ── */}
        <section className="hidden md:flex flex-wrap gap-4 pt-2">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 font-semibold transition-colors"
          >
            Share My Results
          </button>
        </section>

      </main>

      {/* ── MOBILE NAV ── */}
      <MobileNav
        activeTab="dashboard"
        clientCode={code}
        onShare={() => setShowModal(true)}
        onSignOut={() => router.push("/")}
        onInsights={() => document.getElementById("ai-analysis")?.scrollIntoView({ behavior: "smooth" })}
      />

      {/* ── TESTIMONIAL MODAL ── */}
      <TestimonialModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        client={client}
        roiData={roiData}
        period={period}
      />
    </>
  );
}
