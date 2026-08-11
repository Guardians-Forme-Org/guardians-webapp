import type React from "react";

export default function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse bg-[#e8e8e8] rounded-md ${className}`} style={style} />;
}
