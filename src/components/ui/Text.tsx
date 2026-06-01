import { type ReactNode } from "react";

type Variant =
  | "display"
  | "heading"
  | "subheading"
  | "body"
  | "caption"
  | "label";

const variants: Record<Variant, string> = {
  display: "text-2xl font-bold text-[#0A0A0A] tracking-wider",
  heading: "text-base font-semibold text-[#0A0A0A]",
  subheading: "text-sm font-medium text-[#374151] tracking-wider",
  body: "text-sm text-[#6B7280]",
  caption: "text-xs text-[#9CA3AF] tracking-tight",
  label: "text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide",
};

type Props = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

export default function Text({
  variant = "body",
  className = "",
  children,
}: Props) {
  return (
    <span className={`${variants[variant]} ${className}`}>{children}</span>
  );
}
