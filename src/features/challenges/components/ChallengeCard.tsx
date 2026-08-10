"use client";

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiCircle, ApiCircleChallenge } from "@/lib/types/circles";
import { calcChallengeProgress } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import Avatar from "@/components/ui/Avatar";

function AvatarStack({ avatars }: { avatars: string[] }) {
  return (
    <div className="flex items-center">
      {avatars.slice(0, 5).map((url, i) => (
        <Avatar
          key={i}
          src={url}
          className={`size-8 rounded-full border-2 border-white shrink-0 ${i > 0 ? "-ml-2" : ""}`}
        />
      ))}
    </div>
  );
}

type Props = { item: ApiCircleChallenge };

export default function ChallengeCard({ item }: Props) {
  const t = useTranslations("challenges");
  const locale = useLocale();
  const { percent: progress } = calcChallengeProgress(item);
  const since = new Date(item.createdAt).toLocaleDateString(locale, { day: "numeric", month: "long" });
  const avatars = (item.members ?? []).map((m) => m.avatarUrl).filter(Boolean);

  const { data: circle } = useQuery({
    queryKey: ["circle", item.circleId],
    queryFn: () => api.get<ApiCircle>(`/circles/${item.circleId}`),
    enabled: !!item.circleId,
  });

  return (
    <Link
      href={`/challenges/${item.challengeId}`}
      className="flex min-h-40 rounded-[16px] border border-progress-track overflow-hidden bg-white"
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
      <div className="flex-1 relative pt-2.5 px-4 pr-8 flex flex-col">
        <ArrowRight size={20} className="absolute right-3 top-3 text-text-muted" />

        <p className="text-[18px] font-bold text-text-subheading leading-tight line-clamp-2">
          {item.name}
        </p>
        {item.challengeCode && (
          <p className="text-[12px] font-medium text-text-muted mt-0.5">{item.challengeCode}</p>
        )}
        <p className="text-[14px] text-text-subheading mt-1">{t("since", { date: since })}</p>
        {circle?.name && (
          <p className="text-[14px] text-text-muted">{t("by")} {circle.name}</p>
        )}

        {/* Progress bar */}
        <div className="mx-[-4px] mt-2.5 h-[4px] bg-[#787878] rounded-full overflow-hidden">
          <div className="h-full bg-gotf-yellow rounded-full" style={{ width: `${progress}%` }} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-[14px] text-text-muted">
            {(() => { const n = item.membersCount?.total ?? item.members?.length ?? 0; return <><span className="font-bold">{n}</span> {item.membersCount?.label ?? (n === 1 ? t("guardian") : t("guardians"))}</>; })()}
          </p>
          <AvatarStack avatars={avatars} />
        </div>
      </div>
    </Link>
  );
}
