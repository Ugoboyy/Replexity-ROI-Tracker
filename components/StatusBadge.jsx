const statusConfig = {
  active:  { style: "bg-emerald-900/50 text-emerald-300", label: "Active" },
  frozen:  { style: "bg-amber-900/50 text-amber-300",   label: "Paused" },
  revoked: { style: "bg-red-900/50 text-red-300",       label: "Removed" },
};

/**
 * @param {{ status: "active"|"frozen"|"revoked" }} props
 */
export default function StatusBadge({ status }) {
  const { style, label } = statusConfig[status] || statusConfig.active;
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${style}`}
    >
      {label}
    </span>
  );
}
