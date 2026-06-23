"use client";

import { useRecentActivities, useUserRecentActivities, EVIDENCE_SESSION_KEY } from "@/lib/hooks/activities";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers } from "@/lib/hooks/users";
import { useMemo } from "react";
import { useRouter } from "@/i18n/navigation";

type Props =
  | { thingId: string; userId?: never }
  | { userId: string; thingId?: never };

export default function RecentActivitiesList({ thingId, userId }: Props) {
  const thing = useRecentActivities(thingId ?? "");
  const user = useUserRecentActivities(userId ?? "");
  const { data: activities = [], isLoading, error } = thingId ? thing : user;
  const { data: users = [] } = useUsers();
  const { loginData, user: authUser } = useAuth();
  const router = useRouter();

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
    return <p className="px-10 pb-7.5 text-sm text-text-muted">Loading…</p>;
  }

  if (error) {
    return <p className="px-10 pb-7.5 text-sm text-text-muted">{(error as Error).message}</p>;
  }

  if (activities.length === 0) {
    return <p className="px-10 pb-7.5 text-sm text-text-muted">No activities yet.</p>;
  }

  return (
    <div className="px-10 pb-7.5 flex flex-col gap-6">
      {activities.map((record) => {
        const { measurement } = record.data;
        const title = measurement.value > 0
          ? `${measurement.value} ${measurement.unitOfMeasure}`
          : record.stepId;
        const date = new Date(record.createdAt).toLocaleDateString("en-GB", {
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
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <p className="text-[18px] font-semibold text-[#1a1a1a]">{title}</p>
                {record.volunteerHours.value > 0 && (
                  <p className="text-[12px] text-text-secondary">
                    · {record.volunteerHours.value} {record.volunteerHours.unitOfMeasure}
                  </p>
                )}
              </div>
              <p className="text-[12px] text-[#999]">{date}</p>
            </div>
            {avatars.length > 0 && (
              <div className="flex shrink-0" style={{ width: avatars.length === 1 ? 32 : 48 }}>
                {avatars.map((avatarUrl, i) => (
                  <div
                    key={i}
                    className="size-8 rounded-full bg-[#d9d9d9] border-2 border-white overflow-hidden shrink-0"
                    style={{ marginLeft: i > 0 ? -16 : 0 }}
                  >
                    {avatarUrl && (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
