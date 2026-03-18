"use client";

const SATISFACTION_EMOJI = { 1: "😟", 2: "😐", 3: "🙂", 4: "😊", 5: "🤩" };

export default function LogList({ logs, logFrequency }) {
  const period = logFrequency === "monthly" ? "month" : "week";

  if (!logs || logs.length === 0) {
    return (
      <p className="text-slate-500 text-center text-sm py-8">
        No entries yet. Log your first {period} to get started.
      </p>
    );
  }

  const sorted = [...logs].reverse();

  return (
    <div className="space-y-3">
      {sorted.map((log, i) => (
        <div key={log.id ?? i} className="bg-slate-800 rounded-xl p-4">
          {/* Row 1 – period label + satisfaction */}
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-100">
              {log.period_label}
            </span>
            <span className="text-lg">
              {SATISFACTION_EMOJI[log.satisfaction] ?? ""}
            </span>
          </div>

          {/* Row 2 – chips */}
          <div className="flex gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center rounded-full bg-emerald-900/50 text-emerald-300 text-xs px-2.5 py-0.5">
              {log.hours_saved} hrs saved
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-900/50 text-blue-300 text-xs px-2.5 py-0.5">
              ${Number(log.money_saved).toLocaleString()} saved
            </span>
          </div>

          {/* Row 3 – errors caught */}
          {Number(log.errors_caught) > 0 && (
            <p className="text-xs text-slate-400 mb-2">
              {log.errors_caught} errors caught
            </p>
          )}

          {/* Row 4 – AI insight */}
          {log.ai_insight && (
            <p className="text-sm text-slate-400 italic">
              💡 {log.ai_insight}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
