"use client";

import Text from "@/components/ui/Text";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useChallenge, useMarkStepComplete, useTemplates } from "@/lib/hooks/challenges";
import { useUsers } from "@/lib/hooks/users";
import { canManageCircle, isWhitelisted } from "@/lib/permissions";
import { computeChallengeRoles } from "@/lib/roles";
import RoleBadge from "@/components/ui/RoleBadge";
import type { ApiCircle } from "@/lib/types/circles";
import { STEP_FORM_CONFIGS } from "../stepFormConfig";
import { calcChallengeProgress } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import ChallengeHero from "../components/ChallengeHero";
import Avatar from "@/components/ui/Avatar";
import JoinConversationButton from "@/components/ui/JoinConversationButton";
import RecentActivitiesList from "@/components/ui/RecentActivitiesList";
import { useTranslations } from "next-intl";

type Props = { challengeId: string; stepId: string };

export default function StepScreen({ challengeId, stepId }: Props) {
  const t = useTranslations("challenges");
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const markComplete = useMarkStepComplete();

  const { data: challenge, isLoading } = useChallenge(challengeId);
  const { data: users = [] } = useUsers();
  const { data: templates } = useTemplates();
  const { data: circle } = useQuery({
    queryKey: ["circle", challenge?.circleId],
    queryFn: () => api.get<ApiCircle>(`/circles/${challenge!.circleId}`),
    enabled: !!challenge?.circleId,
  });
  const step = challenge?.challengeSteps?.find((s) => s.stepId === stepId);

  const templateStepForm = useMemo(() => {
    if (!challenge?.templateId || !templates) return null;
    const tmpl = templates.find((t) => t.templateId === challenge.templateId);
    return tmpl?.steps?.find((s) => s.stepId === stepId)?.form ?? null;
  }, [challenge?.templateId, templates, stepId]);

  const f = challenge?.facilitator as {
    id?: string;
    userId?: string;
    avatarUrl?: string;
    name?: string;
  } | null;

  const facilitatorId = f?.id ?? f?.userId;
  const canSubmit =
    isWhitelisted(user?.email) ||
    (!!circle && canManageCircle(user?.email, user?.id, circle)) ||
    (!!user?.id && !!facilitatorId && user.id === facilitatorId);

  const isActionable = !!step && (
    step.stepId in STEP_FORM_CONFIGS ||
    (step.form?.length ?? 0) > 0 ||
    (templateStepForm?.length ?? 0) > 0
  );

  const { percent: progress } = challenge ? calcChallengeProgress(challenge) : { percent: 0 };
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
        <Text variant="body">{t("loading")}</Text>
      </div>
    );
  }

  if (!challenge || !step) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">{t("stepNotFound")}</Text>
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
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <p className="text-base text-[#666]">{t("stepNumber", { number: step.stepNumber })}</p>
              <RoleBadge roles={computeChallengeRoles(user?.id, user?.email, challenge)} />
            </div>
          </div>

          {/* Progress + Actions */}
          <div className="px-10 py-7.5 border-t border-progress-track mt-5 flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <p className="text-xl font-semibold text-text-subheading">
                {t("progress")}
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

            <JoinConversationButton
              channels={challenge.communicationChannels}
              members={challenge.members}
              userId={user?.id}
            />

            {canSubmit && isActionable && (
              <div className="flex flex-col gap-2.5">
                <Link
                  href={`/challenges/${challengeId}/steps/${stepId}/log`}
                  className="w-full h-12 bg-[#1a1a1a] text-white text-base font-semibold rounded-full flex items-center justify-center"
                >
                  {t("uploadEvidence")}
                </Link>

                {step.isCompleted ? (
                  <div className="w-full h-12 border border-gotf-green text-gotf-green text-base font-semibold rounded-full flex items-center justify-center gap-2">
                    <span>✓</span> {t("completed")}
                  </div>
                ) : confirming ? (
                  <div className="flex flex-col gap-2.5">
                    {markComplete.isError && (
                      <p className="text-red-500 text-sm text-center">
                        {markComplete.error instanceof Error
                          ? markComplete.error.message
                          : t("failedRetry")}
                      </p>
                    )}
                    <button
                      onClick={() =>
                        markComplete.mutate(
                          {
                            challengeId,
                            step: {
                              stepNumber: step.stepNumber,
                              stepType: step.stepType,
                              stepId: step.stepId,
                              title: step.title,
                              description: step.description,
                              isCompleted: true,
                            },
                          },
                          { onSuccess: () => setConfirming(false) },
                        )
                      }
                      disabled={markComplete.isPending}
                      className="w-full h-12 bg-gotf-green text-white text-base font-semibold rounded-full flex items-center justify-center"
                    >
                      {markComplete.isPending ? t("saving") : t("confirmComplete")}
                    </button>
                    <button
                      onClick={() => { setConfirming(false); markComplete.reset(); }}
                      className="w-full h-12 border border-[#1a1a1a] text-[#1a1a1a] text-base font-semibold rounded-full flex items-center justify-center"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirming(true)}
                    className="w-full h-12 border border-[#1a1a1a] text-[#1a1a1a] text-base font-semibold rounded-full flex items-center justify-center"
                  >
                    {t("markComplete")}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Facilitator */}
          {!!f && (
            <>
              <div className="border-t border-progress-track" />
              <div className="flex items-center gap-5 px-10 py-5">
                <Avatar src={fAvatar} alt={fName} className="size-10 rounded-full border border-border shrink-0" />
                <div>
                  <p className="text-xl font-semibold text-text-primary">
                    {fName}
                  </p>
                  <p className="text-base font-medium text-text-secondary">
                    {t("facilitator")}
                  </p>
                </div>
              </div>
            </>
          )}

          {!!step.description && (
            <>
              <div className="border-t border-progress-track" />
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
                  {expanded ? t("showLess") : t("showMore")}
                </button>
              </div>
            </>
          )}

          {/* Activities log */}
          <div className="border-t border-progress-track" />
          <div className="px-10 pt-7.5 pb-3">
            <p className="text-xl font-semibold text-text-subheading">{t("tabActivities")}</p>
          </div>
          <RecentActivitiesList thingId={challenge.challengeId} filterStepId={stepId} />

        </div>
      </div>

    </>
  );
}
