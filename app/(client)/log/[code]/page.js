"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import {
  hasAlreadyLoggedThisPeriod,
  getNextLogDeadline,
  getPeriodLabel,
  formatPeriodDateForDB,
} from "@/lib/periodUtils";

/* ══════════════════════════════════════════
   QUICK-SELECT CHIPS
   ══════════════════════════════════════════ */
function QuickChips({ options, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(String(opt.value))}
          className="h-11 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   SATISFACTION PICKER (emoji row)
   ══════════════════════════════════════════ */
const satOptions = [
  { value: 1, emoji: "😟", label: "Poor" },
  { value: 2, emoji: "😐", label: "Fair" },
  { value: 3, emoji: "🙂", label: "OK" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Great" },
];

function SatisfactionPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 justify-between">
      {satOptions.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 flex flex-col items-center gap-1 h-20 rounded-xl transition-all ${
            value === opt.value
              ? "bg-[#7C3AED]/20 border-2 border-[#7C3AED]"
              : "bg-slate-800 border-2 border-transparent hover:border-slate-600"
          }`}
        >
          <span className="text-2xl mt-2">{opt.emoji}</span>
          <span className="text-xs text-slate-400">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   PROGRESS DOTS
   ══════════════════════════════════════════ */
function ProgressDots({ total, current }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i === current
              ? "w-6 bg-[#7C3AED]"
              : i < current
              ? "w-2 bg-[#7C3AED]/50"
              : "w-2 bg-slate-700"
          }`}
        />
      ))}
      <span className="text-xs text-slate-500 ml-2">
        {current + 1} of {total}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════
   FULL-SCREEN LOADING OVERLAY
   ══════════════════════════════════════════ */
function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A] flex flex-col items-center justify-center gap-6">
      <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-300 text-lg font-medium animate-pulse">
        Analysing your results…
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════
   LOG PAGE
   ══════════════════════════════════════════ */
