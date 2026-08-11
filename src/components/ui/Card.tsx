import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: Props) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-border ${className}`}>
      {children}
    </div>
  );
}
