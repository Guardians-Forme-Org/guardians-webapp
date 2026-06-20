"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import ShareButton from "@/components/ui/ShareButton";

type Props = {
  bannerUrl?: string;
  heightClass?: string;
};

export default function CircleHero({ bannerUrl, heightClass = "h-65" }: Props) {
  const router = useRouter();

  return (
    <div className={`relative ${heightClass} bg-zinc-700 overflow-hidden shrink-0`}>
      {bannerUrl ? (
        <>
          <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/images/Guardians Logo-full.png" alt="" className="w-28 h-28 object-contain" />
        </div>
      )}

      <button
        onClick={() => router.back()}
        className="absolute left-7.5 top-7.5 size-10 rounded-full bg-white flex items-center justify-center z-20 shadow-sm"
        aria-label="Back"
      >
        <ChevronLeft size={20} className="text-text-primary" />
      </button>

      <ShareButton className="absolute right-7.5 top-7.5 size-10 rounded-full bg-white border border-border flex items-center justify-center z-20" />
    </div>
  );
}
