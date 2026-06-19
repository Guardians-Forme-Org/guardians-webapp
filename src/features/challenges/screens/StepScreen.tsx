"use client";

import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useChallenge } from "@/lib/hooks/challenges";
import { useUsers } from "@/lib/hooks/users";
import { canManageCircle, isWhitelisted } from "@/lib/permissions";
import type { ApiCircle } from "@/lib/types/circles";
import { STEP_FORM_CONFIGS } from "../stepFormConfig";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import ChallengeHero from "../components/ChallengeHero";

type Props = { challengeId: string; stepId: string };

export default function StepScreen({ challengeId, stepId }: Props) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const { data: challenge, isLoading } = useChallenge(challengeId);
  const { data: users = [] } = useUsers();
  const { data: circle } = useQuery({
    queryKey: ["circle", challenge?.circleId],
    queryFn: () => api.get<ApiCircle>(`/circles/${challenge!.circleId}`),
    enabled: !!challenge?.circleId,
  });
  const step = challenge?.challengeSteps?.find((s) => s.stepId === stepId);

  const canSubmit =
    isWhitelisted(user?.email) ||
    (!!circle && canManageCircle(user?.email, user?.id, circle));

  const isActionable = !!step && step.stepId in STEP_FORM_CONFIGS;

  const progress =
    challenge && challenge.steps > 0
      ? Math.round((challenge.currentStep / challenge.steps) * 100)
      : 0;

  const f = challenge?.facilitator as {
    id?: string;
    userId?: string;
    avatarUrl?: string;
    name?: string;
  } | null;
  const fUser = users.find((u) => u.id === (f?.id ?? f?.userId));
  const fAvatar = f?.avatarUrl || fUser?.user_metadata?.avatarUrl;
  const fName = fUser
    ? [fUser.user_metadata.firstName, fUser.user_metadata.lastName]
        .filter(Boolean)
        .join(" ")
    : (f?.name ?? "Facilitator");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Loading…</Text>
      </div>
    );
  }

  if (!challenge || !step) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Step not found.</Text>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col bg-white min-h-full">
        <ChallengeHero bannerUrl={challenge.bannerUrl} heightClass="h-70" />

        <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">
          {/* Identity */}
          <div className="px-10 pt-7.5 pb-0">
            <span className="inline-block bg-[#d9d9d9] rounded-[20px] px-3 py-1 text-[14px] text-text-subheading">
              {circle?.name ?? challenge.circleId}
            </span>
            <h1 className="text-[28px] font-bold text-text-subheading mt-3 leading-tight">
              {step.title}
            </h1>
            <p className="text-base text-[#666] mt-1">Step {step.stepNumber}</p>
          </div>

          {/* Progress + Actions */}
          <div className="px-10 py-7.5 border-t border-progress-track mt-5 flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <p className="text-xl font-semibold text-text-subheading">
                Progress
              </p>
              <div className="flex items-center gap-5">
                <div className="flex-1 h-2.5 bg-[#e0e0e0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gotf-yellow rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xl text-text-primary font-normal shrink-0">
                  {progress}%
                </p>
              </div>
            </div>

            {canSubmit && isActionable && (
              <div className="flex flex-col gap-2.5">
                <Link
                  href={`/challenges/${challengeId}/steps/${stepId}/log`}
                  className="w-full h-12 bg-[#1a1a1a] text-white text-base font-semibold rounded-full flex items-center justify-center"
                >
                  Upload Evidence
                </Link>
                <Link
                  href={`/challenges/${challengeId}/steps/${stepId}/log`}
                  className="w-full h-12 border border-[#1a1a1a] text-[#1a1a1a] text-base font-semibold rounded-full flex items-center justify-center"
                >
                  Mark Complete
                </Link>
              </div>
            )}
          </div>

          <div className="border-t border-progress-track" />

          {/* Description */}
          <div className="px-10 py-7.5">
            <p
              className={`text-base text-[#1a1a1a] leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}
            >
              {step.description}
            </p>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-base text-gotf-blue mt-4"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          </div>

          {/* Facilitator */}
          {!!f && (
            <>
              <div className="border-t border-progress-track" />
              <div className="flex items-center gap-5 px-10 py-5">
                <div className="size-10 rounded-full bg-surface border border-border shrink-0 overflow-hidden">
                  {fAvatar && (
                    <img
                      src={fAvatar}
                      alt={fName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="text-xl font-semibold text-text-primary">
                    {fName}
                  </p>
                  <p className="text-base font-medium text-text-secondary">
                    Facilitator
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Activities */}
          {(challenge.impactRecords ?? []).length > 0 && (
            <>
              <div className="border-t border-progress-track" />
              <div className="px-10 py-7.5 flex flex-col gap-8">
                <p className="text-xl font-semibold text-text-subheading">
                  Activities
                </p>
                {(challenge.impactRecords ?? []).map((record) => (
                  <div
                    key={record.impactRecordId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-lg font-semibold text-[#1a1a1a]">
                        {record.impactSummary.contribution.displayName}
                      </p>
                      <p className="text-sm text-[#999]">
                        {new Date(record.createdAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      {(challenge.members ?? []).slice(0, 2).map((m) => (
                        <div
                          key={m.userId}
                          className="size-8 rounded-full bg-[#d9d9d9] border-2 border-white overflow-hidden shrink-0"
                        >
                          {m.avatarUrl && (
                            <img
                              src={m.avatarUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

    </>
  );
}
