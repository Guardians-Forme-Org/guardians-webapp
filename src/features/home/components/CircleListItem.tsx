"use client";

import Link from "next/link";
import Text from "@/components/ui/Text";
import { ChevronRight } from "lucide-react";
import type { ApiCircle } from "@/lib/types/circles";
import { useTranslations, useLocale } from "next-intl";

type Props = {
  circle: ApiCircle;
  rank: number;
};

export default function CircleListItem({ circle, rank }: Props) {
  const t = useTranslations("home");
  const locale = useLocale();
  const myMember = circle.members?.[0];
  const joinDate = myMember?.joinedAt
    ? new Date(myMember.joinedAt).toLocaleDateString(locale, { day: "numeric", month: "long" })
    : null;

  return (
    <Link href={`/circles/${circle.circleId}`} className="flex items-center gap-3.75">
      <Text
        variant="body"
        className="w-2.5 text-center font-medium text-text-primary shrink-0"
      >
        {rank}
      </Text>
      <div className="size-15 rounded-lg bg-[#D1D5DB] overflow-hidden shrink-0">
        {circle.bannerUrl ? (
          <img
            src={circle.bannerUrl}
            alt={circle.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface flex items-center justify-center">
            <img src="/images/Guardians Logo-logo.png" alt="" className="w-8 h-8 object-contain opacity-20" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Text
          variant="subheading"
          className="block font-semibold text-text-primary truncate"
        >
          {circle.name}
        </Text>
        {joinDate && (
          <Text variant="caption" className="block text-text-muted">
            {t("joined", { date: joinDate })}
          </Text>
        )}
      </div>
      <ChevronRight size={16} className="text-text-muted shrink-0" />
    </Link>
  );
}
