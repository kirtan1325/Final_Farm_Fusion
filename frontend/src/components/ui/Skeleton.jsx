import React from "react";

export default function Skeleton({ className = "" }) {
  return <div className={`ff-shimmer rounded-md ${className}`} />;
}
