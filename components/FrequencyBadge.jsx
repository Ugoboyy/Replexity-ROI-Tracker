/**
 * @param {{ frequency: "weekly"|"monthly" }} props
 */
export default function FrequencyBadge({ frequency }) {
  const isMonthly = frequency === "monthly";
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
        isMonthly
          ? "bg-purple-900/50 text-purple-300"
          : "bg-blue-900/50 text-blue-300"
      }`}
    >
      {isMonthly ? "Monthly" : "Weekly"}
    </span>
  );
}
