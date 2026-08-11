"use client";

import { use } from "react";
import { useChallenge } from "@/lib/hooks/challenges";
import CreateChallengeWizard from "@/features/challenges/screens/CreateChallengeWizard";
import Text from "@/components/ui/Text";
import Skeleton from "@/components/ui/Skeleton";

export default function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: challenge, isLoading, error } = useChallenge(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-7 px-10 pt-7 pb-10">
        <div>
          <Skeleton className="h-9 w-2/3 mb-3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-[60px] w-full rounded-[8px]" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-[60px] w-full rounded-[8px]" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-32 w-full rounded-[8px]" />
        </div>
        <Skeleton className="h-40 w-full rounded-[12px]" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Challenge not found.</Text>
      </div>
    );
  }

  return (
    <CreateChallengeWizard
      circleId={challenge.circleId}
      editChallenge={challenge}
    />
  );
}
