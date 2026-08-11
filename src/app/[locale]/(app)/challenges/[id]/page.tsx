import { use } from "react";
import ChallengeScreen from "@/features/challenges/screens/ChallengeScreen";

export default function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ChallengeScreen challengeId={id} />;
}
