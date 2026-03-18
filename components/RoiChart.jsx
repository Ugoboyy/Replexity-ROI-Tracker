"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RoiChart({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <p className="text-slate-500 text-center text-sm">
          Log your first entry to see your savings chart
        </p>
      </div>
    );
  }

  let running = 0;
  const data = logs.map((log) => {
    running += Number(log.money_saved);
    return { name: log.period_label, value: running };
  });

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => {
              const parts = v.split(" ");
              return parts.length > 1
                ? parts[0].charAt(0) + parts[parts.length - 1]
                : v;
            }}
          />
          <YAxis hide={true} />

          <Tooltip
            contentStyle={{
              backgroundColor: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13px",
            }}
            formatter={(value) => [
              `$${Number(value).toLocaleString()}`,
              "Savings",
            ]}
            labelStyle={{ color: "#94a3b8", fontSize: "11px" }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#7C3AED"
            strokeWidth={2}
            fill="url(#purpleGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
