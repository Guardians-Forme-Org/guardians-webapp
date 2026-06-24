"use client";

import { useTranslations } from "next-intl";
import type { CircleCommunicationChannel } from "@/lib/types/circles";

type Props = {
  channels: CircleCommunicationChannel[] | null | undefined;
  members?: Array<{ userId: string }> | null;
  userId?: string | null;
  className?: string;
};

export default function JoinConversationButton({ channels, members, userId, className }: Props) {
  const t = useTranslations("common");
  const channel = channels?.[0];
  if (!channel) return null;

  // When member data is provided, only render for members
  if (members !== undefined && (!userId || !members?.some((m) => m.userId === userId))) {
    return null;
  }

  return (
    <a
      href={channel.url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "px-5 h-12 bg-[#1a1a1a] text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)] flex items-center justify-center"
      }
    >
      {t("joinConversation")}
    </a>
  );
}
