"use client";

import { useRecentActivities, useUserRecentActivities, EVIDENCE_SESSION_KEY } from "@/lib/hooks/activities";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers } from "@/lib/hooks/users";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useRouter } from "@/i18n/navigation";

type Props =
  | { thingId: string; filterStepId?: string; userId?: never }
  | { userId: string; filterStepId?: never; thingId?: never };

function formatStepId(stepId: string): string {
  return stepId
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RecentActivitiesList({ thingId, filterStepId, userId }: Props) {
  const thing = useRecentActivities(thingId ?? "");
  const user = useUserRecentActivities(userId ?? "");
  const { data: rawActivities = [], isLoading, error } = thingId ? thing : user;
  const activities = filterStepId
    ? rawActivities.filter((a) => a.stepId === filterStepId)
    : rawActivities;
  const { data: users = [] } = useUsers();
  const { loginData, user: authUser } = useAuth();
  const router = useRouter();
  const t = useTranslations("common");

  const avatarMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      if (u.user_metadata?.avatarUrl) map.set(u.id, u.user_metadata.avatarUrl);
    });
    loginData?.challenges.forEach((c) =>
      (c.members ?? []).forEach((m) => { if (m.avatarUrl) map.set(m.userId, m.avatarUrl); })
    );
    loginData?.circles.forEach((c) =>
      c.members.forEach((m) => { if (m.avatarUrl) map.set(m.userId, m.avatarUrl); })
    );
    return map;
  }, [users, loginData]);

  if (isLoading) {
    return (
      <div className="px-10 pb-7.5 flex flex-col gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex" style={{ width: 48 }}>
              <Skeleton className="size-8 rounded-full border-2 border-white" />
              <Skeleton className="size-8 rounded-full border-2 border-white -ml-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="px-10 pb-7.5 text-sm text-text-muted">{(error as Error).message}</p>;
  }

  if (activities.length === 0) {
    return <p className="px-10 pb-7.5 text-sm text-text-muted">{t("noActivities")}</p>;
  }

  return (
    <div className="px-10 pb-7.5 flex flex-col gap-6 fade-up">
      {activities.map((record) => {
        const { measurement } = record.data;
        const title = measurement?.value > 0
          ? `${measurement.value} ${measurement.unitOfMeasure}`
          : formatStepId(record.stepId);
        const date = new Date(record.createdAt).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const avatars = record.contributors.slice(0, 2).map((id) =>
          avatarMap.get(id) ?? null
        );
        const isClickable = !!authUser;
        const handleClick = () => {
          sessionStorage.setItem(EVIDENCE_SESSION_KEY(record.id), JSON.stringify(record));
          router.push(`/challenges/${record.thingId}/steps/${record.stepId}/log?view=${record.id}`);
        };
        return (
          <div
            key={record.id}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={isClickable ? handleClick : undefined}
            onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") handleClick(); } : undefined}
            className={`flex items-center justify-between ${isClickable ? "cursor-pointer active:opacity-70" : ""}`}
          >
            <div className="flex flex-col gap-1 min-w-0 flex-1 pr-3">
              <div className="flex items-baseline gap-2 min-w-0">
                <p className="text-[18px] font-semibold text-[#1a1a1a] truncate">{title}</p>
                {record.volunteerHours.value > 0 && (
                  <p className="text-[12px] text-text-secondary shrink-0">
                    · {record.volunteerHours.value} {record.volunteerHours.unitOfMeasure}
                  </p>
                )}
              </div>
              <p className="text-[12px] text-[#999]">{date}</p>
            </div>
            {avatars.length > 0 && (
              <div className="flex shrink-0" style={{ width: avatars.length === 1 ? 32 : 48 }}>
                {avatars.map((avatarUrl, i) => (
                  <Avatar
                    key={i}
                    src={avatarUrl}
                    className="size-8 rounded-full border-2 border-white shrink-0"
                    style={{ marginLeft: i > 0 ? -16 : 0 }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
