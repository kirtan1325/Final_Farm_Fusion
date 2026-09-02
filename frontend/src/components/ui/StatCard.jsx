import React from "react";
import { Card } from "./Card";

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendLabel,
  className = "",
}) {
  return (
    <Card className={`p-5 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#0F4C2A] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {(description || trendLabel) && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
            {trend && (
              <span
                className={`font-semibold flex items-center gap-0.5 ${
                  trend === "up"
                    ? "text-emerald-600"
                    : trend === "down"
                    ? "text-red-600"
                    : "text-slate-500"
                }`}
              >
                {trend === "up" ? "▲" : trend === "down" ? "▼" : "•"} {trendLabel}
              </span>
            )}
            {description && <span className="text-slate-500">{description}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}
