const statusConfig = {
  active:  { style: "bg-emerald-900/50 text-emerald-300", label: "Active" },
  frozen:  { style: "bg-amber-900/50 text-amber-300",   label: "Paused" },
  revoked: { style: "bg-red-900/50 text-red-300",       label: "Removed" },
};

/**
 * @param {{ status: "active"|"frozen"|"revoked", executions?: number }} props
 *
 * When `executions` is passed (dashboard only):
 *   > 0  → pulsing green "Connected"   (webhook is live and firing)
 *   === 0 → amber "No Activity"         (account active but no runs yet)
 * When `executions` is undefined (admin, or still loading) → standard status label.
 */
export default function StatusBadge({ status, executions }) {
  // Non-active statuses always show their own label unchanged
  if (status !== "active" || executions === undefined) {
    const { style, label } = statusConfig[status] || statusConfig.active;
    return (
      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${style}`}>
        {label}
      </span>
    );
  }

  // Active + webhook data available
  if (executions > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-900/50 text-emerald-300 border border-emerald-700/40">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
        Connected
      </span>
    );
  }

  // Active but zero executions — webhook not firing yet
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-900/50 text-amber-300 border border-amber-700/40">
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
      </span>
      No Activity
    </span>
  );
}
