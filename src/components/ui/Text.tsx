import { type ReactNode } from "react";

type Variant =
  | "display"
  | "heading"
  | "subheading"
  | "body"
  | "caption"
  | "label";

const variants: Record<Variant, string> = {
  display: "text-2xl font-bold text-text-primary tracking-wider",
  heading: "text-lg font-bold text-text-primary",
  subheading: "text-sm font-medium text-text-subheading tracking-wider",
  body: "text-sm text-text-secondary",
  caption: "text-xs text-text-muted tracking-tight",
  label: "text-[11px] font-medium text-text-muted uppercase tracking-wide",
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
