"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import StatCard from "@/components/StatCard";
import RoiChart from "@/components/RoiChart";
import LogList from "@/components/LogList";
import FrequencyBadge from "@/components/FrequencyBadge";
import StatusBadge from "@/components/StatusBadge";
import TestimonialModal from "@/components/TestimonialModal";
import MobileNav from "@/components/MobileNav";
import { hasAlreadyLoggedThisPeriod, getNextLogDeadline } from "@/lib/periodUtils";
import { fmt$, pluralize } from "@/lib/format";

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
  const [dismissedBanner, setDismissedBanner] = useState(false);

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

  /* ── derived values ── */
  const logFrequency = client?.log_frequency || client?.tracking_frequency || "weekly";
  const isMonthly = logFrequency === "monthly";
  const periodWord = isMonthly ? "Month" : "Week";
  const isFrozen = client?.status === "frozen";
  const alreadyLogged = hasAlreadyLoggedThisPeriod(logs, logFrequency);
  const nextDeadline = getNextLogDeadline(logs, logFrequency);
  const userTz = typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC";

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
      <header className="sticky top-0 z-40 bg-[#1E293B] border-b border-[#334155] px-4 py-3 flex items-center gap-3">
        <img
          src="/reflexity-logo.png"
          alt="Reflexity"
          className="h-[58px] md:h-[60px] w-auto shrink-0"
        />
        <h1 className="text-white font-semibold text-[20px] lg:text-[40px] lg:leading-[1.1] whitespace-nowrap overflow-hidden text-ellipsis text-center flex-1 min-w-0">
          {client.client_name}
        </h1>
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

        {/* ── HERO STAT ── */}
        <section className="text-center py-6">
          <p className="text-emerald-400 text-4xl sm:text-5xl font-bold">
            {fmt$(totalMoney)}
          </p>
          <p className="text-slate-400 text-sm mt-2">
            total recovered since deployment
          </p>
        </section>

        {/* ── STAT CARDS ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Hours Recovered"
            value={`${totalHours} hrs`}
          />
          <StatCard
            label="ROI"
            value={
              <span className={roi >= 0 ? "text-emerald-400" : "text-red-400"}>
                {roi.toFixed(0)}%
              </span>
            }
          />
          <StatCard
            label="Periods Logged"
            value={`${totalPeriods} ${pluralize(totalPeriods, isMonthly ? "month" : "week")}`}
          />
          <StatCard
            label="Avg Satisfaction"
            value={`${avgSat.toFixed(1)}/5 ⭐`}
          />
        </section>

        {/* ── ROI CHART ── */}
        <RoiChart logs={logs} logFrequency={logFrequency} />

        {/* ── LOG HISTORY ── */}
        <LogList logs={logs} logFrequency={logFrequency} />

        {/* ── ACTION BUTTONS (visible on md+ inline, hidden on mobile where nav takes over) ── */}
        <section className="hidden md:flex flex-wrap gap-4 pt-2">
          {client.status === "active" && !alreadyLogged && (
            <Link
              href={`/log/${code}`}
              className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold transition-colors"
            >
              Log This {periodWord}
            </Link>
          )}
          {client.status === "active" && alreadyLogged && (
            <div className="self-center">
              <p className="text-slate-400 text-sm">
                Already logged this period. Come back next {periodWord.toLowerCase()}.
              </p>
              {nextDeadline && (
                <p className="text-slate-500 text-xs mt-1">
                  Next log opens{" "}
                  {nextDeadline.toLocaleString("en-US", {
                    timeZone: userTz,
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  ({userTz})
                </p>
              )}
            </div>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 font-semibold transition-colors"
          >
            Share My Results
          </button>
        </section>

        {/* ── MOBILE: inline "already logged" banner (dismissible) ── */}
        {client.status === "active" && alreadyLogged && !dismissedBanner && (
          <section className="md:hidden bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 relative">
            <button
              type="button"
              onClick={() => setDismissedBanner(true)}
              className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 transition-colors p-1"
              aria-label="Dismiss"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <p className="text-slate-400 text-sm text-center pr-6">
              Already logged this period. Come back next {periodWord.toLowerCase()}.
            </p>
            {nextDeadline && (
              <p className="text-slate-500 text-xs mt-1 text-center">
                Next log opens{" "}
                {nextDeadline.toLocaleString("en-US", {
                  timeZone: userTz,
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                ({userTz})
              </p>
            )}
          </section>
        )}

        {/* ── MOBILE: fixed "Log This Week" CTA (only when not yet logged) ── */}
        {client.status === "active" && !alreadyLogged && (
          <section className="fixed bottom-14 left-0 right-0 z-30 bg-[#0F172A]/95 border-t border-[#334155] px-4 py-3 md:hidden">
            <Link
              href={`/log/${code}`}
              className="flex items-center justify-center w-full h-11 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold transition-colors"
            >
              Log This {periodWord}
            </Link>
          </section>
        )}
      </main>

      {/* ── MOBILE NAV ── */}
      <MobileNav
        activeTab="dashboard"
        clientCode={code}
        onShare={() => setShowModal(true)}
        onSignOut={() => router.push("/")}
      />

      {/* ── TESTIMONIAL MODAL ── */}
      <TestimonialModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        client={client}
        totalMoney={totalMoney}
        totalHours={totalHours}
        totalPeriods={totalPeriods}
        avgSatisfaction={avgSat}
        logFrequency={logFrequency}
      />
    </>
  );
}
