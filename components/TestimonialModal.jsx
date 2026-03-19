"use client";

import { useState } from "react";
import { fmt$ } from "@/lib/format";

function Stars({ count }) {
  const full = Math.round(count || 0);
  return (
    <span className="text-yellow-400 text-xl tracking-wider">
      {"★".repeat(Math.min(full, 5))}
      {"☆".repeat(Math.max(5 - full, 0))}
    </span>
  );
}

export default function TestimonialModal({
  isOpen,
  onClose,
  client,
  totalMoney,
  totalHours,
  totalPeriods,
  avgSatisfaction,
  logFrequency,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const periodWord = totalPeriods === 1
    ? (logFrequency === "monthly" ? "month" : "week")
    : (logFrequency === "monthly" ? "months" : "weeks");
  const rec = avgSatisfaction >= 4 ? "Highly recommended." : "Solid results.";

  const shareText = [
    `${totalPeriods} ${periodWord} using Reflexity automations.`,
    `Saved ${fmt$(totalMoney)} in total.`,
    `Recovered ${totalHours} hours.`,
    rec,
  ].join("\n");

  function handleCopy() {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleTweet() {
    const url =
      "https://twitter.com/intent/tweet?text=" + encodeURIComponent(shareText);
    window.open(url, "_blank", "noopener");
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 bg-black/60"
      onClick={onClose}
    >
      {/* Sheet — mobile bottom sheet / desktop centred */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          fixed bottom-0 left-0 right-0
          bg-slate-900 rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto
          animate-slide-up
          md:static md:max-w-sm md:mx-auto md:rounded-2xl md:mt-0
          md:relative md:top-1/2 md:-translate-y-1/2
        "
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ─── Testimonial Card ─── */}
        <div className="bg-gradient-to-br from-purple-900 to-slate-900 rounded-xl p-5 border border-purple-500/30 text-center space-y-3 mt-2">
          <p className="text-purple-400 text-xs font-semibold tracking-wide uppercase">
            Reflexity ROI Tracker
          </p>

          <p className="text-slate-200 text-lg font-medium">
            {totalPeriods} {periodWord} with Reflexity
          </p>

          <p className="text-emerald-400 text-4xl font-bold">
            {fmt$(totalMoney)}
          </p>
          <p className="text-slate-400 text-sm -mt-1">total recovered</p>

          <p className="text-slate-200 text-base">
            {totalHours} hours recovered
          </p>

          <Stars count={avgSatisfaction} />

          <p className="text-slate-600 text-xs pt-1">Reflexity ROI Tracker</p>
        </div>

        {/* ─── Action Buttons ─── */}
        <div className="mt-5 space-y-3">
          {/* Copy Text */}
          <button
            onClick={handleCopy}
            className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              "Copy Text"
            )}
          </button>

          {/* Share on X */}
          <button
            onClick={handleTweet}
            className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            Share on
            {/* Official X brand icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-label="X">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full py-2 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
