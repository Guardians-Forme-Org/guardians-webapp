"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiCircle, ApiCircleChallenge } from "@/lib/types/circles";

function AvatarStack({ avatars }: { avatars: string[] }) {
  return (
    <div className="flex items-center">
      {avatars.slice(0, 5).map((url, i) => (
        <div
          key={i}
          className={`size-8 rounded-full border-2 border-white overflow-hidden bg-[#d9d9d9] shrink-0 ${i > 0 ? "-ml-2" : ""}`}
        >
          {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : null}
        </div>
      ))}
    </div>
  );
}

type Props = { item: ApiCircleChallenge };

export default function ChallengeCard({ item }: Props) {
  const progress = item.steps > 0 ? Math.round((item.currentStep / item.steps) * 100) : 0;
  const since = new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const avatars = (item.members ?? []).map((m) => m.avatarUrl).filter(Boolean);

  const { data: circle } = useQuery({
    queryKey: ["circle", item.circleId],
    queryFn: () => api.get<ApiCircle>(`/circles/${item.circleId}`),
    enabled: !!item.circleId,
  });

  return (
    <Link
      href={`/challenges/${item.challengeId}`}
      className="flex h-40 rounded-[16px] border border-progress-track overflow-hidden bg-white"
    >
      {/* Left image strip */}
      <div className="w-[120px] shrink-0 bg-surface flex items-center justify-center overflow-hidden">
        <img
          src={item.bannerUrl || "/images/Guardians Logo-full.png"}
          alt={item.name}
          className={item.bannerUrl ? "w-full h-full object-cover" : "w-16 h-16 object-contain opacity-20"}
        />
      </div>

      {/* Right content */}
      <div className="flex-1 relative overflow-hidden pt-[19px] px-4 pr-8 flex flex-col">
        <ArrowRight size={20} className="absolute right-3 top-4 text-text-muted" />

        <p className="text-[18px] font-bold text-text-subheading leading-tight">{item.name}</p>
        <p className="text-[14px] text-text-subheading mt-1">Since {since}</p>
        {circle?.name && (
          <p className="text-[14px] text-text-muted">by {circle.name}</p>
        )}

        {/* Progress bar */}
        <div className="mx-[-4px] mt-2.5 h-[4px] bg-[#787878] rounded-full overflow-hidden">
          <div className="h-full bg-gotf-yellow rounded-full" style={{ width: `${progress}%` }} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-[14px] text-text-muted">
            <span className="font-bold">{item.membersCount?.total ?? item.members?.length ?? 0}</span> {item.membersCount?.label ?? "Guardians"}
          </p>
          <AvatarStack avatars={avatars} />
        </div>
      </div>
    </Link>
  );
}
