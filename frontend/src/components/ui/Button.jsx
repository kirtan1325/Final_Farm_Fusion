import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  icon: Icon = null,
  onClick,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

  const variants = {
    primary:
      "bg-[#0F4C2A] hover:bg-[#0A341C] text-white shadow-sm border border-transparent active:scale-[0.98]",
    secondary:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-transparent active:scale-[0.98]",
    outline:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm active:scale-[0.98]",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 active:scale-[0.98]",
    danger:
      "bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
