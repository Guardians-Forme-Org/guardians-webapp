"use client";

import { use } from "react";
import { useChallenge } from "@/lib/hooks/challenges";
import CreateChallengeWizard from "@/features/challenges/screens/CreateChallengeWizard";
import Text from "@/components/ui/Text";

export default function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: challenge, isLoading, error } = useChallenge(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Loading…</Text>
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
