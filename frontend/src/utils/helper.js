// src/utils/helpers.js
// Shared helper functions used across multiple page components

// Format a number as currency: 1250 → "$1,250.00"
export const fmt = (n) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

// Format an ISO date string: "2023-10-24T..." → "Oct 24, 2023"
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// Get initials from a full name: "John Doe" → "JD"
export const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// Pick a consistent avatar color based on name
export const AVATAR_COLORS = [
  { bg: "#dcfce7", tc: "#166534" },
  { bg: "#dbeafe", tc: "#1d4ed8" },
  { bg: "#fce7f3", tc: "#9d174d" },
  { bg: "#ede9fe", tc: "#5b21b6" },
  { bg: "#fef9c3", tc: "#854d0e" },
  { bg: "#ffedd5", tc: "#9a3412" },
  { bg: "#f0fdf4", tc: "#166534" },
  { bg: "#fef2f2", tc: "#991b1b" },
];

export const getAvatarColor = (name = "") =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// Pick a consistent card background gradient based on MongoDB _id
export const BG_GRADIENTS = [
  "from-red-900 to-red-700",
  "from-amber-900 to-amber-700",
  "from-green-900 to-green-700",
  "from-orange-800 to-orange-600",
  "from-purple-900 to-purple-700",
  "from-teal-900 to-teal-700",
  "from-blue-900 to-blue-700",
  "from-lime-900 to-lime-700",
];

export const getCardBg = (id = "") =>
  BG_GRADIENTS[id.charCodeAt(id.length - 1) % BG_GRADIENTS.length];