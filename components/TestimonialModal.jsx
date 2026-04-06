"use client";

import { useState } from "react";
import { fmt$ } from "@/lib/format";

export default function TestimonialModal({
  isOpen,
  onClose,
  client,
  roiData,
  period,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const name        = client?.client_name || "Member";
  const executions  = roiData?.total_executions ?? 0;
  const hoursSaved  = parseFloat(roiData?.total_hours_saved ?? 0);
  const dollarValue = parseFloat(roiData?.dollar_value ?? 0);
  const roiPercent  = parseFloat(roiData?.roi_percent ?? 0);
  const topWorkflow = roiData?.top_workflow;
  const periodLabel = period === "monthly" ? "month" : "week";
  const roiPositive = roiPercent >= 0;

  const shareText = [
    `My automations saved me ${fmt$(dollarValue)} this ${periodLabel} — tracked with Reflexity.`,
    `${executions} workflow run${executions !== 1 ? "s" : ""} logged. ${hoursSaved} hours recovered.`,
    topWorkflow ? `Top workflow: ${topWorkflow}.` : null,
    roiPositive
      ? `ROI: +${roiPercent.toFixed(0)}% on my membership. 🚀`
      : `Building momentum — ${Math.abs(roiPercent).toFixed(0)}% to go to break even.`,
  ].filter(Boolean).join("\n");

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
            {name}&apos;s {periodLabel} in automation
          </p>

          <p className="text-emerald-400 text-4xl font-bold">
            {fmt$(dollarValue)}
          </p>
          <p className="text-slate-400 text-sm -mt-1">estimated value recovered</p>

          <div className="flex items-center justify-center gap-4 pt-1">
            <div>
              <p className="text-white font-bold text-xl">{executions}</p>
              <p className="text-slate-500 text-xs">runs</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <p className="text-white font-bold text-xl">{hoursSaved}h</p>
              <p className="text-slate-500 text-xs">saved</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <p className={`font-bold text-xl ${roiPositive ? "text-emerald-400" : "text-amber-400"}`}>
                {roiPositive ? "+" : ""}{roiPercent.toFixed(0)}%
              </p>
              <p className="text-slate-500 text-xs">ROI</p>
            </div>
          </div>

          {topWorkflow && (
            <p className="text-slate-400 text-xs pt-1">
              Top workflow: <span className="text-slate-200">{topWorkflow}</span>
            </p>
          )}

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
