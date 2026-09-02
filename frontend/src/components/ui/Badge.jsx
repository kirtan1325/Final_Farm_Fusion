import React from "react";

export default function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  pulse = false,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap transition-colors";

  const variants = {
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-blue-50 text-blue-700 border border-blue-200",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
    emerald: "bg-emerald-100 text-emerald-800 border border-emerald-300",
    lime: "bg-lime-50 text-lime-800 border border-lime-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
