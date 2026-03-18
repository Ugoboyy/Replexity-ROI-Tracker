/**
 * @param {{ label: string, value: string|React.ReactNode, subtext?: string, highlight?: "green"|"red" }} props
 */
export default function StatCard({ label, value, subtext, highlight }) {
  const valueColor =
    highlight === "green"
      ? "text-emerald-400"
      : highlight === "red"
      ? "text-red-400"
      : "text-white";

  return (
    <div className="bg-slate-800 rounded-xl p-4 min-h-24 flex flex-col justify-between">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  );
}