export default function LogPage() {
  const { code } = useParams();
  const router = useRouter();

  /* data state */
  const [client, setClient] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(""); // "frozen"|"revoked"|"already"

  /* form fields */
  const [hoursSaved, setHoursSaved] = useState("");
  const [moneySaved, setMoneySaved] = useState("");
  const [errorsCaught, setErrorsCaught] = useState("0");
  const [issuesNoted, setIssuesNoted] = useState("");
  const [satisfaction, setSatisfaction] = useState(0);

  /* mobile stepper */
  const [step, setStep] = useState(0);
  const totalSteps = 5;

  /* derived */
  const logFrequency = client?.log_frequency || client?.tracking_frequency || "weekly";
  const isMonthly = logFrequency === "monthly";
  const periodWord = isMonthly ? "month" : "week";
  const periodNumber = logs.length + 1;

  const prevTotalHours = logs.reduce((s, l) => s + Number(l.hours_saved || 0), 0);
  const prevTotalMoney = logs.reduce((s, l) => s + Number(l.money_saved || 0), 0);

  const periodLabel = client
    ? getPeriodLabel(logFrequency, new Date(), logs.length)
    : "";

  /* ── load ── */
  useEffect(() => {
    async function load() {
      try {
        const cRes = await fetch(`/api/clients?code=${code}`);
        const cData = await cRes.json();
        if (cData.error || !cData.client) {
          setError(cData.error || "Client not found.");
          setLoading(false);
          return;
        }
        const c = cData.client;
        setClient(c);

        if (c.status === "frozen" || c.status === "revoked") {
          setBlocked(c.status);
          setLoading(false);
          return;
        }

        const freq = c.log_frequency || c.tracking_frequency || "weekly";
        const logType = freq === "monthly" ? "monthly" : "weekly";
        const lRes = await fetch(`/api/logs?client_id=${c.id}&type=${logType}`);
        const lData = await lRes.json();
        const fetchedLogs = lData.logs || [];
        setLogs(fetchedLogs);

        if (hasAlreadyLoggedThisPeriod(fetchedLogs, freq)) {
          setBlocked("already");
        }
      } catch {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [code]);

  /* ── can advance step? ── */
  function canAdvance() {
    if (step === 0) return hoursSaved !== "" && Number(hoursSaved) >= 0;
    if (step === 1) return moneySaved !== "" && Number(moneySaved) >= 0;
    if (step === 2) return true; // errors default 0
    if (step === 3) return true; // optional
    if (step === 4) return satisfaction > 0;
    return false;
  }

  /* ── submit ── */
  async function handleSubmit() {
    if (!satisfaction) {
      setError("Please select a satisfaction rating.");
      return;
    }
    setError("");
    setSaving(true);

    try {
      const logDate = formatPeriodDateForDB(logFrequency);

      /* 1. Insert log */
      const logRes = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client.id,
          type: isMonthly ? "monthly" : "weekly",
          log_period: periodNumber,
          log_date: logDate,
          hours_saved: Number(hoursSaved),
          money_saved: Number(moneySaved),
          errors_caught: Number(errorsCaught),
          issues_noted: issuesNoted,
          satisfaction,
        }),
      });
      const logData = await logRes.json();
      if (!logData.log) throw new Error("Failed to save log");

      /* 2. Get AI insight */
      const insightRes = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: client.client_name,
          automationType: client.automation_type,
          ...(isMonthly
            ? { monthNumber: periodNumber }
            : { weekNumber: periodNumber }),
          hoursSaved: Number(hoursSaved),
          moneySaved: Number(moneySaved),
          errorsCaught: Number(errorsCaught),
          issuesNoted,
          satisfaction,
          cumulativeHours: prevTotalHours + Number(hoursSaved),
          cumulativeMoney: prevTotalMoney + Number(moneySaved),
        }),
      });
      const insightData = await insightRes.json();

      /* 3. Update log with AI insight */
      if (insightData.insight) {
        await fetch("/api/logs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: logData.log.id,
            type: isMonthly ? "monthly" : "weekly",
            ai_insight: insightData.insight,
          }),
        });
      }

      /* 4. Redirect */
      router.push(`/dashboard/${code}?logged=true`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  /* ══════════════ SAVING OVERLAY ══════════════ */
  if (saving) return <LoadingOverlay />;

  /* ══════════════ LOADING ══════════════ */
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Loading…</p>
      </main>
    );
  }

  /* ══════════════ ERROR ══════════════ */
  if (error && !client) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-300 text-lg">{error}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-[#7C3AED] text-white font-medium"
        >
          Return to Home
        </Link>
      </main>
    );
  }

  /* ══════════════ BLOCKED ══════════════ */
  if (blocked) {
    const messages = {
      frozen:
        "Your access is currently paused. You cannot log new entries. Contact Reflexity to reactivate.",
      revoked:
        "Your access has been removed. Contact Reflexity for more information.",
      already: `You have already logged this ${periodWord}. Come back next ${periodWord}.`,
    };
    const deadline = getNextLogDeadline(logs, logFrequency);
    const userTz = typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-300 text-base max-w-sm">{messages[blocked]}</p>
        {blocked === "already" && deadline && (
          <p className="text-slate-500 text-xs">
            Next log opens{" "}
            {deadline.toLocaleString("en-US", {
              timeZone: userTz,
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            ({userTz})
          </p>
        )}
        <Link
          href={`/dashboard/${code}`}
          className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-[#7C3AED] text-white font-medium"
        >
          Back to Dashboard
        </Link>
      </main>
    );
  }

  /* ══════════════ STEP CONTENT (mobile) ══════════════ */
  const steps = [
    /* STEP 0 — Hours */
    <div key="hours" className="space-y-3">
      <p className="text-white text-lg font-semibold">
        How many hours did your team save this {periodWord}?
      </p>
      <input
        type="number"
        step="0.5"
        min="0"
        required
        value={hoursSaved}
        onChange={(e) => setHoursSaved(e.target.value)}
        placeholder="0"
        className="input-field h-12 text-lg"
      />
      <QuickChips
        options={[
          { label: "2 hrs", value: 2 },
          { label: "4 hrs", value: 4 },
          { label: "8 hrs", value: 8 },
          { label: "12 hrs", value: 12 },
          { label: "20+", value: 20 },
        ]}
        onSelect={setHoursSaved}
      />
      <p className="text-xs text-slate-500 mt-1">
        Count time saved vs doing this task manually
      </p>
    </div>,

    /* STEP 1 — Money */
    <div key="money" className="space-y-3">
      <p className="text-white text-lg font-semibold">
        What is the estimated value saved this {periodWord}?
      </p>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
          $
        </span>
        <input
          type="number"
          min="0"
          required
          value={moneySaved}
          onChange={(e) => setMoneySaved(e.target.value)}
          placeholder="0"
          className="input-field h-12 text-lg pl-8"
        />
      </div>
      <QuickChips
        options={[
          { label: "$100", value: 100 },
          { label: "$250", value: 250 },
          { label: "$500", value: 500 },
          { label: "$1,000", value: 1000 },
          { label: "$2,000+", value: 2000 },
        ]}
        onSelect={setMoneySaved}
      />
      <p className="text-xs text-slate-500 mt-1">
        Hours saved × your hourly rate, or revenue protected
      </p>
    </div>,

    /* STEP 2 — Errors */
    <div key="errors" className="space-y-3">
      <p className="text-white text-lg font-semibold">
        How many errors or problems did the automation catch?
      </p>
      <input
        type="number"
        min="0"
        value={errorsCaught}
        onChange={(e) => setErrorsCaught(e.target.value)}
        placeholder="0"
        className="input-field h-12 text-lg"
      />
      <p className="text-xs text-slate-500 mt-1">
        Count anything the automation flagged that you would have missed
      </p>
    </div>,

    /* STEP 3 — Issues */
    <div key="issues" className="space-y-3">
      <p className="text-white text-lg font-semibold">
        Did the automation hit any problems?
      </p>
      <textarea
        rows={3}
        value={issuesNoted}
        onChange={(e) => setIssuesNoted(e.target.value)}
        placeholder="e.g. The webhook timed out twice on Tuesday"
        className="input-field resize-none"
      />
      <p className="text-xs text-slate-500 mt-1">
        Leave blank if everything ran smoothly
      </p>
    </div>,

    /* STEP 4 — Satisfaction */
    <div key="satisfaction" className="space-y-3">
      <p className="text-white text-lg font-semibold">
        How satisfied are you with results this {periodWord}?
      </p>
      <SatisfactionPicker value={satisfaction} onChange={setSatisfaction} />
    </div>,
  ];

  /* ══════════════ RENDER ══════════════ */
  return (
    <>
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-[#1E293B] border-b border-[#334155] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${code}`}
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-700 transition-colors"
            aria-label="Back to dashboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-slate-300"
            >
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-semibold text-sm truncate">
              Log {periodLabel} Results
            </h1>
            <p className="text-slate-400 text-xs truncate">
              {client.client_name} — {client.automation_type}
            </p>
          </div>
        </div>
      </header>

      {/* ════════ MOBILE: STEP-BY-STEP ════════ */}
      <main className="md:hidden max-w-xl mx-auto px-4 pt-6 pb-24">
        {/* Progress */}
        <div className="mb-6">
          <ProgressDots total={totalSteps} current={step} />
        </div>

        {/* Current step */}
        <div className="min-h-[240px]">{steps[step]}</div>

        {/* Error */}
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        {/* Fixed bottom button bar */}
        <div className="fixed bottom-14 left-0 right-0 z-30 bg-[#0F172A]/95 border-t border-[#334155] px-4 py-3 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="h-14 px-5 rounded-lg border border-slate-600 text-slate-300 font-medium transition-colors hover:bg-slate-800"
            >
              Back
            </button>
          )}
          {step < totalSteps - 1 ? (
            <button
              type="button"
              disabled={!canAdvance()}
              onClick={() => setStep(step + 1)}
              className="flex-1 h-14 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={!canAdvance()}
              onClick={handleSubmit}
              className="flex-1 h-14 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save My Results
            </button>
          )}
        </div>
      </main>

      {/* ════════ DESKTOP: ALL FIELDS ════════ */}
      <main className="hidden md:block max-w-xl mx-auto px-4 pt-8 pb-24">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Hours */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">
              Hours saved this {periodWord}
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              required
              value={hoursSaved}
              onChange={(e) => setHoursSaved(e.target.value)}
              placeholder="e.g. 12"
              className="input-field h-12"
            />
            <QuickChips
              options={[
                { label: "2 hrs", value: 2 },
                { label: "4 hrs", value: 4 },
                { label: "8 hrs", value: 8 },
                { label: "12 hrs", value: 12 },
                { label: "20+", value: 20 },
              ]}
              onSelect={setHoursSaved}
            />
            <p className="text-xs text-slate-500 mt-1">
              Count time saved vs doing this task manually
            </p>
          </div>

          {/* Money */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">
              Money saved this {periodWord} ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                $
              </span>
              <input
                type="number"
                min="0"
                required
                value={moneySaved}
                onChange={(e) => setMoneySaved(e.target.value)}
                placeholder="e.g. 2400"
                className="input-field h-12 pl-8"
              />
            </div>
            <QuickChips
              options={[
                { label: "$100", value: 100 },
                { label: "$250", value: 250 },
                { label: "$500", value: 500 },
                { label: "$1,000", value: 1000 },
                { label: "$2,000+", value: 2000 },
              ]}
              onSelect={setMoneySaved}
            />
            <p className="text-xs text-slate-500 mt-1">
              Hours saved × your hourly rate, or revenue protected
            </p>
          </div>

          {/* Errors */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">
              Errors caught by the automation
            </label>
            <input
              type="number"
              min="0"
              value={errorsCaught}
              onChange={(e) => setErrorsCaught(e.target.value)}
              placeholder="0"
              className="input-field h-12"
            />
            <p className="text-xs text-slate-500 mt-1">
              Count anything the automation flagged that you would have missed
            </p>
          </div>

          {/* Issues */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">
              Any issues this {periodWord}?
            </label>
            <textarea
              rows={3}
              value={issuesNoted}
              onChange={(e) => setIssuesNoted(e.target.value)}
              placeholder="e.g. The webhook timed out twice on Tuesday"
              className="input-field resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Leave blank if everything ran smoothly
            </p>
          </div>

          {/* Satisfaction */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">
              Satisfaction this {periodWord}
            </label>
            <SatisfactionPicker value={satisfaction} onChange={setSatisfaction} />
          </div>

          {/* Error */}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={!satisfaction}
            className="w-full h-14 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save My Results
          </button>
        </form>
      </main>

      {/* MOBILE NAV */}
      <MobileNav activeTab="log" clientCode={code} />

      {/* Global input styles */}
      <style jsx global>{`
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: #1e293b;
          border: 1px solid #334155;
          color: #f8fafc;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field::placeholder {
          color: #64748b;
        }
        .input-field:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.25);
        }
      `}</style>
    </>
  );
}
