"use client";

import { ChevronLeft, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  heightClass?: string;
};

export default function CircleHero({ heightClass = "h-65" }: Props) {
  const router = useRouter();

  return (
    <div className={`relative ${heightClass} bg-zinc-900 overflow-hidden shrink-0`}>
      <div className="absolute inset-0 bg-black/20 z-10" />

      <button
        onClick={() => router.back()}
        className="absolute left-7.5 top-7.5 size-10 rounded-full bg-white flex items-center justify-center z-20 shadow-sm"
        aria-label="Back"
      >
        <ChevronLeft size={20} className="text-text-primary" />
      </button>

      <button
        className="absolute right-7.5 top-7.5 size-10 rounded-full bg-white border border-border flex items-center justify-center z-20"
        aria-label="Share"
      >
        <Share2 size={16} className="text-text-primary" />
      </button>
    </div>
  );
}
